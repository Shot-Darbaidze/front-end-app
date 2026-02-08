"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Settings, Bell } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", exact: true },
  { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export const InstructorDashboardNav = () => {
  const pathname = usePathname();

  return (
    <div className="z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8">
          <div className="flex justify-center space-x-8 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${isActive 
                      ? "border-[#F03D3D] text-[#F03D3D]" 
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
