"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { useInstructorApproval } from "@/hooks/useInstructorApproval";

import { ProfileSettings } from "@/components/dashboard/settings/ProfileSettings";
import { AccountSettings } from "@/components/dashboard/settings/AccountSettings";
import { NotificationSettings } from "@/components/dashboard/settings/NotificationSettings";
import { AutoschoolSettings } from "@/components/dashboard/settings/AutoschoolSettings";
import { SettingsNav, TAB_IDS, TabId } from "@/components/dashboard/settings/SettingsNav";
import { getMyAutoschool } from "@/services/autoschoolService";

export default function SettingsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const { isInstructor, isLoading: isRoleLoading } = useInstructorApproval();
  const [activeTab, setActiveTab] = useState<TabId>(isInstructor ? "instructorProfile" : "profile");

  // Autoschool admin detection
  const [mySchoolId, setMySchoolId] = useState<string | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) { setSchoolLoading(false); return; }
        const school = await getMyAutoschool(token);
        if (!cancelled) setMySchoolId(school?.id ?? null);
      } catch {
        // not an admin
      } finally {
        if (!cancelled) setSchoolLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const isAutoschoolAdmin = Boolean(mySchoolId);

  // Update visible tabs based on role
  const visibleTabs = TAB_IDS.filter((id) => {
    if (id === "instructorProfile" && !isInstructor) return false;
    if (id === "autoschoolSettings" && !isAutoschoolAdmin) return false;
    return true;
  }) as TabId[];

  useEffect(() => {
    if (isRoleLoading || schoolLoading) return;
    if (!isInstructor && activeTab === "instructorProfile") {
      setActiveTab("profile");
    }
    if (!isAutoschoolAdmin && activeTab === "autoschoolSettings") {
      setActiveTab("profile");
    }
  }, [isInstructor, isAutoschoolAdmin, isRoleLoading, schoolLoading, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {!isRoleLoading && !schoolLoading && <MobileDashboardNav isInstructor={isInstructor} />}

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
            {activeTab === "autoschoolSettings" && isAutoschoolAdmin && mySchoolId && (
              <AutoschoolSettings schoolId={mySchoolId} />
            )}
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "notifications" && <NotificationSettings isInstructor={isInstructor} />}
          </div>
        </div>
      </div>
    </div>
  );
}
