"use client";

import React from "react";
import { Users, Clock, Calendar, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const InstructorStats = () => {
  const { t } = useLanguage();

  const stats = [

    {
      label: "Upcoming today",
      value: "5",
      icon: Calendar,
      gradient: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/20",
    },
    {
      label: t("dashboard.stats.earnings"),
      value: "₾1,250",
      icon: DollarSign,
      gradient: "from-orange-500 to-red-500",
      shadow: "shadow-orange-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group overflow-hidden"
        >
          {/* subtle animated background glow */}
          <div className="absolute -inset-2 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl rounded-3xl pointer-events-none" />

          <div className="flex flex-col justify-between h-full relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon className="w-6 h-6 text-white drop-shadow-md" />
            </div>

            <div className="mt-4">
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
