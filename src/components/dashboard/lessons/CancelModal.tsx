"use client";

import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { CancellationReason, CANCELLATION_REASON_LABELS, formatDate } from "./types";

interface CancelModalProps {
    lessonStartTime: string;
    cancelReason: CancellationReason;
    cancelDescription: string;
    cancelError: string | null;
    isCancelling: boolean;
    onReasonChange: (reason: CancellationReason) => void;
    onDescriptionChange: (desc: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function CancelModal({
    lessonStartTime,
    cancelReason,
    cancelDescription,
    cancelError,
    isCancelling,
    onReasonChange,
    onDescriptionChange,
    onConfirm,
    onClose,
}: CancelModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Lesson</h2>
                <p className="text-gray-500 mb-4">
                    Are you sure you want to cancel this lesson scheduled for{" "}
                    <span className="font-medium text-gray-900">{formatDate(lessonStartTime)}</span>?
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for cancellation
                    </label>
                    <select
                        value={cancelReason}
                        onChange={(e) => onReasonChange(e.target.value as CancellationReason)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                        {(Object.keys(CANCELLATION_REASON_LABELS) as CancellationReason[]).map((key) => (
                            <option key={key} value={key}>
                                {CANCELLATION_REASON_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                {cancelReason === "other" && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Please describe your reason
                        </label>
                        <textarea
                            value={cancelDescription}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                            placeholder="Please provide details..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={3}
                        />
                    </div>
                )}

                {cancelError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {cancelError}
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={isCancelling}>
                        Keep Lesson
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onConfirm}
                        disabled={isCancelling || (cancelReason === "other" && !cancelDescription.trim())}
                    >
                        {isCancelling ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cancelling...
                            </span>
                        ) : (
                            "Confirm Cancel"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
