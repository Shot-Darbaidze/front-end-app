"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { User as UserIcon, Bell, Settings } from "lucide-react";

import { ProfileSettings } from "@/components/dashboard/settings/ProfileSettings";
import { AccountSettings } from "@/components/dashboard/settings/AccountSettings";
import { NotificationSettings } from "@/components/dashboard/settings/NotificationSettings";

const TAB_IDS = ["profile", "account", "notifications"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_ICONS: Record<TabId, typeof UserIcon> = {
  profile: UserIcon,
  account: Settings,
  notifications: Bell,
};

export default function SettingsPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const isInstructor = (user?.publicMetadata?.userType as string) === "instructor";
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="text-gray-500 mt-1">{t("settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {TAB_IDS.map((id) => {
                const Icon = TAB_ICONS[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === id
                        ? "bg-white text-[#F03D3D] shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {t(`settings.tabs.${id}`)}
                  </button>
                );
              })}
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
