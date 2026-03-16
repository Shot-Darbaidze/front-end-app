"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Car,
  BookOpen,
  MapPin,
  Target,
} from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";

export const CityExamNav = () => {
  const pathname = usePathname();
  const localeHref = useLocaleHref();

  const navItems = [
    { icon: Activity, label: "მონიტორი", href: "/city-exam/monitor" },
    { icon: Target, label: "პროგრესი", href: "/city-exam/progress" },
    { icon: Car, label: "სიმულაციები", href: "/city-exam/simulations" },
    { icon: BookOpen, label: "რჩევები", href: "/city-exam/tips" },
    { icon: MapPin, label: "მარშრუტები", href: "/city-exam/routes" },
  ];

  const isActiveLink = (href: string) => {
    const fullHref = localeHref(href);
    if (href === "/city-exam/monitor") return pathname === fullHref;
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
