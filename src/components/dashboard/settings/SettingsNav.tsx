"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { User, Bell, Settings, Briefcase } from "lucide-react";

export const TAB_IDS = ["profile", "instructorProfile", "account", "notifications"] as const;
export type TabId = (typeof TAB_IDS)[number];

const TAB_ICONS: Record<TabId, typeof User> = {
  profile: User,
  instructorProfile: Briefcase,
  account: Settings,
  notifications: Bell,
};

interface SettingsNavProps {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  visibleTabs: TabId[];
}

export const SettingsNav = ({ activeTab, setActiveTab, visibleTabs }: SettingsNavProps) => {
  const { t } = useLanguage();

  const getTabLabel = (id: TabId) => {
    if (id === "instructorProfile") {
      return t("settings.tabs.instructorProfile");
    }
    return t(`settings.tabs.${id}`);
  };

  return (
    <nav className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
      {visibleTabs.map((id) => {
        const Icon = TAB_ICONS[id];
        const isActive = activeTab === id;
        
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex-shrink-0
              ${isActive
                ? "bg-white text-[#F03D3D] shadow-sm ring-1 ring-gray-200"
                : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
              }
              lg:w-full lg:justify-start
            `}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#F03D3D]" : "text-gray-400"}`} />
            <span>{getTabLabel(id)}</span>
            {isActive && (
              <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[#F03D3D]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
