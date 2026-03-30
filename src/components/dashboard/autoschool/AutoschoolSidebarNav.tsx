"use client";

import { Users, Wallet, Package } from "lucide-react";

export const AUTOSCHOOL_TAB_IDS = ["members", "finances", "packages"] as const;
export type AutoschoolTabId = (typeof AUTOSCHOOL_TAB_IDS)[number];

const TAB_CONFIG: Record<AutoschoolTabId, { icon: typeof Users; labelEn: string; labelKa: string }> = {
  members:  { icon: Users,   labelEn: "Members",  labelKa: "წევრები" },
  finances: { icon: Wallet,  labelEn: "Finances",  labelKa: "ფინანსები" },
  packages: { icon: Package, labelEn: "Packages",  labelKa: "პაკეტები" },
};

interface AutoschoolSidebarNavProps {
  activeTab: AutoschoolTabId;
  setActiveTab: (id: AutoschoolTabId) => void;
  language?: string;
}

export const AutoschoolSidebarNav = ({
  activeTab,
  setActiveTab,
  language = "en",
}: AutoschoolSidebarNavProps) => {
  return (
    <nav
      className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {AUTOSCHOOL_TAB_IDS.map((id) => {
        const { icon: Icon, labelEn, labelKa } = TAB_CONFIG[id];
        const isActive = activeTab === id;
        const label = language === "ka" ? labelKa : labelEn;

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
            <span>{label}</span>
            {isActive && (
              <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[#F03D3D]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
