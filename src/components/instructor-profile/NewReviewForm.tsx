"use client";

import { Star, Send, Loader2 } from "lucide-react";

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
    return (
        <form onSubmit={onSubmit} className="mb-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                        {userImageUrl ? (
                            <img src={userImageUrl} alt="You" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">{userInitial}</div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    {/* Star Rating */}
                    <div className="mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rate your experience</p>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button"
                                    onClick={() => onRatingChange(star)}
                                    onMouseEnter={() => onHoverRatingChange(star)}
                                    onMouseLeave={() => onHoverRatingChange(0)}
                                    className="transition-transform hover:scale-125">
                                    <Star className={`w-7 h-7 ${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "fill-slate-200 text-slate-200"}`} />
                                </button>
                            ))}
                            {rating > 0 && (
                                <span className="ml-3 text-sm font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">{rating}.0</span>
                            )}
                        </div>
                    </div>
                    <textarea value={newComment} onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="Share your experience working with this instructor..."
                        className="w-full px-5 py-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#F03D3D]/5 focus:border-[#F03D3D] resize-none bg-white shadow-sm transition-all"
                        rows={3} />
                    <div className="flex justify-between items-center mt-4">
                        {rating === 0 ? (
                            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-tight flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                Please select a rating to continue
                            </p>
                        ) : <div />}
                        <button type="submit" disabled={rating === 0 || isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#F03D3D] rounded-xl hover:bg-[#d63333] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 active:scale-95">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Post Review
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
