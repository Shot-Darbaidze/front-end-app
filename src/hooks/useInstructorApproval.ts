"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";

const APPROVAL_SESSION_KEY_PREFIX = "instructor-approval";
const APPROVAL_LOCAL_KEY_PREFIX = "instructor-approval-v2";

type ApprovalPayload = {
  user_id: string;
  is_approved?: boolean | null;
  instructor_type?: string | null;
  timestamp?: number;
};

function sessionKey(userId: string) {
  return `${APPROVAL_SESSION_KEY_PREFIX}:${userId}`;
}

function localKey(userId: string) {
  return `${APPROVAL_LOCAL_KEY_PREFIX}:${userId}`;
}

function readCachedApproval(userId: string): { isApproved: boolean; instructorType: string | null } | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionRaw = window.sessionStorage.getItem(sessionKey(userId));
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as ApprovalPayload;
      if (typeof parsed?.is_approved === "boolean") {
        return { isApproved: parsed.is_approved, instructorType: parsed.instructor_type ?? null };
      }
    }
  } catch {
    window.sessionStorage.removeItem(sessionKey(userId));
  }

  try {
    const localRaw = window.localStorage.getItem(localKey(userId));
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as ApprovalPayload;
      if (typeof parsed?.is_approved === "boolean") {
        return { isApproved: parsed.is_approved, instructorType: parsed.instructor_type ?? null };
      }
    }
  } catch {
    window.localStorage.removeItem(localKey(userId));
  }

  return null;
}

function writeCachedApproval(userId: string, isApproved: boolean, instructorType: string | null) {
  if (typeof window === "undefined") return;

  const payload: ApprovalPayload = { user_id: userId, is_approved: isApproved, instructor_type: instructorType, timestamp: Date.now() };
  window.sessionStorage.setItem(sessionKey(userId), JSON.stringify(payload));
  window.localStorage.setItem(localKey(userId), JSON.stringify(payload));
}

export function useInstructorApproval() {
  const { getToken, isLoaded } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const userId = user?.id;

  // Read from cache synchronously on the render where userId becomes available.
  // useMemo re-runs when userId changes, so the cached value is visible on the
  // exact render where Clerk resolves the user — no extra useEffect→setState cycle.
  const fromCache = useMemo(() => {
    if (!userId || typeof window === "undefined") return null;
    return readCachedApproval(userId);
  }, [userId]);

  // API result — keyed by userId so stale data from a previous account is never used
  const [fromApi, setFromApi] = useState<{ userId: string; isApproved: boolean; instructorType: string | null } | null>(null);

  // Prefer fresh API data (if it matches the current user); fall back to synchronous cache
  const relevantFromApi = fromApi?.userId === userId ? fromApi : null;
  const resolved = relevantFromApi ?? fromCache;

  const isInstructor = resolved?.isApproved ?? false;
  const isEmployee = resolved?.instructorType === "employee";
  // Still loading while Clerk hasn't resolved, or user is known but we have no data yet
  const isLoading = !isLoaded || !isUserLoaded || (!!userId && resolved === null);

  useEffect(() => {
    let isMounted = true;

    const checkApproval = async () => {
      if (!isLoaded || !isUserLoaded || !userId) return;

      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (isMounted) setFromApi({ userId, isApproved: false, instructorType: null });
          return;
        }

        const result: ApprovalPayload = await response.json();
        const approved = Boolean(result?.is_approved);
        const instrType = (result as ApprovalPayload & { instructor_type?: string }).instructor_type ?? null;
        writeCachedApproval(userId, approved, instrType);

        if (isMounted) setFromApi({ userId, isApproved: approved, instructorType: instrType });
      } catch {
        // API failed — fromCache already provides the fallback value
      }
    };

    void checkApproval();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isUserLoaded, userId]);

  return { isInstructor, isEmployee, isLoading };
}
