"use client";

import { memo } from "react";
import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { BookingResponse, formatTime } from "./types";

interface UpcomingLessonCardProps {
    lesson: BookingResponse;
    onCancelClick: (lesson: BookingResponse) => void;
    canCancel: boolean;
    lessonCode?: string;
    isLoadingCode: boolean;
    minCancelHours: number;
    isInstructor: boolean;
    isHighlighted?: boolean;
}

const UpcomingLessonCard = memo(function UpcomingLessonCard({
    lesson,
    onCancelClick,
    canCancel,
    minCancelHours,
    isInstructor,
    isHighlighted = false,
}: UpcomingLessonCardProps) {
    const localeHref = useLocaleHref();
    const startDate = new Date(lesson.start_time_utc);
    const fullDate = startDate.toLocaleDateString("en-US", {
        weekday: "long", month: "short", day: "numeric",
    });

    return (
        <div
            id={`lesson-card-${lesson.id}`}
            className={`bg-white p-4 sm:p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 group ${
                isHighlighted
                    ? "border-amber-300 ring-2 ring-amber-200 bg-amber-50/50"
                    : "border-gray-100"
            }`}
        >
            {isHighlighted && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-[11px] font-bold">
                    From notification
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                {/* Left: image + info */}
                <div className="flex items-center gap-3">
                    {lesson.instructor_image ? (
                        <img 
                            src={lesson.instructor_image} 
                            alt={lesson.instructor_name || (isInstructor ? "Student" : "Instructor")}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
                            <Clock className="w-5 h-5 text-[#F03D3D]" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{lesson.instructor_name || (isInstructor ? "Student" : "Instructor")}</h3>
                        {!isInstructor && (
                            <Link
                                href={localeHref(`/instructors/${lesson.post_id}`)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-0.5"
                            >
                                View Instructor <ExternalLink className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Right: time · price · cancel */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap pl-13 sm:pl-0">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs sm:text-sm">
                            {formatTime(lesson.start_time_utc, lesson.duration_minutes)} · {lesson.duration_minutes} min
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {lesson.price != null && (
                            <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
                                ₾{lesson.price.toFixed(0)}
                            </span>
                        )}

                        {canCancel ? (
                            <button
                                onClick={() => onCancelClick(lesson)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
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
    isInstructor: boolean;
    highlightedBookingId?: string | null;
}

export const UpcomingLessons = memo(function UpcomingLessons({
    lessons,
    onCancelClick,
    canCancelLesson,
    lessonCodes,
    isLoadingCodes,
    minCancelHours,
    isInstructor,
    highlightedBookingId,
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

    // Group lessons by local date (YYYY-MM-DD)
    const grouped = lessons.reduce((acc, lesson) => {
        const d = new Date(lesson.start_time_utc);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(lesson);
        return acc;
    }, {} as Record<string, BookingResponse[]>);

    const sortedDays = Object.keys(grouped).sort();

    return (
        <div className="space-y-6">
            {sortedDays.map((dateKey) => {
                const dayLessons = grouped[dateKey];
                const dateLabel = new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                });
                return (
                    <div key={dateKey}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-bold text-gray-900">{dateLabel}</span>
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs font-semibold text-gray-400">{dayLessons.length} {dayLessons.length === 1 ? "lesson" : "lessons"}</span>
                        </div>
                        <div className="grid gap-3 sm:gap-4">
                            {dayLessons.map((lesson) => (
                                <UpcomingLessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onCancelClick={onCancelClick}
                                    canCancel={canCancelLesson(lesson)}
                                    lessonCode={lessonCodes[lesson.id]}
                                    isLoadingCode={isLoadingCodes}
                                    minCancelHours={minCancelHours}
                                    isInstructor={isInstructor}
                                    isHighlighted={highlightedBookingId === lesson.id}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});
