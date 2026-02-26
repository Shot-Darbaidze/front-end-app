"use client";

import { memo } from "react";
import { XCircle, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CancellationResponse, MOCK_INSTRUCTOR_NAMES, CANCELLATION_REASON_LABELS, formatTime } from "./types";

interface CancelledLessonCardProps {
    cancellation: CancellationResponse;
}

const CancelledLessonCard = memo(function CancelledLessonCard({ cancellation }: CancelledLessonCardProps) {
    const startDate = new Date(cancellation.original_start_time_utc);
    const fullDate = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const reasonLabel = CANCELLATION_REASON_LABELS[cancellation.reason] || cancellation.reason;
    const fallbackName = MOCK_INSTRUCTOR_NAMES[
        cancellation.original_post_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_INSTRUCTOR_NAMES.length
    ];

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm opacity-70 hover:opacity-100 transition-opacity group">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                {/* Left */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{fallbackName}</h3>
                        <p className="text-sm text-gray-500">{fullDate}</p>
                        <Link
                            href={`/instructors/${cancellation.original_post_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-0.5"
                        >
                            View Instructor <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap pl-13 sm:pl-0">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs sm:text-sm">
                            {formatTime(cancellation.original_start_time_utc, cancellation.original_duration_minutes)} · {cancellation.original_duration_minutes} min
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {cancellation.original_price != null && (
                            <span className="text-sm font-bold text-emerald-600">
                                ₾{cancellation.original_price.toFixed(0)}
                            </span>
                        )}
                        <span className="text-xs font-semibold text-gray-400">{reasonLabel}</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-500">
                            Cancelled
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
});

interface CancelledLessonsProps {
    lessons: CancellationResponse[];
}

export const CancelledLessons = memo(function CancelledLessons({ lessons }: CancelledLessonsProps) {
    if (lessons.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No cancelled lessons</h3>
                <p className="text-gray-500 mt-1">You haven&apos;t cancelled any lessons recently.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:gap-4">
            {lessons.map((cancellation) => (
                <CancelledLessonCard key={cancellation.id} cancellation={cancellation} />
            ))}
        </div>
    );
});
