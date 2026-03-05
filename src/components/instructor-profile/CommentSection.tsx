"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { Loader2, Star, ChevronDown, ArrowUpDown, Send } from "lucide-react";
import { API_CONFIG } from "@/config/constants";
import { Comment } from "./CommentTypes";
import { SingleComment } from "./SingleComment";
import { NewReviewForm } from "./NewReviewForm";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useClerkAuth();
  const { user } = useUser();
  const { t } = useLanguage();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reactingComments, setReactingComments] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "likes">("newest");
  const [totalComments, setTotalComments] = useState(0);
  const commentsRef = useRef<Comment[]>([]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addReplyToComment = (list: Comment[], parentId: string, reply: Comment): Comment[] =>
    list.map((c) =>
      c.id === parentId
        ? { ...c, replies: [...c.replies, reply] }
        : { ...c, replies: addReplyToComment(c.replies, parentId, reply) }
    );

  const updateCommentData = (list: Comment[], id: string, text: string, r?: number): Comment[] =>
    list.map((c) =>
      c.id === id
        ? { ...c, comment_text: text, rating: r }
        : { ...c, replies: updateCommentData(c.replies, id, text, r) }
    );

  const removeComment = (list: Comment[], id: string): Comment[] =>
    list.filter((c) => c.id !== id).map((c) => ({ ...c, replies: removeComment(c.replies, id) }));


  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchComments = useCallback(async (reset = true) => {
    try {
      const offset = reset ? 0 : commentsRef.current.length;
      const headers: HeadersInit = {};
      if (isSignedIn) {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/comments/post/${postId}?limit=20&offset=${offset}&sort_by=${sortBy}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setComments(data.comments);
          commentsRef.current = data.comments;
        } else {
          const combined = [...commentsRef.current, ...data.comments];
          setComments(combined);
          commentsRef.current = combined;
        }
        setHasMore(data.has_more);
        setTotalComments(data.total);
      }
    } catch (e) {
      console.error("Failed to fetch comments:", e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId, sortBy, isSignedIn, getToken]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    setIsLoading(true);
    fetchComments(true);
  }, [sortBy, postId, isAuthLoaded, isSignedIn]);

  const loadMoreComments = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchComments(false);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !newComment.trim() || !isSignedIn) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, comment_text: newComment.trim(), rating }),
      });
      if (res.ok) {
        const data = await res.json();
        const c = { ...data, replies: [] };
        setComments((prev) => [c, ...prev]);
        commentsRef.current = [c, ...commentsRef.current];
        setTotalComments((prev) => prev + 1);
        setNewComment("");
        setRating(0);
      }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !isSignedIn) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, comment_text: replyText.trim(), parent_id: parentId }),
      });
      if (res.ok) {
        const reply = await res.json();
        setComments((prev) => addReplyToComment(prev, parentId, { ...reply, replies: [] }));
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  const handleEdit = (commentId: string, text: string, r?: number) => {
    setEditingId(commentId); setEditText(text); setEditRating(r || 0); setEditHoverRating(0);
  };
  const handleCancelEdit = () => { setEditingId(null); setEditText(""); setEditRating(0); setEditHoverRating(0); };

  const handleSaveEdit = async () => {
    if (!editingId || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/comments/${editingId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ comment_text: editText.trim() || undefined, rating: editRating > 0 ? editRating : undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) => updateCommentData(prev, editingId, updated.comment_text, updated.rating));
        handleCancelEdit();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (commentId: string) => {
    if (!isSignedIn || !window.confirm(t("reviews.confirmDelete"))) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/comments/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const isTopLevel = commentsRef.current.some((c) => c.id === commentId);
        setComments((prev) => removeComment(prev, commentId));
        if (isTopLevel) {
          commentsRef.current = commentsRef.current.filter((c) => c.id !== commentId);
          setTotalComments((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText("");
  };

  const applyOptimisticReaction = (
    commentList: Comment[],
    commentId: string,
    reactionType: string
  ): Comment[] => {
    return commentList.map((comment) => {
      if (comment.id === commentId) {
        const currentReaction = comment.userReaction ?? null;
        const currentReactions = { ...(comment.reactions ?? {}) };

        if (currentReaction === reactionType) {
          currentReactions[reactionType] = Math.max((currentReactions[reactionType] ?? 1) - 1, 0);
          if (currentReactions[reactionType] === 0) {
            delete currentReactions[reactionType];
          }
          return {
            ...comment,
            reactions: currentReactions,
            userReaction: null,
          };
        }

        if (currentReaction) {
          currentReactions[currentReaction] = Math.max((currentReactions[currentReaction] ?? 1) - 1, 0);
          if (currentReactions[currentReaction] === 0) {
            delete currentReactions[currentReaction];
          }
        }

        currentReactions[reactionType] = (currentReactions[reactionType] ?? 0) + 1;
        return {
          ...comment,
          reactions: currentReactions,
          userReaction: reactionType,
        };
      }

      return {
        ...comment,
        replies: applyOptimisticReaction(comment.replies, commentId, reactionType),
      };
    });
  };

  const handleReact = async (commentId: string, reactionType: string) => {
    if (!isSignedIn) return;
    if (reactingComments.has(commentId)) return;
    setReactingComments((prev) => new Set(prev).add(commentId));

    const previousComments = commentsRef.current.length > 0 ? commentsRef.current : comments;
    const optimisticComments = applyOptimisticReaction(previousComments, commentId, reactionType);
    setComments(optimisticComments);
    commentsRef.current = optimisticComments;

    try {
      const token = await getToken();
      if (!token) {
        setComments(previousComments);
        commentsRef.current = previousComments;
        setReactingComments((prev) => { const n = new Set(prev); n.delete(commentId); return n; });
        return;
      }
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedComments = updateCommentReactions(commentsRef.current, commentId, data);
        setComments(updatedComments);
        commentsRef.current = updatedComments;
      } else {
        setComments(previousComments);
        commentsRef.current = previousComments;
      }
    } catch (e) {
      console.error("Failed to react to comment:", e);
      setComments(previousComments);
      commentsRef.current = previousComments;
    } finally {
      setReactingComments((prev) => { const n = new Set(prev); n.delete(commentId); return n; });
    }
  };

  const updateCommentReactions = (
    list: Comment[],
    commentId: string,
    reactionData: { action: string; reaction_type: string; reactions: Record<string, number> }
  ): Comment[] =>
    list.map((comment) =>
      comment.id === commentId
        ? { ...comment, reactions: reactionData.reactions, userReaction: reactionData.action === "removed" ? null : reactionData.reaction_type }
        : { ...comment, replies: updateCommentReactions(comment.replies, commentId, reactionData) }
    );

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#F03D3D]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-4">
          <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 ml-1" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{t("reviews.title")}</h2>
            <p className="text-slate-500 text-sm">{t("reviews.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Review form or sign-in prompt */}
      {isSignedIn ? (
        <NewReviewForm
          userImageUrl={user?.imageUrl}
          userInitial={user?.firstName?.charAt(0) || "?"}
          rating={rating} hoverRating={hoverRating} newComment={newComment} isSubmitting={isSubmitting}
          onRatingChange={setRating} onHoverRatingChange={setHoverRating}
          onCommentChange={setNewComment} onSubmit={handleSubmitComment}
        />
      ) : (
        <div className="mb-8 p-5 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
          <p className="text-slate-600 font-medium">{t("reviews.signInPrompt")}</p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <Star className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{t("reviews.noReviews")}</h3>
          <p className="text-slate-500">{t("reviews.beFirst")}</p>
        </div>
      ) : (
        <div>
          {totalComments > 0 && (
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">{t("reviews.latestReviews")}</span>
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "likes")}
                  className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                  <option value="newest">{t("reviews.newest")}</option>
                  <option value="oldest">{t("reviews.oldest")}</option>
                  <option value="likes">{t("reviews.mostHelpful")}</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id}>
                <SingleComment
                  comment={comment} onReply={handleReply} onEdit={handleEdit}
                  onDelete={handleDelete} onReact={handleReact}
                  replyingTo={replyingTo} editingId={editingId}
                  editText={editText} setEditText={setEditText}
                  editRating={editRating} setEditRating={setEditRating}
                  editHoverRating={editHoverRating} setEditHoverRating={setEditHoverRating}
                  onCancelEdit={handleCancelEdit} onSaveEdit={handleSaveEdit}
                />

                {/* Inline reply form */}
                {replyingTo === comment.id && isSignedIn && (
                  <div className="pb-4">
                    <div className="flex gap-4 ml-6 sm:ml-12 border-l-2 border-slate-100 pl-4 sm:pl-6">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                          {user?.imageUrl ? (
                            <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                              {user?.firstName?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t("reviews.replyPlaceholder")}
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 resize-none bg-slate-50 transition-all"
                          rows={2} autoFocus />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleSubmitReply(comment.id)} disabled={!replyText.trim() || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm active:scale-95">
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} {t("reviews.reply")}
                          </button>
                          <button onClick={() => setReplyingTo(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                            {t("reviews.cancel")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button onClick={loadMoreComments} disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-7 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50">
                {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("reviews.loading")}</> : <><ChevronDown className="w-4 h-4" /> {t("reviews.loadMore")}</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
