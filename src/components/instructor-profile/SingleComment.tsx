"use client";

import { useState } from "react";
import { Reply, Trash2, Edit2, X, Check, ChevronDown, ChevronUp, Star, Heart, HeartCrack } from "lucide-react";
import { Comment, formatTimeAgo, getUserDisplayName } from "./CommentTypes";
import { useLanguage } from "@/contexts/LanguageContext";

interface SingleCommentProps {
    comment: Comment;
    onReply: (commentId: string) => void;
    onEdit: (commentId: string, text: string, rating?: number) => void;
    onDelete: (commentId: string) => void;
    onReact: (commentId: string, reactionType: string) => void;
    replyingTo: string | null;
    editingId: string | null;
    editText: string;
    setEditText: (text: string) => void;
    editRating: number;
    setEditRating: (rating: number) => void;
    editHoverRating: number;
    setEditHoverRating: (rating: number) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    depth?: number;
}

export function SingleComment({
    comment, onReply, onEdit, onDelete, onReact,
    replyingTo, editingId, editText, setEditText,
    editRating, setEditRating, editHoverRating, setEditHoverRating,
    onCancelEdit, onSaveEdit, depth = 0,
}: SingleCommentProps) {
    const isOwner = comment.isOwner ?? false;
    const isEditing = editingId === comment.id;
    const [showReplies, setShowReplies] = useState(true);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isTopLevel = !comment.parent_id;
    const { t } = useLanguage();

    return (
        <div className={`${depth > 0 ? "ml-4 sm:ml-8 border-l-2 border-slate-100 pl-3 sm:pl-4" : ""}`}>
            <div className="flex gap-3 py-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                        {comment.user.image_url ? (
                            <img src={comment.user.image_url} alt={getUserDisplayName(comment.user)} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                {getUserDisplayName(comment.user).charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{getUserDisplayName(comment.user)}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{formatTimeAgo(comment.created_at)}</span>
                        {comment.rating && !comment.parent_id && (
                            <div className="flex items-center gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= comment.rating! ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            {isTopLevel && (
                                <div className="mb-2">
                                    <p className="text-xs font-bold text-slate-600 mb-1">{t("reviews.rating")}</p>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} type="button" onClick={() => setEditRating(star)}
                                                onMouseEnter={() => setEditHoverRating(star)} onMouseLeave={() => setEditHoverRating(0)}
                                                className="transition-transform hover:scale-110">
                                                <Star className={`w-5 h-5 ${star <= (editHoverRating || editRating) ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] resize-none bg-slate-50" rows={3} />
                            <div className="flex gap-2">
                                <button onClick={onSaveEdit} disabled={isTopLevel && (editRating === 0 || !editText.trim())}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#F03D3D] rounded-lg hover:bg-[#d63333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Check className="w-3 h-3" /> {t("reviews.save")}
                                </button>
                                <button onClick={onCancelEdit} className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                                    <X className="w-3 h-3" /> {t("reviews.cancel")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed">{comment.comment_text}</p>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                        <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => onReact(comment.id, "like")}
                                className={`flex items-center gap-1 text-xs transition-colors ${comment.userReaction === "like" ? "text-[#F03D3D]" : "text-slate-500 hover:text-[#F03D3D]"}`}>
                                <Heart className={`w-3.5 h-3.5 ${comment.userReaction === "like" ? "fill-current" : ""}`} />
                                {(comment.reactions?.like || 0) > 0 && <span>{comment.reactions?.like}</span>}
                            </button>
                            <button onClick={() => onReact(comment.id, "dislike")}
                                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${comment.userReaction === "dislike" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}>
                                <HeartCrack className={`w-3.5 h-3.5 ${comment.userReaction === "dislike" ? "fill-current" : ""}`} />
                                {(comment.reactions?.dislike || 0) > 0 && <span>{comment.reactions?.dislike}</span>}
                            </button>
                            <button onClick={() => onReply(comment.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#F03D3D] transition-colors">
                                <Reply className="w-3.5 h-3.5" /> {t("reviews.reply")}
                            </button>
                            {isOwner && (
                                <>
                                    <button onClick={() => onEdit(comment.id, comment.comment_text, comment.rating)}
                                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors">
                                        <Edit2 className="w-3.5 h-3.5" /> {t("reviews.edit")}
                                    </button>
                                    <button onClick={() => onDelete(comment.id)}
                                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" /> {t("reviews.delete")}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {hasReplies && (
                <div>
                    <button onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mb-2 ml-14 transition-colors">
                        {showReplies ? (
                            <><ChevronUp className="w-3 h-3" /> {t("reviews.hide")} {comment.replies.length} {comment.replies.length === 1 ? t("reviews.replySingular") : t("reviews.replyPlural")}</>
                        ) : (
                            <><ChevronDown className="w-3 h-3" /> {t("reviews.show")} {comment.replies.length} {comment.replies.length === 1 ? t("reviews.replySingular") : t("reviews.replyPlural")}</>
                        )}
                    </button>
                    {showReplies && (
                        <div>
                            {comment.replies.map((reply) => (
                                <SingleComment key={reply.id} comment={reply} onReply={onReply} onEdit={onEdit}
                                    onDelete={onDelete} onReact={onReact} replyingTo={replyingTo}
                                    editingId={editingId} editText={editText} setEditText={setEditText}
                                    editRating={editRating} setEditRating={setEditRating}
                                    editHoverRating={editHoverRating} setEditHoverRating={setEditHoverRating}
                                    onCancelEdit={onCancelEdit} onSaveEdit={onSaveEdit} depth={depth + 1} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
