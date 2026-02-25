"use client";

import React from "react";
import { CheckCircle2, Clock, Calendar, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const StudentStats = () => {
  const { t } = useLanguage();

  const stats = [
    {
      label: t("dashboard.stats.totalLessons"),
      value: "12",
      subtext: t("dashboard.stats.completed"),
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-100",
    },
    {
      label: t("dashboard.stats.hoursDriven"),
      value: "18h",
      subtext: t("dashboard.stats.totalTime"),
      icon: Clock,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-100",
    },
    {
      label: t("dashboard.stats.upcoming"),
      value: "3",
      subtext: t("dashboard.stats.scheduled"),
      icon: Calendar,
      iconBg: "bg-red-50",
      iconColor: "text-[#F03D3D]",
      borderColor: "border-red-100",
    },
    {
      label: t("dashboard.stats.progress"),
      value: "45%",
      subtext: t("dashboard.stats.toLicense"),
      icon: TrendingUp,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center border ${stat.borderColor} group-hover:scale-105 transition-transform duration-300 shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
