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
    <div className="relative bg-white rounded-3xl p-6 text-slate-900 overflow-hidden shadow-xl border border-slate-200 group">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-[#F03D3D]/5 to-orange-500/5 rounded-full blur-3xl group-hover:scale-110 group-hover:opacity-100 opacity-60 transition-all duration-700 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-blue-600/5 to-indigo-500/5 rounded-full blur-3xl group-hover:scale-110 group-hover:opacity-100 opacity-60 transition-all duration-700 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
              <Calendar className="w-5 h-5 text-[#F03D3D]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#F03D3D] tracking-widest uppercase mb-1 block">
                {t("dashboard.nextLesson.title")}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                {t("dashboard.nextLesson.tomorrow")}, 10:00
              </h3>
            </div>
          </div>
          <Link
            href={localeHref("/dashboard/lessons")}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-all border border-slate-200 hover:scale-105 active:scale-95"
          >
            {t("dashboard.nextLesson.viewDetails")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Duration</p>
              <span className="text-sm font-semibold text-slate-900">2 Hours</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Location</p>
              <span className="text-sm font-semibold text-slate-900">Tbilisi Central</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Car className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Transmission</p>
              <span className="text-sm font-semibold text-slate-900">Manual</span>
            </div>
          </div>
        </div>

        {/* Footer - Instructor */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F03D3D] to-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-red-500/20 border-2 border-white">
                GB
              </div>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-0.5">{t("dashboard.nextLesson.instructor")}</p>
              <p className="text-base font-bold text-slate-900">Giorgi Beridze</p>
            </div>
          </div>

          <Link
            href={localeHref("/dashboard/lessons")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F03D3D] hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5"
          >
            View Lesson
          </Link>
        </div>
      </div>
    </div>
  );
};
