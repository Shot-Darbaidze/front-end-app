"use client";

import React, { useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { NotificationsList } from "@/components/dashboard/NotificationsList";
import { useNotifications } from "@/hooks/useNotifications";
import { API_CONFIG } from '@/config/constants';

export default function NotificationsPage() {
  const { getToken } = useClerkAuth();
  const [isInstructor, setIsInstructor] = useState(false);
  const {
    notifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    removeNotification,
  } = useNotifications(isInstructor ? "instructor" : "student");

  useEffect(() => {
    let isMounted = true;

    const checkApproval = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) setIsInstructor(false);
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (isMounted) setIsInstructor(false);
          sessionStorage.removeItem("instructor-approval");
          return;
        }

        const result: { is_approved?: boolean | null } = await response.json();
        const approved = Boolean(result?.is_approved);

        if (typeof window !== "undefined") {
          if (approved) {
            sessionStorage.setItem("instructor-approval", JSON.stringify(result));
          } else {
            sessionStorage.removeItem("instructor-approval");
          }
        }

        if (isMounted) setIsInstructor(approved);
      } catch (_error) {
        if (isMounted) setIsInstructor(false);
      }
    };

    checkApproval();

    return () => {
      isMounted = false;
    };
  }, [getToken]);

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
