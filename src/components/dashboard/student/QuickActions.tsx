"use client";

import React from "react";
import { Search, MessageSquare, CalendarPlus, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

export const QuickActions = () => {
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  const actions = [
    {
      icon: Search,
      label: t("dashboard.quickActions.findInstructor"),
      desc: t("dashboard.quickActions.findInstructorDesc"),
      href: "/find-instructors",
      gradient: "from-blue-500 to-indigo-600",
      shadow: "group-hover:shadow-blue-500/20",
    },
    {
      icon: CalendarPlus,
      label: t("dashboard.quickActions.bookLesson"),
      desc: t("dashboard.quickActions.bookLessonDesc"),
      href: "/dashboard/lessons",
      gradient: "from-purple-500 to-violet-600",
      shadow: "group-hover:shadow-purple-500/20",
    },
    {
      icon: MessageSquare,
      label: t("dashboard.quickActions.messages"),
      desc: t("dashboard.quickActions.messagesDesc"),
      href: "/dashboard/messages",
      gradient: "from-orange-500 to-red-500",
      shadow: "group-hover:shadow-orange-500/20",
    },
    {
      icon: FileText,
      label: t("dashboard.quickActions.myLicense"),
      desc: t("dashboard.quickActions.myLicenseDesc"),
      href: "/dashboard/documents",
      gradient: "from-emerald-500 to-teal-600",
      shadow: "group-hover:shadow-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-2">
      {actions.map((action, idx) => (
        <Link
          key={idx}
          href={localeHref(action.href)}
          className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100/80 hover:shadow-lg ${action.shadow} transition-all duration-300 group`}
        >
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
            <action.icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{action.label}</p>
            <p className="text-[11px] text-gray-400">{action.desc}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#F03D3D] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      ))}
    </div>
  );
};
