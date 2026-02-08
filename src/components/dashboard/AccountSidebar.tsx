"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AccountSidebarProps {
  activeItem?: string;
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({ activeItem }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const allMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", showFor: ["student", "instructor"] },
  ];

  // Filter menu items based on user type
  const menuItems = allMenuItems.filter(item => 
    item.showFor.includes(user?.userType || "student")
  );

  return (
    <div className="flex flex-col gap-2" style={{ width: "266px" }}>
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-100"
        style={{ minHeight: "350px" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 p-6 pb-4">
          {/* Avatar */}
          <div
            className="rounded-full bg-gray-300 flex items-center justify-center overflow-hidden"
            style={{ width: "64px", height: "64px" }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.name}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} className="text-gray-600" />
            )}
          </div>

          {/* Name and Email */}
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-gray-900 font-semibold text-center"
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "1.5em",
              }}
            >
              {user?.name || "Sarah Instructor"}
            </span>
            <span
              className="text-gray-500 text-center"
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "1.4em",
              }}
            >
              {user?.email || "instructor@demo.com"}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col px-4 pb-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <button
                key={index}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={16}
                  className={`${isActive ? "text-gray-900" : "text-gray-500"}`}
                />
                <span
                  className="font-medium"
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "1.4em",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Out - No Background */}
      <div className="px-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut size={16} className="text-red-500" />
          <span
            className="font-medium"
            style={{
              fontFamily: "Inter",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "1.4em",
            }}
          >
            Log out
          </span>
        </button>
      </div>
    </div>
  );
};

export default AccountSidebar;
