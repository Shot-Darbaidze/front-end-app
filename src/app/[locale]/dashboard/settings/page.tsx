"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { User as UserIcon, Bell, Settings } from "lucide-react";

import { ProfileSettings } from "@/components/dashboard/settings/ProfileSettings";
import { AccountSettings } from "@/components/dashboard/settings/AccountSettings";
import { NotificationSettings } from "@/components/dashboard/settings/NotificationSettings";

const TABS = [
  { id: "profile", label: "Instructor Profile", icon: UserIcon },
  { id: "account", label: "Account", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const { user } = useUser();
  const isInstructor = (user?.publicMetadata?.userType as string) === "instructor";
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                      ? "bg-white text-[#F03D3D] shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === "profile" && <ProfileSettings user={user} isInstructor={isInstructor} />}
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "notifications" && <NotificationSettings isInstructor={isInstructor} />}
          </div>
        </div>
      </div>
    </div>
  );
}
