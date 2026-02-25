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
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: t("dashboard.stats.hoursDriven"),
      value: "18h",
      subtext: t("dashboard.stats.totalTime"),
      icon: Clock,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20",
    },
    {
      label: t("dashboard.stats.upcoming"),
      value: "3",
      subtext: t("dashboard.stats.scheduled"),
      icon: Calendar,
      gradient: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/20",
    },
    {
      label: t("dashboard.stats.progress"),
      value: "45%",
      subtext: t("dashboard.stats.toLicense"),
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-500",
      shadow: "shadow-orange-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-4 border border-gray-100/80 hover:shadow-lg transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};
