"use client";

import { memo } from "react";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { BookingResponse, MOCK_INSTRUCTOR_NAMES, formatTime } from "./types";

interface PastLessonCardProps {
    lesson: BookingResponse;
}

const PastLessonCard = memo(function PastLessonCard({ lesson }: PastLessonCardProps) {
    const startDate = new Date(lesson.start_time_utc);
    const fullDate = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const fallbackName = MOCK_INSTRUCTOR_NAMES[
        lesson.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_INSTRUCTOR_NAMES.length
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{lesson.instructor_name || fallbackName}</h3>
                        <p className="text-sm text-gray-500">{fullDate} • {lesson.duration_minutes} min</p>
                        <Link
                            href={`/instructors/${lesson.post_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-1"
                        >
                            View Instructor
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {formatTime(lesson.start_time_utc, lesson.duration_minutes)} · {lesson.duration_minutes} min
                    </div>
                    {lesson.price != null && (
                        <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
                            ₾{lesson.price.toFixed(0)}
                        </span>
                    )}
                    <Button variant="subtle" size="sm">Rate Lesson</Button>
                    <Button variant="outline" size="sm">Book Again</Button>
                </div>
            </div>
        </div>
    );
});

interface PastLessonsProps {
    lessons: BookingResponse[];
}

export const PastLessons = memo(function PastLessons({ lessons }: PastLessonsProps) {
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
        <div className="grid gap-4">
            {lessons.map((lesson) => (
                <PastLessonCard key={lesson.id} lesson={lesson} />
            ))}
        </div>
    );
});
