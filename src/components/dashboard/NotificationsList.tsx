"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Bell,
  Check,
  Trash2,
} from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { getNotificationIcon, getNotificationColor, getTimeAgo } from "@/utils/notifications";
import Button from "@/components/ui/Button";
import { API_CONFIG } from "@/config/constants";

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onRemove,
}) => {
  const { getToken } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const isApplicationNotification = useCallback(
    (id: string) => id.startsWith("application-") || id.startsWith("autoschool-application-"),
    []
  );

  const { filteredNotifications, unreadCount } = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead);
    const application = notifications.filter((n) => isApplicationNotification(n.id));
    const regular = notifications.filter((n) => !isApplicationNotification(n.id));
    const filteredRegular = filter === "unread" ? regular.filter((n) => !n.isRead) : regular;
    return {
      unreadCount: unread.length,
      filteredNotifications: [...application, ...filteredRegular]
    };
  }, [notifications, filter, isApplicationNotification]);

  const handleFilterAll = useCallback(() => setFilter("all"), []);
  const handleFilterUnread = useCallback(() => setFilter("unread"), []);

  const handleWithdrawApplication = useCallback(async (notificationId: string) => {
    setWithdrawError(null);
    setWithdrawingId(notificationId);
    try {
      const token = await getToken();
      if (!token) {
        setWithdrawError("Please sign in again and retry.");
        return;
      }

      const endpoint = notificationId.startsWith("autoschool-application-")
        ? `${API_CONFIG.BASE_URL}/api/autoschools/mine/application`
        : `${API_CONFIG.BASE_URL}/api/posts/mine/application`;

      const response = await fetch(endpoint, {
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
          // ignore
        }
        setWithdrawError(detail);
        return;
      }

      onRemove(notificationId);
    } catch {
      setWithdrawError("Failed to withdraw application.");
    } finally {
      setWithdrawingId(null);
    }
  }, [getToken, onRemove]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <button
              onClick={handleFilterAll}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-2 ${filter === "all"
                  ? "bg-[#F03D3D] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                }`}
            >
              All
            </button>
            <div className="relative">
              <button
                onClick={handleFilterUnread}
                className={`w-full px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${filter === "unread"
                    ? "bg-[#F03D3D] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                Unread
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 px-1.5 min-w-[20px] inline-flex items-center justify-center text-[10px] font-bold rounded-full bg-[#F03D3D] text-white shadow-sm border-[1.5px] border-white z-10 pt-[1px]">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Mobile "Mark all as read" */}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="sm:hidden text-xs font-semibold text-[#F03D3D] hover:text-red-600 transition-colors flex items-center gap-1.5 ml-4"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Desktop "Mark all as read" */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="hidden sm:flex text-sm font-semibold text-[#F03D3D] hover:text-red-600 transition-colors items-center gap-2 px-2 py-1"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {withdrawError && (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {withdrawError}
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100 mb-5 relative rotate-3">
              <Bell className="w-7 h-7 text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {filter === "unread" ? "You're all caught up" : "Inbox zero"}
            </h3>
            <p className="text-gray-500 text-sm max-w-[260px] text-center">
              {filter === "unread"
                ? "No new notifications right now."
                : "When you receive new updates, they'll appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                group relative flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200
                ${!notification.isRead 
                  ? "bg-white border-2 border-red-100/50 shadow-sm" 
                  : "bg-white border-2 border-transparent hover:border-gray-100 shadow-sm shadow-gray-200/50"
                }
              `}
            >
              {/* Header / Mobile Top */}
              <div className="flex items-start justify-between sm:w-auto w-full gap-4">
                <div className="relative">
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border border-white shadow-sm z-10 relative ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type, "w-5 h-5")}
                  </div>
                  {!notification.isRead && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F03D3D] rounded-full border-2 border-white z-20" />
                  )}
                </div>
                
                {/* Mobile time */}
                <div className="sm:hidden text-xs font-semibold text-gray-400">
                  {getTimeAgo(notification.timestamp)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <h4 className={`text-sm sm:text-base font-bold mb-1 ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                  {notification.title}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                  {notification.message}
                </p>

                {/* Actions Inline */}
                <div className="flex items-center gap-4 mt-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isApplicationNotification(notification.id) ? (
                    <button
                      onClick={() => void handleWithdrawApplication(notification.id)}
                      disabled={withdrawingId === notification.id}
                      className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors disabled:opacity-60"
                    >
                      {withdrawingId === notification.id ? "Withdrawing..." : "Withdraw application"}
                    </button>
                  ) : notification.actionUrl && (
                    <Link
                      href={notification.actionUrl}
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs font-bold text-[#F03D3D] hover:text-red-700 transition-colors"
                    >
                      View details
                    </Link>
                  )}
                  {!isApplicationNotification(notification.id) && notification.actionUrl && <div className="w-1 h-1 rounded-full bg-gray-200" />}
                  {!isApplicationNotification(notification.id) && !notification.isRead ? (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs font-bold text-[#F03D3D] hover:text-red-700 transition-colors"
                    >
                      Mark as read
                    </button>
                  ) : !isApplicationNotification(notification.id) ? (
                    <button
                      onClick={() => onMarkAsUnread(notification.id)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Mark as unread
                    </button>
                  ) : null}
                  {!isApplicationNotification(notification.id) && <div className="w-1 h-1 rounded-full bg-gray-200" />}
                  {!isApplicationNotification(notification.id) && (
                    <button
                      onClick={() => onRemove(notification.id)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Time */}
              <div className="hidden sm:block shrink-0 text-right">
                <span className="text-xs font-semibold text-gray-400">
                  {getTimeAgo(notification.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
