"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { useInstructorApproval } from "@/hooks/useInstructorApproval";

import { ProfileSettings } from "@/components/dashboard/settings/ProfileSettings";
import { AccountSettings } from "@/components/dashboard/settings/AccountSettings";
import { NotificationSettings } from "@/components/dashboard/settings/NotificationSettings";
import { SettingsNav, TAB_IDS, TabId } from "@/components/dashboard/settings/SettingsNav";

export default function SettingsPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { isInstructor, isLoading: isRoleLoading } = useInstructorApproval();
  const [activeTab, setActiveTab] = useState<TabId>(isInstructor ? "instructorProfile" : "profile");
  
  // Update visible tabs based on role
  const visibleTabs = isInstructor
    ? ([...TAB_IDS] as TabId[])
    : (TAB_IDS.filter((id) => id !== "instructorProfile") as TabId[]);

  useEffect(() => {
    if (isRoleLoading) return;
    // If user is not instructor but is on instructor tab, redirect to profile
    if (!isInstructor && activeTab === "instructorProfile") {
      setActiveTab("profile");
    }
  }, [isInstructor, isRoleLoading, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {!isRoleLoading && <MobileDashboardNav isInstructor={isInstructor} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="text-gray-500 mt-1">{t("settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <SettingsNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              visibleTabs={visibleTabs} 
            />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === "profile" && <ProfileSettings user={user} isInstructor={false} />}
            {activeTab === "instructorProfile" && isInstructor && <ProfileSettings user={user} isInstructor={true} />}
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "notifications" && <NotificationSettings isInstructor={isInstructor} />}
          </div>
        </div>
      </div>
    </div>
  );
}
