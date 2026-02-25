"use client";

import React from "react";
import { UserCircle, CalendarPlus, Settings, DollarSign } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

export const InstructorQuickActions = () => {
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  const actions = [
    {
      icon: UserCircle,
      label: "My Profile", // We can use direct string if translation is missing, or generic
      href: "/dashboard", // Currently points to dashboard, could be /dashboard/profile
      gradient: "from-blue-500 to-indigo-600",
      shadow: "group-hover:shadow-blue-500/30",
      border: "group-hover:border-blue-500/30",
    },
    {
      icon: CalendarPlus,
      label: t("dashboard.nav.schedule"),
      href: "/dashboard/schedule",
      gradient: "from-purple-500 to-violet-600",
      shadow: "group-hover:shadow-purple-500/30",
      border: "group-hover:border-purple-500/30",
    },
    {
      icon: Settings,
      label: t("dashboard.nav.settings"), // Or a generic "Settings"
      href: "/dashboard/settings",
      gradient: "from-slate-500 to-slate-700",
      shadow: "group-hover:shadow-slate-500/30",
      border: "group-hover:border-slate-500/30",
    },
    { // Used emerald for visual variety from standard primary
      icon: DollarSign,
      label: t("dashboard.quickActions.earningsLabel"),
      href: "/dashboard/earnings",
      gradient: "from-emerald-500 to-teal-600",
      shadow: "group-hover:shadow-emerald-500/30",
      border: "group-hover:border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {actions.map((action, idx) => (
        <Link
          key={idx}
          href={localeHref(action.href)}
          className={`flex flex-col items-center text-center justify-center p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden h-full min-h-[140px]`}
        >
          {/* Subtle animated background glow */}
          <div className={`absolute -inset-1 opacity-0 transition-opacity duration-500 blur-xl bg-gradient-to-br ${action.gradient} group-hover:opacity-10 pointer-events-none rounded-3xl`} />

          <div
            className={`w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-lg ${action.shadow} group-hover:scale-110 transition-transform duration-500 relative z-10`}
          >
            <action.icon className="w-6 h-6 text-white drop-shadow-md" />
          </div>

          <p className="text-sm font-bold text-slate-800 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-700 group-hover:to-slate-900 transition-all">
            {action.label}
          </p>
        </Link>
      ))}
    </div>
  );
};
