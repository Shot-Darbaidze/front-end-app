"use client";

import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

const InstructorShowcase = () => {
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#0F172A] text-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("home.showcase.title")}</h2>
          <p className="text-gray-400 mb-4">{t("home.showcase.subtitle")}</p>
          <Link href={localeHref("/find-instructors")} className="hidden md:inline-flex items-center text-[#F03D3D] hover:text-white transition">
            {t("home.showcase.viewAll")} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-700 hover:border-[#F03D3D]/50 transition group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-600" />
                <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-lg border border-gray-700">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold">4.9</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-1">გიორგი ბერიძე</h3>
              <p className="text-sm text-gray-400 mb-4">{t("home.showcase.specialty")}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-gray-700 text-xs text-gray-300">{t("home.showcase.manual")}</span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-xs text-gray-300">{t("home.showcase.languages")}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div>
                  <span className="text-lg font-bold">₾35</span>
                  <span className="text-sm text-gray-500">{t("home.showcase.perHour")}</span>
                </div>
                <button className="text-sm font-medium text-[#F03D3D] group-hover:text-white transition">
                  {t("home.showcase.viewProfile")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href={localeHref("/find-instructors")} className="inline-flex items-center text-[#F03D3D]">
            {t("home.showcase.viewAll")} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default InstructorShowcase;
