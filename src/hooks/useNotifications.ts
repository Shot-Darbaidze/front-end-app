"use client";

import { useState, useCallback, useMemo } from "react";

export interface Notification {
  id: string;
  type: "booking" | "cancellation" | "reminder" | "message" | "system" | "payment";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    bookingId?: string;
    instructorId?: string;
    studentId?: string;
    lessonDate?: string;
    lessonTime?: string;
  };
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "isRead">) => void;
}

// Mock notifications for demonstration
const getMockInstructorNotifications = (): Notification[] => [
  {
    id: "1",
    type: "booking",
    title: "New Booking Request",
    message: "John Smith has requested a lesson on Dec 5th at 10:00 AM",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    isRead: false,
    actionUrl: "/bookings",
    metadata: {
      bookingId: "booking-123",
      studentId: "student-456",
      lessonDate: "2024-12-05",
      lessonTime: "10:00",
    },
  },
  {
    id: "2",
    type: "cancellation",
    title: "Booking Cancelled",
    message: "Emily Johnson cancelled the lesson scheduled for Dec 4th",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    isRead: false,
    actionUrl: "/bookings",
    metadata: {
      bookingId: "booking-124",
      studentId: "student-789",
    },
  },
  {
    id: "3",
    type: "reminder",
    title: "Upcoming Lesson",
    message: "You have a lesson with Sarah Williams in 1 hour",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    isRead: true,
    actionUrl: "/dashboard",
  },
  {
    id: "4",
    type: "payment",
    title: "Payment Received",
    message: "Payment of $75 received for lesson with Michael Brown",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: true,
    actionUrl: "/payment",
  },
];

const getMockStudentNotifications = (): Notification[] => [
  {
    id: "1",
    type: "booking",
    title: "Booking Confirmed",
    message: "Your lesson with Sarah Instructor is confirmed for Dec 5th at 2:00 PM",
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    isRead: false,
    actionUrl: "/bookings",
    metadata: {
      bookingId: "booking-125",
      instructorId: "instructor-123",
      lessonDate: "2024-12-05",
      lessonTime: "14:00",
    },
  },
  {
    id: "2",
    type: "reminder",
    title: "Lesson Reminder",
    message: "Don't forget your driving lesson tomorrow at 3:00 PM",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    isRead: false,
    actionUrl: "/dashboard",
  },
  {
    id: "3",
    type: "message",
    title: "New Message",
    message: "Your instructor sent you a message about your upcoming lesson",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    isRead: true,
    actionUrl: "/dashboard",
  },
  {
    id: "4",
    type: "system",
    title: "Profile Incomplete",
    message: "Complete your profile to book lessons faster",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
    actionUrl: "/account-settings",
  },
];

export const useNotifications = (userType: "student" | "instructor" | undefined): UseNotificationsReturn => {
  // Initialize with mock data based on user type
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (userType === "instructor") {
      return getMockInstructorNotifications();
    }
    return getMockStudentNotifications();
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "isRead">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notification-${Date.now()}`,
        timestamp: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    addNotification,
  };
};
