"use client";

import React from "react";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type RecentActivityItem = {
  id: string;
  type: "completed" | "cancelled" | "reviewed";
  occurredAt: string;
  instructorName?: string;
};

interface RecentActivityProps {
  activities: RecentActivityItem[];
  isLoading?: boolean;
}

const iconMap = {
  completed: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", dot: "bg-emerald-500" },
  cancelled: { icon: XCircle, gradient: "from-red-400 to-rose-500", dot: "bg-red-400" },
  reviewed: { icon: MessageSquare, gradient: "from-blue-500 to-indigo-600", dot: "bg-blue-500" },
};

const formatRelativeTime = (dateIso: string, language: "en" | "ka") => {
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = then - Date.now();
  const rtf = new Intl.RelativeTimeFormat(language === "ka" ? "ka-GE" : "en-US", { numeric: "auto" });

  const mins = Math.round(diffMs / (60 * 1000));
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");

  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");

  const days = Math.round(hours / 24);
  return rtf.format(days, "day");
};

export const RecentActivity = ({ activities, isLoading = false }: RecentActivityProps) => {
  const { t, language } = useLanguage();

  const getLabel = (type: string, name: string) => {
    switch (type) {
      case "completed":
        return name ? `${t("dashboard.activity.lessonCompleted")} ${name}` : t("dashboard.activity.lessonCompletedSimple");
      case "cancelled":
        return t("dashboard.activity.lessonCancelled");
      case "reviewed":
        return name ? `${t("dashboard.activity.reviewLeft")} ${name}` : (t("dashboard.activity.reviewLeft") || "Left a review");
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">{t("dashboard.activity.title")}</h3>
      </div>
      <div className="p-2">
        {isLoading && activities.length === 0 ? (
          <div className="px-3 py-3 text-sm text-gray-500">...</div>
        ) : activities.length === 0 ? (
          <div className="px-3 py-3 text-sm text-gray-500">{t("dashboard.activity.noActivity")}</div>
        ) : activities.map((item) => {
          const config = iconMap[item.type as keyof typeof iconMap];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div key={item.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50/80 transition-colors">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 truncate">{getLabel(item.type, item.instructorName || "")}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">{formatRelativeTime(item.occurredAt, language)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
