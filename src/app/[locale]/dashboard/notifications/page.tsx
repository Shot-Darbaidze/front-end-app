"use client";

import React from "react";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { NotificationsList } from "@/components/dashboard/NotificationsList";
import { useDashboardNotifications } from "@/hooks/useDashboardNotifications";
import { useLocaleHref } from "@/hooks/useLocaleHref";

export default function NotificationsPage() {
  const localeHref = useLocaleHref();
  const {
    isInstructor,
    notifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    removeNotification,
  } = useDashboardNotifications({
    enabled: true,
    localeHref,
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationsList
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAsUnread={markAsUnread}
          onMarkAllAsRead={markAllAsRead}
          onRemove={removeNotification}
        />
      </div>
    </div>
  );
}
