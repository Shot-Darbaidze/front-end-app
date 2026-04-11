"use client";

import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Bell,
  Settings,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileDashboardNavProps {
  isInstructor?: boolean;
}

export const MobileDashboardNav = ({ isInstructor = false }: MobileDashboardNavProps) => {
  const pathname = usePathname();
  const localeHref = useLocaleHref();
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const studentNav = [
    { icon: LayoutDashboard, label: t("dashboard.nav.overview"), href: "/dashboard" },
    { icon: Calendar, label: t("dashboard.nav.myLessons"), href: "/dashboard/lessons" },
    { icon: Bell, label: t("dashboard.nav.notifications"), href: "/dashboard/notifications" },
    { icon: Settings, label: t("dashboard.nav.settings"), href: "/dashboard/settings" },
  ];

  const instructorNav = [
    { icon: LayoutDashboard, label: t("dashboard.nav.overview"), href: "/dashboard" },
    { icon: Calendar, label: t("dashboard.nav.myLessons"), href: "/dashboard/lessons" },
    { icon: CalendarDays, label: t("dashboard.nav.schedule"), href: "/dashboard/schedule" },
    { icon: Wallet, label: language === "ka" ? "ფინანსები" : "Finances", href: "/dashboard/finances" },
    { icon: Bell, label: t("dashboard.nav.notifications"), href: "/dashboard/notifications" },
    { icon: Settings, label: t("dashboard.nav.settings"), href: "/dashboard/settings" },
  ];

  // Keep SSR and first client render identical to avoid hydration mismatch,
  // then switch to role-specific nav after mount.
  const navItems = mounted && isInstructor ? instructorNav : studentNav;

  const isActiveLink = (href: string) => {
    const fullHref = localeHref(href);
    if (href === "/dashboard") return pathname === fullHref;
    return pathname.startsWith(fullHref);
  };

  return (
    <div className="bg-white border-b border-gray-200/70 shadow-sm">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center py-2 px-3 sm:px-6 lg:px-8 sm:justify-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveLink(item.href);
            return (
              <Link
                key={item.href}
                href={localeHref(item.href)}
                onClick={(e) => { if (active) e.preventDefault(); }}
                className={`
                  flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl
                  text-sm font-semibold whitespace-nowrap transition-all duration-300 py-2.5 px-3
                  ${active
                    ? "text-[#F03D3D]"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }
                `}
              >
                <Icon
                  className="w-[18px] h-[18px] shrink-0"
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
