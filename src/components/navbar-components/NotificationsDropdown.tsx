"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";
import {
  Bell,
  Check,
  X,
} from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { getNotificationIcon, getTimeAgo } from "@/utils/notifications";
import { useLocaleHref } from "@/hooks/useLocaleHref";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
}

interface Invite {
  id: string;
  autoschool_id: string;
  autoschool_name: string;
  autoschool_city?: string | null;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  onToggle,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
}) => {
  const { getToken, isSignedIn } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const localeHref = useLocaleHref();
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [responding, setResponding] = React.useState<string | null>(null);
  const [inviteLoadFailed, setInviteLoadFailed] = React.useState(false);
  const [withdrawingNotificationId, setWithdrawingNotificationId] = React.useState<string | null>(null);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);

  const isApplicationNotification = (notificationId: string) => notificationId.startsWith("application-");
  const applicationNotifications = notifications.filter((n) => isApplicationNotification(n.id));
  const regularNotifications = notifications.filter((n) => !isApplicationNotification(n.id));

  const totalUnreadCount = unreadCount + invites.length;

  const fetchInvites = React.useCallback(async () => {
    if (!isSignedIn) {
      setInvites([]);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/me/autoschool-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setInviteLoadFailed(true);
        return;
      }

      const payload = (await response.json()) as Invite[];
      setInvites(payload.filter((invite) => invite.status === "pending"));
      setInviteLoadFailed(false);
    } catch {
      setInviteLoadFailed(true);
    }
  }, [getToken, isSignedIn]);

  const respondToInvite = React.useCallback(async (inviteId: string, accept: boolean) => {
    if (accept) {
      return;
    }

    setResponding(inviteId);
    try {
      const token = await getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/me/autoschool-invites/${inviteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accept: false }),
      });

      if (response.ok) {
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      }
    } finally {
      setResponding(null);
    }
  }, [getToken]);

  const getSafeActionHref = (actionUrl?: string) => {
    if (!actionUrl) return undefined;
    if (actionUrl.startsWith("/ka/") || actionUrl.startsWith("/en/")) return actionUrl;
    if (!actionUrl.startsWith("/")) return actionUrl;
    return localeHref(actionUrl);
  };

  const withdrawApplication = React.useCallback(async (notificationId: string) => {
    setWithdrawError(null);
    setWithdrawingNotificationId(notificationId);
    try {
      const token = await getToken();
      if (!token) {
        setWithdrawError("Please sign in again and retry.");
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/application`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let detail = "Failed to withdraw application.";
        try {
          const data = await response.json();
          if (typeof data?.detail === "string" && data.detail.trim()) {
            detail = data.detail;
          }
        } catch {
          // ignore parse errors
        }
        setWithdrawError(detail);
        return;
      }

      onRemove(notificationId);
    } catch {
      setWithdrawError("Failed to withdraw application.");
    } finally {
      setWithdrawingNotificationId(null);
    }
  }, [getToken, onRemove]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    void fetchInvites();

    const timer = window.setInterval(() => {
      void fetchInvites();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [fetchInvites]);

  useEffect(() => {
    if (isOpen) {
      void fetchInvites();
    }
  }, [isOpen, fetchInvites]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className="p-2 text-gray-600 hover:text-[#F03D3D] transition-colors rounded-full hover:bg-gray-50 relative"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#F03D3D] rounded-full text-white text-xs font-bold flex items-center justify-center px-1">
            {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {totalUnreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#F03D3D] text-white text-xs font-medium rounded-full">
                  {totalUnreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-[#F03D3D] hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {inviteLoadFailed && (
              <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
                Could not refresh autoschool invites. Retrying...
              </div>
            )}

            {withdrawError && (
              <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">
                {withdrawError}
              </div>
            )}

            {invites.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 bg-red-50/40 space-y-2">
                <p className="text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Autoschool invites
                </p>
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-red-100 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">{invite.autoschool_name}</p>
                    {invite.autoschool_city && (
                      <p className="text-xs text-gray-500 mt-0.5">{invite.autoschool_city}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => void respondToInvite(invite.id, false)}
                        disabled={responding === invite.id}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <Link
                        href={`${localeHref("/for-instructors/invite-signup")}?inviteId=${encodeURIComponent(invite.id)}`}
                        onClick={onClose}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F03D3D] text-white hover:bg-red-700"
                      >
                        Continue
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {applicationNotifications.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/40 space-y-2">
                <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                  Instructor application
                </p>
                {applicationNotifications.map((notification) => (
                  <div key={notification.id} className="rounded-lg border border-blue-100 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{getTimeAgo(notification.timestamp)}</span>
                      <button
                        onClick={() => void withdrawApplication(notification.id)}
                        disabled={withdrawingNotificationId === notification.id}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60"
                      >
                        {withdrawingNotificationId === notification.id ? "Withdrawing..." : "Withdraw application"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {regularNotifications.length === 0 && invites.length === 0 && applicationNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-gray-400 text-sm">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {regularNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors relative group ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          !notification.isRead ? "bg-white" : "bg-gray-100"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {/* Remove button */}
                          {!isApplicationNotification(notification.id) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemove(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                              aria-label="Remove notification"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                          {isApplicationNotification(notification.id) ? (
                            <button
                              onClick={() => void withdrawApplication(notification.id)}
                              disabled={withdrawingNotificationId === notification.id}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold disabled:opacity-60"
                            >
                              {withdrawingNotificationId === notification.id ? "Withdrawing..." : "Withdraw application"}
                            </button>
                          ) : notification.actionUrl ? (
                            <Link
                              href={getSafeActionHref(notification.actionUrl) || "#"}
                              onClick={() => {
                                onMarkAsRead(notification.id);
                                onClose();
                              }}
                              className="text-xs text-[#F03D3D] hover:text-red-700 font-medium"
                            >
                              View details →
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-[#F03D3D] rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {(regularNotifications.length > 0 || invites.length > 0 || applicationNotifications.length > 0) && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <Link
                href={localeHref("/dashboard/notifications")}
                onClick={onClose}
                className="block text-center text-sm text-[#F03D3D] hover:text-red-700 font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
