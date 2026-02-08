"use client";

import React from "react";

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ icon: any; label: string }>;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  return (
    <div className="flex gap-3">
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.label;

        return (
          <button
            key={index}
            onClick={() => onTabChange(tab.label)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-colors ${
              isActive
                ? "bg-gray-100 border-gray-900 text-gray-900"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon
              size={14}
              className={isActive ? "text-gray-900" : "text-gray-500"}
            />
            <span className="font-medium text-sm font-inter">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
