"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Car,
  BookOpen,
  ClipboardCheck,
  MapPin,
  Target,
} from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";

export const CITY_EXAM_NAV_ITEMS = [
  {
    icon: Activity,
    href: "/city-exam/monitor",
    label: {
      ka: "მონიტორი",
      en: "Monitor",
    },
  },
  {
    icon: Target,
    href: "/city-exam/progress",
    label: {
      ka: "პროგრესი",
      en: "Progress",
    },
  },
  {
    icon: Car,
    href: "/city-exam/simulations",
    label: {
      ka: "სიმულაციები",
      en: "Simulations",
    },
  },
  {
    icon: BookOpen,
    href: "/city-exam/tips",
    label: {
      ka: "რჩევები",
      en: "Tips",
    },
  },
  {
    icon: MapPin,
    href: "/city-exam/routes",
    label: {
      ka: "მარშრუტები",
      en: "Routes",
    },
  },
  {
    icon: ClipboardCheck,
    href: "/city-exam/checklist",
    label: {
      ka: "ჩეკლისტი",
      en: "Checklist",
    },
  },
] as const;

export const CityExamNav = () => {
  const pathname = usePathname();
  const localeHref = useLocaleHref();

  const isActiveLink = (href: string) => {
    const fullHref = localeHref(href);
    if (href === "/city-exam/monitor") return pathname === fullHref;
    return pathname.startsWith(fullHref);
  };

  return (
    <div className="bg-white border-b border-gray-200/70 shadow-sm">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center py-2 px-3 sm:px-6 lg:px-8 sm:justify-center gap-1">
          {CITY_EXAM_NAV_ITEMS.map((item) => {
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
                <span className="hidden sm:inline">{item.label.ka}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
