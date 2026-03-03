"use client";

import React from "react";
import { Calendar, Clock, Banknote, ChevronRight, MapPin, Play, CalendarX } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

export type InstructorNextLessonData = {
  id: string;
  startTimeUtc: string;
  durationMinutes: number;
  mode: string | null;
  price: number | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentImageUrl: string | null;
};

interface InstructorNextLessonCardProps {
  lesson: InstructorNextLessonData | null;
  isLoading?: boolean;
}

function getInitials(first?: string | null, last?: string | null): string {
  const f = first?.charAt(0)?.toUpperCase() || "";
  const l = last?.charAt(0)?.toUpperCase() || "";
  return f + l || "?";
}

function formatLessonTime(utcStr: string): string {
  const d = new Date(utcStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Tomorrow, ${timeStr}`;
  const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

export const InstructorNextLessonCard = ({ lesson, isLoading = false }: InstructorNextLessonCardProps) => {
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 text-slate-900 overflow-hidden shadow-xl border border-slate-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  // No upcoming lesson
  if (!lesson) {
    return (
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 text-slate-900 overflow-hidden shadow-xl border border-slate-200">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          {/* Inline SVG — empty calendar illustration */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-5">
            <rect x="12" y="20" width="56" height="48" rx="8" className="fill-slate-50 stroke-slate-200" strokeWidth="2" />
            <rect x="12" y="20" width="56" height="14" rx="8" className="fill-slate-100" />
            <rect x="24" y="14" width="4" height="12" rx="2" className="fill-slate-300" />
            <rect x="52" y="14" width="4" height="12" rx="2" className="fill-slate-300" />
            <line x1="12" y1="34" x2="68" y2="34" className="stroke-slate-200" strokeWidth="1.5" />
            {/* Empty day cells */}
            <rect x="22" y="40" width="8" height="8" rx="2" className="fill-slate-100" />
            <rect x="36" y="40" width="8" height="8" rx="2" className="fill-slate-100" />
            <rect x="50" y="40" width="8" height="8" rx="2" className="fill-slate-100" />
            <rect x="22" y="54" width="8" height="8" rx="2" className="fill-slate-100" />
            <rect x="36" y="54" width="8" height="8" rx="2" className="fill-slate-100" />
            <rect x="50" y="54" width="8" height="8" rx="2" className="fill-slate-100" />
            {/* Small "X" accent */}
            <circle cx="58" cy="58" r="9" className="fill-red-50 stroke-red-200" strokeWidth="1.5" />
            <path d="M54.5 54.5L61.5 61.5M61.5 54.5L54.5 61.5" className="stroke-red-300" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <p className="text-lg font-bold text-slate-700">You have no upcoming lessons</p>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs">
            When a student books a lesson with you, it will show up right here.
          </p>
          <Link
            href={localeHref("/dashboard/schedule")}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#F03D3D] hover:bg-red-600 shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            View Schedule
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const studentName = [lesson.studentFirstName, lesson.studentLastName].filter(Boolean).join(" ") || "Student";
  const initials = getInitials(lesson.studentFirstName, lesson.studentLastName);
  const durationHours = lesson.durationMinutes / 60;
  const durationLabel = durationHours === 1 ? "1 Hour" : `${durationHours} Hours`;

  return (
    <div className="relative bg-white rounded-3xl p-6 sm:p-8 text-slate-900 overflow-hidden shadow-xl border border-slate-200 group">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-[#F03D3D]/5 to-orange-500/5 rounded-full blur-3xl group-hover:scale-110 group-hover:opacity-100 opacity-60 transition-all duration-700 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-blue-600/5 to-indigo-500/5 rounded-full blur-3xl group-hover:scale-110 group-hover:opacity-100 opacity-60 transition-all duration-700 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
              <Calendar className="w-5 h-5 text-[#F03D3D]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#F03D3D] tracking-widest uppercase mb-1 block">
                {t("dashboard.nextLesson.title")}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                {formatLessonTime(lesson.startTimeUtc)}
              </h3>
            </div>
          </div>
          <Link
            href={localeHref("/dashboard/schedule")}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-all border border-slate-200 hover:scale-105 active:scale-95"
          >
            {t("dashboard.nextLesson.viewDetails")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Duration</p>
              <span className="text-sm font-semibold text-slate-900">{durationLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Income</p>
              <span className="text-sm font-semibold text-slate-900">{lesson.price != null ? `₾${lesson.price}` : "—"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Mode</p>
              <span className="text-sm font-semibold text-slate-900 capitalize">{lesson.mode || "—"}</span>
            </div>
          </div>
        </div>

        {/* Footer actions & Student */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              {lesson.studentImageUrl ? (
                <img
                  src={lesson.studentImageUrl}
                  alt={studentName}
                  className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white z-10 relative"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-500/20 border-2 border-white z-10 relative">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-md -z-10 group-hover:animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-0.5">{t("dashboard.nextLesson.student")}</p>
              <p className="text-base font-bold text-slate-900">{studentName}</p>
            </div>
          </div>

          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F03D3D] hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5 group/btn">
            <Play className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" />
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
};
