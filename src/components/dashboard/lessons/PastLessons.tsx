"use client";

import { memo } from "react";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { BookingResponse, formatTime } from "./types";

interface PastLessonCardProps {
    lesson: BookingResponse;
    isInstructor: boolean;
    isHighlighted?: boolean;
}

const PastLessonCard = memo(function PastLessonCard({ lesson, isInstructor, isHighlighted = false }: PastLessonCardProps) {
    const localeHref = useLocaleHref();
    const startDate = new Date(lesson.start_time_utc);
    const fullDate = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div
            id={`lesson-card-${lesson.id}`}
            className={`bg-white p-4 sm:p-6 rounded-2xl border shadow-sm opacity-75 hover:opacity-100 transition-opacity group ${
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

                {/* Left */}
                <div className="flex items-center gap-3">
                    {lesson.instructor_image ? (
                        <img 
                            src={lesson.instructor_image} 
                            alt={lesson.instructor_name || (isInstructor ? "Student" : "Instructor")}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-emerald-500 transition-colors" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{lesson.instructor_name || (isInstructor ? "Student" : "Instructor")}</h3>
                        <p className="text-sm text-gray-500">{fullDate} · {lesson.duration_minutes} min</p>
                        {!isInstructor && (
                            <Link
                                href={localeHref(`/instructors/${lesson.post_id}`)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-0.5"
                            >
                                View Instructor <ExternalLink className="w-3 h-3" />
                            </Link>
                        )}
                        {(lesson.instructor_phone || lesson.instructor_email) && (
                            <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                                {lesson.instructor_phone && (
                                    <p>
                                        Phone: <a href={`tel:${lesson.instructor_phone}`} className="font-medium text-slate-600 hover:text-[#F03D3D]">{lesson.instructor_phone}</a>
                                    </p>
                                )}
                                {lesson.instructor_email && (
                                    <p>
                                        Email: <a href={`mailto:${lesson.instructor_email}`} className="font-medium text-slate-600 hover:text-[#F03D3D]">{lesson.instructor_email}</a>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap pl-13 sm:pl-0">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs sm:text-sm">
                            {formatTime(lesson.start_time_utc, lesson.duration_minutes)} · {lesson.duration_minutes} min
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {lesson.price != null && (
                            lesson.package_percentage_snapshot && lesson.pre_discount_price ? (
                                <div className="flex flex-col items-end gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-400 line-through">₾{lesson.pre_discount_price.toFixed(0)}</span>
                                        <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">₾{lesson.price.toFixed(0)}</span>
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                                            -{lesson.package_percentage_snapshot.toFixed(0)}%
                                        </span>
                                    </div>
                                    {lesson.package_name_snapshot && (
                                        <Link
                                            href={localeHref(`/instructors/${lesson.post_id}`)}
                                            className="text-[10px] text-indigo-500 hover:text-indigo-700 hover:underline leading-none"
                                        >
                                            📦 {lesson.package_name_snapshot}
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
                                    ₾{lesson.price.toFixed(0)}
                                </span>
                            )
                        )}
                        <Button variant="subtle" size="sm">Rate</Button>
                        <Button variant="outline" size="sm">Book Again</Button>
                    </div>
                </div>

            </div>
        </div>
    );
});

interface PastLessonsProps {
    lessons: BookingResponse[];
    isInstructor: boolean;
    highlightedBookingId?: string | null;
}

export const PastLessons = memo(function PastLessons({ lessons, isInstructor, highlightedBookingId }: PastLessonsProps) {
    if (lessons.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No past lessons</h3>
                <p className="text-gray-500 mt-1">Your completed lessons will appear here.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:gap-4">
            {lessons.map((lesson) => (
                <PastLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    isInstructor={isInstructor}
                    isHighlighted={highlightedBookingId === lesson.id}
                />
            ))}
        </div>
    );
});
