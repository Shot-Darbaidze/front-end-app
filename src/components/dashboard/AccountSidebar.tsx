"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  LogOut,
  LayoutDashboard,
  Calendar,
  Bell,
  Settings,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";
import { hardRedirect, isExpectedAuthTransitionError } from "@/utils/authTransitions";

interface AccountSidebarProps {
  isInstructor?: boolean;
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({ isInstructor = false }) => {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const localeHref = useLocaleHref();
  const { t, language } = useLanguage();

  const displayName = clerkUser
    ? clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
    : "";
  const displayEmail = clerkUser?.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = clerkUser?.imageUrl;

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

  const navItems = isInstructor ? instructorNav : studentNav;

  const isActiveLink = (href: string) => {
    const fullHref = localeHref(href);
    if (href === "/dashboard") return pathname === fullHref;
    return pathname.startsWith(fullHref);
  };

  const handleLogout = async () => {
    const redirectUrl = localeHref("/");

    try {
      await signOut({ redirectUrl });
    } catch (error) {
      if (isExpectedAuthTransitionError(error)) {
        hardRedirect(redirectUrl);
        return;
      }

      console.error("[AccountSidebar] Sign-out failed:", error);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-slate-200 sticky top-24">
        {/* User Profile */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs font-medium text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-slate-100" />

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveLink(item.href);

            return (
              <button
                key={item.href}
                onClick={() => router.push(localeHref(item.href))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold transition-all duration-200 ${active
                    ? "bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white shadow-lg shadow-red-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
              >
                <Icon size={17} className={active ? "text-white" : "text-slate-400"} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 pt-2 mt-auto">
          <div className="mx-1 mb-2 h-px bg-slate-100" />
          <button
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={17} />
            {t("dashboard.nav.logout")}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AccountSidebar;
