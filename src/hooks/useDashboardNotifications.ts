"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";
import type { Notification } from "@/hooks/useNotifications";

type DashboardNotificationApiItem = {
  id: string;
  type: Notification["type"];
  title: string;
  message: string;
  occurred_at: string;
  action_url?: string | null;
  is_read?: boolean;
};

type DashboardNotificationsResponse = {
  is_instructor: boolean;
  notifications: DashboardNotificationApiItem[];
};

type DashboardNotificationState = {
  isInstructor: boolean;
  notifications: Notification[];
  updatedAt: number;
};

const READ_STORAGE_KEY = "dashboard-notification-read-state-v1";
const FEED_STORAGE_KEY = "dashboard-notifications-shared-v1";
const FEED_TTL_MS = 2 * 60 * 1000;

let sharedState: DashboardNotificationState | null = null;
let inFlightFetch: Promise<void> | null = null;
const listeners = new Set<(state: DashboardNotificationState) => void>();

function getEmptyState(): DashboardNotificationState {
  return { isInstructor: false, notifications: [], updatedAt: 0 };
}

function isLocalizedPath(path: string): boolean {
  return path.startsWith("/ka/") || path.startsWith("/en/");
}

function readReadMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeReadMap(notifications: Notification[]) {
  if (typeof window === "undefined") return;
  const next: Record<string, boolean> = {};
  for (const item of notifications) {
    if (item.isRead) next[item.id] = true;
  }
  window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
}

function serializeState(state: DashboardNotificationState) {
  return {
    isInstructor: state.isInstructor,
    updatedAt: state.updatedAt,
    notifications: state.notifications.map((n) => ({
      ...n,
      timestamp: n.timestamp.toISOString(),
    })),
  };
}

function deserializeState(raw: unknown): DashboardNotificationState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as {
    isInstructor?: boolean;
    updatedAt?: number;
    notifications?: Array<Omit<Notification, "timestamp"> & { timestamp: string }>;
  };
  if (!Array.isArray(parsed.notifications)) return null;

  return {
    isInstructor: Boolean(parsed.isInstructor),
    updatedAt: Number(parsed.updatedAt || 0),
    notifications: parsed.notifications.map((n) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    })),
  };
}

function readFeedCache(): DashboardNotificationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FEED_STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as { timestamp?: number; data?: unknown };
    if (!payload.timestamp || Date.now() - payload.timestamp > FEED_TTL_MS) {
      window.sessionStorage.removeItem(FEED_STORAGE_KEY);
      return null;
    }
    const state = deserializeState(payload.data);
    return state;
  } catch {
    window.sessionStorage.removeItem(FEED_STORAGE_KEY);
    return null;
  }
}

function writeFeedCache(state: DashboardNotificationState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    FEED_STORAGE_KEY,
    JSON.stringify({ timestamp: Date.now(), data: serializeState(state) })
  );
}

function emitState() {
  if (!sharedState) return;
  for (const listener of listeners) {
    listener(sharedState);
  }
}

function patchState(next: DashboardNotificationState) {
  sharedState = next;
  writeReadMap(next.notifications);
  writeFeedCache(next);
  emitState();
}

function mapApiToNotifications(payload: DashboardNotificationsResponse): Notification[] {
  const localRead = readReadMap();
  return (payload.notifications || []).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    timestamp: new Date(item.occurred_at),
    isRead: Boolean(item.is_read || localRead[item.id]),
    actionUrl: item.action_url || undefined,
  }));
}

async function fetchNotifications(
  getToken: () => Promise<string | null>,
  force = false
): Promise<void> {
  const cached = readFeedCache();
  if (!force && cached) {
    sharedState = cached;
    emitState();
    return;
  }

  if (inFlightFetch) {
    await inFlightFetch;
    return;
  }

  inFlightFetch = (async () => {
    const token = await getToken();
    if (!token) {
      patchState(getEmptyState());
      return;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (!sharedState) patchState(getEmptyState());
      return;
    }

    const payload = (await response.json()) as DashboardNotificationsResponse;
    const next: DashboardNotificationState = {
      isInstructor: Boolean(payload.is_instructor),
      notifications: mapApiToNotifications(payload),
      updatedAt: Date.now(),
    };
    patchState(next);
  })().finally(() => {
    inFlightFetch = null;
  });

  await inFlightFetch;
}

