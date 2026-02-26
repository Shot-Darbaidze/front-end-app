"use client";

import { memo } from "react";
import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { BookingResponse, formatTime } from "./types";

interface UpcomingLessonCardProps {
    lesson: BookingResponse;
    onCancelClick: (lesson: BookingResponse) => void;
    canCancel: boolean;
    lessonCode?: string;
    isLoadingCode: boolean;
    minCancelHours: number;
}

const UpcomingLessonCard = memo(function UpcomingLessonCard({
    lesson,
    onCancelClick,
    canCancel,
    minCancelHours,
}: UpcomingLessonCardProps) {
    const startDate = new Date(lesson.start_time_utc);
    const fullDate = startDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Left: icon + date + link */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
                        <Clock className="w-5 h-5 text-[#F03D3D]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{lesson.instructor_name || "Instructor"}</h3>
                        <p className="text-sm text-gray-500">{fullDate}</p>
                        <Link
                            href={`/instructors/${lesson.post_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-1"
                        >
                            View Instructor
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* Right: time + price + cancel */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {formatTime(lesson.start_time_utc, lesson.duration_minutes)} · {lesson.duration_minutes} min
                    </div>

                    {lesson.price != null && (
                        <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
                            ₾{lesson.price.toFixed(0)}
                        </span>
                    )}

                    {canCancel ? (
                        <button
                            onClick={() => onCancelClick(lesson)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>
                    ) : (
                        <span className="text-[11px] font-bold text-slate-400">
                            Locked {minCancelHours}h before
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
});

interface UpcomingLessonsProps {
    lessons: BookingResponse[];
    onCancelClick: (lesson: BookingResponse) => void;
    canCancelLesson: (lesson: BookingResponse) => boolean;
    lessonCodes: Record<string, string>;
    isLoadingCodes: boolean;
    minCancelHours: number;
}

export const UpcomingLessons = memo(function UpcomingLessons({
    lessons,
    onCancelClick,
    canCancelLesson,
    lessonCodes,
    isLoadingCodes,
    minCancelHours,
}: UpcomingLessonsProps) {
    if (lessons.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No upcoming lessons</h3>
                <p className="text-gray-500 mt-1">Book a lesson to get started!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {lessons.map((lesson) => (
                <UpcomingLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onCancelClick={onCancelClick}
                    canCancel={canCancelLesson(lesson)}
                    lessonCode={lessonCodes[lesson.id]}
                    isLoadingCode={isLoadingCodes}
                    minCancelHours={minCancelHours}
                />
            ))}
        </div>
    );
});
