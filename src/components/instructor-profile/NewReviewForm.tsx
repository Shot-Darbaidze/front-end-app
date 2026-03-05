"use client";

import { Star, Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewReviewFormProps {
    userImageUrl?: string | null;
    userInitial: string;
    rating: number;
    hoverRating: number;
    newComment: string;
    isSubmitting: boolean;
    onRatingChange: (r: number) => void;
    onHoverRatingChange: (r: number) => void;
    onCommentChange: (text: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function NewReviewForm({
    userImageUrl, userInitial, rating, hoverRating, newComment,
    isSubmitting, onRatingChange, onHoverRatingChange, onCommentChange, onSubmit,
}: NewReviewFormProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-8">
            <form onSubmit={onSubmit} className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
                <div className="w-full">
                    {/* Star Rating */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-0.5">{t("reviews.rateExperience")}</p>
                                <div className="flex items-center gap-2 mt-1.5 ml-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button"
                                            onClick={() => onRatingChange(star)}
                                            onMouseEnter={() => onHoverRatingChange(star)}
                                            onMouseLeave={() => onHoverRatingChange(0)}
                                            className="transition-transform hover:scale-110">
                                            <Star className={`w-6 h-6 ${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200">
                                {userImageUrl ? (
                                    <img src={userImageUrl} alt="You" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">{userInitial}</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <textarea value={newComment} onChange={(e) => onCommentChange(e.target.value)}
                        placeholder={t("reviews.placeholder")}
                        className="w-full px-4 py-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/15 focus:border-[#F03D3D] resize-none bg-white transition-all"
                        rows={2}
                        maxLength={200} />
                    <div className="flex justify-end items-center mt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">
                                {200 - newComment.length}
                            </span>
                            <button type="submit" disabled={rating === 0 || !newComment.trim() || isSubmitting}
                                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-[#F03D3D] rounded-lg hover:bg-[#d63333] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {t("reviews.postReview")}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            {(rating === 0 || !newComment.trim()) && (
                <p className="mt-2 text-[11px] font-semibold text-amber-600 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {rating === 0 && !newComment.trim()
                        ? t("reviews.selectRatingAndReview")
                        : rating === 0
                            ? t("reviews.selectRating")
                            : t("reviews.writeReview")}
                </p>
            )}
        </div>
    );
}