function localizeActionUrl(actionUrl: string | undefined, localeHref: (path: string) => string): string | undefined {
  if (!actionUrl) return undefined;
  if (isLocalizedPath(actionUrl)) return actionUrl;
  if (!actionUrl.startsWith("/")) return actionUrl;
  return localeHref(actionUrl);
}

function enrichLessonsActionUrl(notification: Notification): string | undefined {
  const actionUrl = notification.actionUrl;
  if (!actionUrl) return actionUrl;
  if (!actionUrl.includes("/dashboard/lessons")) return actionUrl;

  const [basePath, rawQuery = ""] = actionUrl.split("?");
  const params = new URLSearchParams(rawQuery);

  if (notification.type === "cancellation" && notification.id.startsWith("cancel-")) {
    if (!params.has("tab")) params.set("tab", "cancelled");
    if (!params.has("cancellationId")) params.set("cancellationId", notification.id.replace("cancel-", ""));
  }

  if ((notification.type === "booking" || notification.type === "reminder") && notification.id.startsWith("booking-")) {
    if (!params.has("tab")) params.set("tab", "upcoming");
    if (!params.has("bookingId")) params.set("bookingId", notification.id.replace("booking-", ""));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function useDashboardNotifications(options?: {
  enabled?: boolean;
  localeHref?: (path: string) => string;
}) {
  const { getToken } = useClerkAuth();
  const enabled = options?.enabled ?? true;
  const localeHref = options?.localeHref;

  // Keep first render deterministic across SSR and client hydration.
  // Cached/shared data is applied after mount in an effect.
  const [state, setState] = useState<DashboardNotificationState>(getEmptyState);

  useEffect(() => {
    const listener = (next: DashboardNotificationState) => setState(next);
    listeners.add(listener);

    if (sharedState) {
      setState(sharedState);
    } else {
      const cached = readFeedCache();
      if (cached) {
        sharedState = cached;
        setState(cached);
      }
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void fetchNotifications(getToken, false);
  }, [enabled, getToken]);

  const isApplicationNotification = (id: string) => id.startsWith("application-");

  const markAsRead = useCallback((id: string) => {
    if (isApplicationNotification(id)) return;

    const current = sharedState ?? state;
    const next: DashboardNotificationState = {
      ...current,
      notifications: current.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      updatedAt: Date.now(),
    };
    patchState(next);

    void (async () => {
      const token = await getToken();
      if (!token) return;
      await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/notifications/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      });
    })();
  }, [getToken, state]);

  const markAsUnread = useCallback((id: string) => {
    if (isApplicationNotification(id)) return;

    const current = sharedState ?? state;
    const next: DashboardNotificationState = {
      ...current,
      notifications: current.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      updatedAt: Date.now(),
    };
    patchState(next);

    void (async () => {
      const token = await getToken();
      if (!token) return;
      await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/notifications/unread`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id }),
      });
    })();
  }, [getToken, state]);

  const markAllAsRead = useCallback(() => {
    const current = sharedState ?? state;
    const ids = current.notifications.filter((n) => !isApplicationNotification(n.id)).map((n) => n.id);
    const next: DashboardNotificationState = {
      ...current,
      notifications: current.notifications.map((n) => (isApplicationNotification(n.id) ? n : { ...n, isRead: true })),
      updatedAt: Date.now(),
    };
    patchState(next);

    void (async () => {
      const token = await getToken();
      if (!token || ids.length === 0) return;
      await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/notifications/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: ids }),
      });
    })();
  }, [getToken, state]);

  const removeNotification = useCallback((id: string) => {
    const current = sharedState ?? state;
    const next: DashboardNotificationState = {
      ...current,
      notifications: current.notifications.filter((n) => n.id !== id),
      updatedAt: Date.now(),
    };
    patchState(next);
  }, [state]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await fetchNotifications(getToken, true);
  }, [enabled, getToken]);

  const notifications = useMemo(() => {
    const withFallbackUrls = state.notifications.map((n) => ({
      ...n,
      actionUrl: enrichLessonsActionUrl(n),
    }));

    if (!localeHref) return withFallbackUrls;

    return withFallbackUrls.map((n) => ({
      ...n,
      actionUrl: localizeActionUrl(n.actionUrl, localeHref),
    }));
  }, [localeHref, state.notifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return {
    isInstructor: state.isInstructor,
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    removeNotification,
    refresh,
  };
}
