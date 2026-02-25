"use client";

import React from "react";
import { CheckCircle2, CalendarCheck, XCircle, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const mockActivity = [
  { type: "completed", name: "Giorgi Beridze", time: "2h ago" },
  { type: "booking", name: "", time: "5h ago" },
  { type: "review", name: "Nino Kalandadze", time: "1d ago" },
  { type: "cancelled", name: "", time: "2d ago" },
];

const iconMap = {
  completed: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", dot: "bg-emerald-500" },
  booking: { icon: CalendarCheck, gradient: "from-blue-500 to-indigo-600", dot: "bg-blue-500" },
  cancelled: { icon: XCircle, gradient: "from-red-400 to-rose-500", dot: "bg-red-400" },
  review: { icon: Star, gradient: "from-yellow-400 to-amber-500", dot: "bg-yellow-500" },
};

export const RecentActivity = () => {
  const { t } = useLanguage();

  const getLabel = (type: string, name: string) => {
    switch (type) {
      case "completed":
        return `${t("dashboard.activity.lessonCompleted")} ${name}`;
      case "booking":
        return t("dashboard.activity.bookingConfirmed");
      case "cancelled":
        return t("dashboard.activity.lessonCancelled");
      case "review":
        return `${t("dashboard.activity.reviewLeft")} ${name}`;
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
        {mockActivity.map((item, idx) => {
          const config = iconMap[item.type as keyof typeof iconMap];
          const Icon = config.icon;
          return (
            <div key={idx} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50/80 transition-colors">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 truncate">{getLabel(item.type, item.name)}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
