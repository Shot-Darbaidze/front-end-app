"use client";

import React from "react";
import { Calendar, Clock, MapPin, ChevronRight, Car } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

export const NextLessonCard = () => {
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  return (
    <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#F03D3D]/10 rounded-full blur-3xl -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F03D3D]/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#F03D3D]" />
            </div>
            <span className="text-sm font-semibold text-white/90">{t("dashboard.nextLesson.title")}</span>
          </div>
          <Link
            href={localeHref("/dashboard/lessons")}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors font-medium bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            {t("dashboard.nextLesson.viewDetails")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <h3 className="text-xl font-bold mb-5">{t("dashboard.nextLesson.tomorrow")}, 10:00</h3>

        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span className="text-sm text-white/70">2h</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-white/40" />
            <span className="text-sm text-white/70">Tbilisi Central</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
            <Car className="w-3.5 h-3.5 text-white/40" />
            <span className="text-sm text-white/70">Manual</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#F03D3D] to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg shadow-red-500/20">
            GB
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">{t("dashboard.nextLesson.instructor")}</p>
            <p className="text-sm font-semibold">Giorgi Beridze</p>
          </div>
        </div>
      </div>
    </div>
  );
};
