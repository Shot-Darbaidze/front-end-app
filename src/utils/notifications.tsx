/**
 * Shared notification utilities
 * Extracted to avoid code duplication and enable memoization
 */

import React from "react";
import {
  Calendar,
  X as XIcon,
  MessageSquare,
  AlertCircle,
  CreditCard,
  Clock,
} from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";

/**
 * Get the appropriate icon for a notification type
 * @param type - The notification type
 * @param size - Icon size class (default: "w-4 h-4")
 */
export const getNotificationIcon = (
  type: Notification["type"],
  size: string = "w-4 h-4"
): React.ReactNode => {
  const iconProps = { className: size };
  
  switch (type) {
    case "booking":
      return <Calendar {...iconProps} className={`${size} text-blue-500`} />;
    case "cancellation":
      return <XIcon {...iconProps} className={`${size} text-red-500`} />;
    case "reminder":
      return <Clock {...iconProps} className={`${size} text-orange-500`} />;
    case "message":
      return <MessageSquare {...iconProps} className={`${size} text-green-500`} />;
    case "payment":
      return <CreditCard {...iconProps} className={`${size} text-purple-500`} />;
    case "system":
    default:
      return <AlertCircle {...iconProps} className={`${size} text-gray-500`} />;
  }
};

/**
 * Get notification background color classes based on type
 */
export const getNotificationColor = (type: Notification["type"]): string => {
  switch (type) {
    case "booking":
      return "bg-blue-50 border-blue-100";
    case "cancellation":
      return "bg-red-50 border-red-100";
    case "reminder":
      return "bg-orange-50 border-orange-100";
    case "message":
      return "bg-green-50 border-green-100";
    case "payment":
      return "bg-purple-50 border-purple-100";
    default:
      return "bg-gray-50 border-gray-100";
  }
};

/**
 * Format a date as a relative time string (e.g., "5m ago", "2h ago")
 * @param date - The date to format
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
