"use client";

import { UserProfile } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";

export function AccountSettings() {
    const { t } = useLanguage();
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-6">{t("settings.account.title")}</h3>
            <p className="text-sm text-gray-500 mb-6">
                {t("settings.account.desc")}
            </p>
            <UserProfile
                routing="hash"
                appearance={{
                    elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 p-0",
                        navbar: "hidden",
                        pageScrollBox: "p-0",
                        profileSection: "border border-gray-100 rounded-xl p-4 mb-4",
                        profileSectionTitle: "text-gray-900 font-bold",
                        profileSectionContent: "text-gray-600",
                        formButtonPrimary: "bg-[#F03D3D] hover:bg-[#d93636]",
                        formFieldInput: "rounded-lg border-gray-300 focus:ring-[#F03D3D] focus:border-[#F03D3D]",
                    },
                }}
            />
        </div>
    );
}
