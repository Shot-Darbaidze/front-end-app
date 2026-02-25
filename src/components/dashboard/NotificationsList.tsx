"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Bell,
  Check,
  Trash2,
} from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { getNotificationIcon, getNotificationColor, getTimeAgo } from "@/utils/notifications";
import Button from "@/components/ui/Button";

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
}) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { filteredNotifications, unreadCount } = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead);
    return {
      unreadCount: unread.length,
      filteredNotifications: filter === "unread" ? unread : notifications
    };
  }, [notifications, filter]);

  const handleFilterAll = useCallback(() => setFilter("all"), []);
  const handleFilterUnread = useCallback(() => setFilter("unread"), []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50 w-fit">
          <button
            onClick={handleFilterAll}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "all"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            All
          </button>
          <button
            onClick={handleFilterUnread}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === "unread"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="bg-[#F03D3D] text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm font-semibold text-[#F03D3D] hover:text-red-600 transition-colors flex items-center gap-2 px-2 py-1"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#F03D3D]/5 to-orange-500/5 rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-tr from-blue-600/5 to-indigo-500/5 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-6 relative">
              <Bell className="w-10 h-10 text-slate-300" />
              <div className="absolute top-[-4px] right-[-4px] w-4 h-4 bg-[#F03D3D] rounded-full border-2 border-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {filter === "unread" ? "All caught up!" : "Quiet for now"}
            </h3>
            <p className="text-slate-500 text-center max-w-[280px]">
              {filter === "unread"
                ? "You've read all your notifications. Great job!"
                : "When you receive new activity notifications, they'll appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                group relative flex gap-4 p-5 rounded-2xl border transition-all duration-300
                ${notification.isRead
                  ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                  : "bg-white border-red-100 shadow-md ring-1 ring-red-50"
                }
              `}
            >
              {!notification.isRead && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F03D3D] rounded-l-2xl" />
              )}

              {/* Icon Container */}
              <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type, "w-6 h-6")}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="space-y-1">
                    <h4 className={`text-base font-bold text-slate-900 ${!notification.isRead ? "pr-6" : ""}`}>
                      {notification.title}
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                      {notification.message}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                    {getTimeAgo(notification.timestamp)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-3 mt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs font-bold text-[#F03D3D] hover:text-red-700 flex items-center gap-2 group/btn"
                    >
                      <div className="w-5 h-5 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 group-hover/btn:bg-red-100">
                        <Check className="w-3 h-3" />
                      </div>
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(notification.id)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 group/btn"
                  >
                    <div className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/btn:bg-slate-100">
                      <Trash2 className="w-3 h-3" />
                    </div>
                    Remove
                  </button>
                </div>
              </div>

              {/* Unread dot */}
              {!notification.isRead && (
                <div className="absolute top-5 right-5 w-2 h-2 bg-[#F03D3D] rounded-full animate-pulse shadow-[0_0_8px_rgba(240,61,61,0.5)]" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
