"use client";

import React from "react";
import { UserPlus, CheckCircle2, XCircle, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type InstructorActivityItemData = {
  id: string;
  type: string; // "lesson_completed" | "new_booking" | "cancellation"
  occurredAt: string;
  studentName: string | null;
  price: number | null;
};

interface InstructorActivityProps {
  activities: InstructorActivityItemData[];
  isLoading?: boolean;
}

const typeConfig: Record<string, {
  icon: typeof CheckCircle2;
  gradient: string;
  label: string;
}> = {
  lesson_completed: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", label: "Lesson Completed" },
  new_booking: { icon: UserPlus, gradient: "from-blue-500 to-indigo-600", label: "New Booking" },
  cancellation: { icon: XCircle, gradient: "from-red-500 to-rose-600", label: "Cancellation" },
};

function relativeTime(utcStr: string): string {
  const diff = Date.now() - new Date(utcStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export const InstructorActivity = ({ activities, isLoading = false }: InstructorActivityProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900">
            Latest Activity
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-6 pl-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 pt-1">
                  <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-40 mb-1" />
                  <div className="h-2 bg-slate-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No recent activity</p>
            <p className="text-xs text-slate-400 mt-1">Your bookings and lessons will show up here</p>
          </div>
        ) : (
          <div className="relative pl-3 space-y-8">
            {/* Vertical Timeline Line */}
            <div className="absolute top-2 bottom-2 left-5 w-px bg-slate-200" />

            {activities.map((activity) => {
              const config = typeConfig[activity.type] || typeConfig.lesson_completed;
              const IconComponent = config.icon;
              const subtitle = activity.type === "lesson_completed"
                ? `with ${activity.studentName || "Student"}`
                : activity.type === "new_booking"
                ? `${activity.studentName || "Student"} booked`
                : `${activity.studentName || "Student"} cancelled`;

              const amount = activity.price != null
                ? activity.type === "cancellation"
                  ? `-₾${activity.price}`
                  : `+₾${activity.price}`
                : null;
              const amountColor = activity.type === "cancellation"
                ? "text-red-500"
                : "text-emerald-600";

              return (
                <div key={activity.id} className="relative flex items-start gap-4 group">
                  {/* Timeline dot/icon */}
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${config.gradient}`} />
                    <IconComponent className="w-4 h-4 text-slate-700 group-hover:text-blue-600 transition-colors drop-shadow-sm" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {config.label}
                        </p>
                        <p className="text-[13px] text-slate-500 truncate mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                      {amount && (
                        <span className={`text-sm font-semibold shrink-0 ${amountColor}`}>
                          {amount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-medium">
                      {relativeTime(activity.occurredAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
