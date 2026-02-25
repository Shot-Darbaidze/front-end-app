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
    markAllAsRead,
    removeNotification,
  } = useNotifications(isInstructor ? "instructor" : "student");

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("instructor-approval");
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { is_approved?: boolean | null };
          if (parsed?.is_approved) {
            setIsInstructor(true);
          }
        } catch (_error) {
          sessionStorage.removeItem("instructor-approval");
        }
      }
    }

    const checkApproval = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setIsInstructor(false);
          }
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (isMounted) {
            setIsInstructor(false);
          }
          return;
        }

        const result: { is_approved?: boolean | null } = await response.json();
        if (typeof window !== "undefined" && result?.is_approved) {
          sessionStorage.setItem("instructor-approval", JSON.stringify(result));
        }
        if (isMounted) {
          setIsInstructor(Boolean(result?.is_approved));
        }
      } catch (_error) {
        if (isMounted) {
          setIsInstructor(false);
        }
      }
    };

    checkApproval();

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your latest activities.</p>
        </div>

        <NotificationsList
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onRemove={removeNotification}
        />
      </div>
    </div>
  );
}
