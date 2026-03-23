"use client";

import { Shield, Users, Trophy, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustStrip = () => {
  const { t } = useLanguage();

  const stats = [
    { label: t("home.trust.activeStudents"), value: "1000+", icon: Users },
    { label: t("home.trust.passRate"), value: "97%", icon: Trophy },
    { label: t("home.trust.verifiedInstructors"), value: "50+", icon: Shield },
    { label: t("home.trust.lessonHours"), value: "7000+", icon: Clock },
  ];

  return (
    <section className="bg-gray-100 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group flex min-h-[66px] items-center gap-3 sm:gap-4 md:justify-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F03D3D]/10 transition duration-300 group-hover:scale-110 group-hover:bg-[#F03D3D]/20 sm:h-12 sm:w-12">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#F03D3D] transition-colors" />
              </div>
              <div className="flex min-w-0 flex-col justify-center text-left md:min-w-[96px]">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
