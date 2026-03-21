"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ChevronDown, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { CancellationReason, CANCELLATION_REASON_LABELS, formatDate } from "./types";

interface CancelModalProps {
    lessonStartTime: string;
    cancelReason: CancellationReason;
    cancelDescription: string;
    cancelConfirmationText: string;
    confirmationPrimary: string;
    confirmationSecondary: string;
    cancelError: string | null;
    isCancelling: boolean;
    onReasonChange: (reason: CancellationReason) => void;
    onDescriptionChange: (desc: string) => void;
    onConfirmationTextChange: (text: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function CancelModal({
    lessonStartTime,
    cancelReason,
    cancelDescription,
    cancelConfirmationText,
    confirmationPrimary,
    confirmationSecondary,
    cancelError,
    isCancelling,
    onReasonChange,
    onDescriptionChange,
    onConfirmationTextChange,
    onConfirm,
    onClose,
}: CancelModalProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside it
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    function handleBackdropClick() {
        if (isCancelling) return;
        setShowCloseConfirm(true);
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onMouseDown={handleBackdropClick}
        >
            {/* Close confirmation sub-modal */}
            {showCloseConfirm && (
                <div
                    className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Close this window?</h3>
                    <p className="text-gray-500 text-sm mb-5">
                        Your cancellation request will be discarded.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCloseConfirm(false)}>
                            Stay
                        </Button>
                        <Button className="flex-1" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            )}

            {/* Main cancel modal */}
            {!showCloseConfirm && (
                <div
                    className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-start justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-900">Cancel Lesson</h2>
                        <button
                            type="button"
                            onClick={() => setShowCloseConfirm(true)}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-gray-500 mb-4">
                        Are you sure you want to cancel this lesson scheduled for{" "}
                        <span className="font-medium text-gray-900">{formatDate(lessonStartTime)}</span>?
                    </p>

                    <div className="mb-4 relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for cancellation
                        </label>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((o) => !o)}
                            className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 transition-colors cursor-pointer"
                        >
                            <span>{CANCELLATION_REASON_LABELS[cancelReason]}</span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                                {(Object.keys(CANCELLATION_REASON_LABELS) as CancellationReason[]).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => { onReasonChange(key); setDropdownOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <span className={cancelReason === key ? "text-[#F03D3D] font-medium" : "text-gray-700"}>
                                            {CANCELLATION_REASON_LABELS[key]}
                                        </span>
                                        {cancelReason === key && <Check className="w-4 h-4 text-[#F03D3D]" />}
                                    </button>
                                ))}
                            </div>
                        )}
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

                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs text-red-700">
                            To confirm cancellation, type <strong>{confirmationPrimary}</strong> or <strong>{confirmationSecondary}</strong>.
                        </p>
                        <input
                            value={cancelConfirmationText}
                            onChange={(e) => onConfirmationTextChange(e.target.value)}
                            placeholder={`Type "${confirmationPrimary}" or "${confirmationSecondary}"`}
                            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                        />
                    </div>

                    {cancelError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {cancelError}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCloseConfirm(true)} disabled={isCancelling}>
                            Keep Lesson
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={onConfirm}
                            disabled={
                                isCancelling ||
                                (cancelReason === "other" && !cancelDescription.trim()) ||
                                !cancelConfirmationText.trim()
                            }
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
            )}
        </div>
    );
}
