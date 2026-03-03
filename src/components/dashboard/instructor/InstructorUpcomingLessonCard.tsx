"use client";

import React from "react";
import { Clock, ChevronRight } from "lucide-react";
import type { InstructorNextLessonData } from "./InstructorNextLessonCard";

interface InstructorUpcomingLessonCardProps {
  lesson: InstructorNextLessonData;
}

function formatEndTime(startUtc: string, durationMinutes: number): string {
  const end = new Date(new Date(startUtc).getTime() + durationMinutes * 60_000);
  return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const InstructorUpcomingLessonCard = ({ lesson }: InstructorUpcomingLessonCardProps) => {
  const d = new Date(lesson.startTimeUtc);
  const month = d.toLocaleDateString([], { month: "short" });
  const day = d.getDate();
  const startTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTime = formatEndTime(lesson.startTimeUtc, lesson.durationMinutes);
  const studentName = [lesson.studentFirstName, lesson.studentLastName].filter(Boolean).join(" ") || "Student";
  const modeLabel = lesson.mode ? lesson.mode.charAt(0).toUpperCase() + lesson.mode.slice(1) : null;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-red-400 uppercase">{month}</span>
          <span className="text-base font-bold text-slate-700 group-hover:text-red-600 leading-none">{day}</span>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 group-hover:text-[#F03D3D] transition-colors">{studentName}</h4>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{startTime} - {endTime}{modeLabel ? ` \u00B7 ${modeLabel}` : ""}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lesson.price != null && (
          <span className="text-sm font-bold text-emerald-600">₾{lesson.price}</span>
        )}
        <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#F03D3D] transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export const InstructorUpcomingLessonSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100" />
      <div>
        <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-40" />
      </div>
    </div>
    <div className="w-8 h-8 rounded-full bg-slate-100" />
  </div>
);
