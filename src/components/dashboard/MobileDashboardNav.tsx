"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Heart,
  Bell,
  Settings,
  CalendarDays,
} from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileDashboardNavProps {
  isInstructor?: boolean;
}

export const MobileDashboardNav = ({ isInstructor = false }: MobileDashboardNavProps) => {
  const pathname = usePathname();
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  const studentNav = [
    { icon: LayoutDashboard, label: t("dashboard.nav.overview"), href: "/dashboard" },
    { icon: Calendar, label: t("dashboard.nav.myLessons"), href: "/dashboard/lessons" },
    { icon: Heart, label: t("dashboard.nav.favorites"), href: "/dashboard/favorites" },
    { icon: Bell, label: t("dashboard.nav.notifications"), href: "/dashboard/notifications" },
    { icon: Settings, label: t("dashboard.nav.settings"), href: "/dashboard/settings" },
  ];

  const instructorNav = [
    { icon: LayoutDashboard, label: t("dashboard.nav.overview"), href: "/dashboard" },
    { icon: CalendarDays, label: t("dashboard.nav.schedule"), href: "/dashboard/schedule" },
    { icon: Bell, label: t("dashboard.nav.notifications"), href: "/dashboard/notifications" },
    { icon: Settings, label: t("dashboard.nav.settings"), href: "/dashboard/settings" },
  ];

  const navItems = isInstructor ? instructorNav : studentNav;

  const isActiveLink = (href: string) => {
    const fullHref = localeHref(href);
    if (href === "/dashboard") return pathname === fullHref;
    return pathname.startsWith(fullHref);
  };

  return (
    <div className="overflow-x-auto no-scrollbar bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
      <div className="flex px-4 sm:px-6 lg:px-8 gap-1 md:gap-6 md:justify-center max-w-7xl mx-auto w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveLink(item.href);
          return (
            <Link
              key={item.href}
              href={localeHref(item.href)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${active
                ? "border-[#F03D3D] text-[#F03D3D]"
                : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
