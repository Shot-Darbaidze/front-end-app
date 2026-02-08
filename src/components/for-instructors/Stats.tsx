"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const Stats = () => {
  const { t } = useLanguage();
  
  const STATS = [
    { label: t("stats.activeStudents"), value: "1,000+" },
    { label: t("stats.bookingsMonthly"), value: "5,000+" },
    { label: t("stats.instructorEarnings"), value: "₾1M+" },
    { label: t("stats.citiesCovered"), value: "10" }
  ];

  return (
    <div className="bg-[#0F172A] py-16 px-6 border-y border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
