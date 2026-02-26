"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { Send, Reply, Trash2, Edit2, X, Check, Loader2, ChevronDown, ChevronUp, Star, Heart, HeartCrack, ArrowUpDown } from "lucide-react";
import { API_CONFIG } from "@/config/constants";

interface CommentUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  user: CommentUser;
  comment_text: string;
  rating?: number;
  parent_id: string | null;
  created_at: string;
  replies: Comment[];
  reactions?: { [key: string]: number };
  userReaction?: string | null;
  isOwner?: boolean;
}

interface CommentSectionProps {
  postId: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getUserDisplayName(user: CommentUser): string {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Anonymous";
}

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

function SingleComment({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReact,
  replyingTo,
  editingId,
  editText,
  setEditText,
  editRating,
  setEditRating,
  editHoverRating,
  setEditHoverRating,
  onCancelEdit,
  onSaveEdit,
  depth = 0,
}: SingleCommentProps) {
  const isOwner = comment.isOwner ?? false;
  const isEditing = editingId === comment.id;
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isTopLevel = !comment.parent_id;

  return (
    <div className={`${depth > 0 ? "ml-4 sm:ml-8 border-l-2 border-slate-100 pl-3 sm:pl-4" : ""}`}>
      <div className="flex gap-3 py-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            {comment.user.image_url ? (
              <img
                src={comment.user.image_url}
                alt={getUserDisplayName(comment.user)}
                className="w-full h-full object-cover"
              />
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
            <span className="font-bold text-slate-900 text-sm">
              {getUserDisplayName(comment.user)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{formatTimeAgo(comment.created_at)}</span>
            {comment.rating && !comment.parent_id && (
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${star <= comment.rating!
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-slate-200 text-slate-200'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              {/* Rating editor for top-level reviews */}
              {isTopLevel && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-slate-600 mb-1">Rating:</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        onMouseEnter={() => setEditHoverRating(star)}
                        onMouseLeave={() => setEditHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= (editHoverRating || editRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-slate-200 text-slate-200'
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] resize-none bg-slate-50"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={onSaveEdit}
                  disabled={isTopLevel && editRating === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#F03D3D] rounded-lg hover:bg-[#d63333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
              {comment.comment_text}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => onReact(comment.id, 'like')}
                className={`flex items-center gap-1 text-xs transition-colors ${comment.userReaction === 'like'
                  ? 'text-[#F03D3D]'
                  : 'text-slate-500 hover:text-[#F03D3D]'
                  }`}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.userReaction === 'like' ? 'fill-current' : ''}`} />
                {(comment.reactions?.like || 0) > 0 && (
                  <span>{comment.reactions?.like}</span>
                )}
              </button>
              <button
                onClick={() => onReact(comment.id, 'dislike')}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${comment.userReaction === 'dislike'
                  ? 'text-slate-900 border-slate-300'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <HeartCrack className={`w-3.5 h-3.5 ${comment.userReaction === 'dislike' ? 'fill-current' : ''}`} />
                {(comment.reactions?.dislike || 0) > 0 && (
                  <span>{comment.reactions?.dislike}</span>
                )}
              </button>
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#F03D3D] transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => onEdit(comment.id, comment.comment_text, comment.rating)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
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
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mb-2 ml-14 transition-colors"
          >
            {showReplies ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            )}
          </button>
          {showReplies && (
            <div>
              {comment.replies.map((reply) => (
                <SingleComment
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReact={onReact}
                  replyingTo={replyingTo}
                  editingId={editingId}
                  editText={editText}
                  setEditText={setEditText}
                  editRating={editRating}
                  setEditRating={setEditRating}
                  editHoverRating={editHoverRating}
                  setEditHoverRating={setEditHoverRating}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useClerkAuth();
  const { user } = useUser();
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

  const fetchComments = useCallback(async (reset: boolean = true) => {
    try {
      const offset = reset ? 0 : commentsRef.current.length;

      // Include auth token if user is signed in to get their reactions
      const headers: HeadersInit = {};
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/comments/post/${postId}?limit=20&offset=${offset}&sort_by=${sortBy}`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setComments(data.comments);
          commentsRef.current = data.comments;
        } else {
          const newComments = [...commentsRef.current, ...data.comments];
          setComments(newComments);
          commentsRef.current = newComments;
        }
        setHasMore(data.has_more);
        setTotalComments(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId, sortBy, isSignedIn, getToken]);

  const loadMoreComments = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchComments(false);
  };

  useEffect(() => {
    // Wait for Clerk auth to be loaded before fetching to include user reactions
    if (!isAuthLoaded) return;
    setIsLoading(true);
    fetchComments(true);
  }, [sortBy, postId, isAuthLoaded, isSignedIn]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    // Rating is required for reviews
    if (rating === 0 || !isSignedIn) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          comment_text: newComment.trim() || undefined,
          rating: rating,
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        const newComment = { ...newCommentData, replies: [] };
        setComments((prev) => [newComment, ...prev]);
        commentsRef.current = [newComment, ...commentsRef.current];
        setTotalComments((prev) => prev + 1);
        setNewComment("");
        setRating(0);
      } else {
        const errorData = await response.json();
        console.error("Failed to post comment:", errorData.detail);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !isSignedIn) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          comment_text: replyText.trim(),
          parent_id: parentId,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        // Add reply to the correct parent comment
        setComments((prev) => addReplyToComment(prev, parentId, { ...newReply, replies: [] }));
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addReplyToComment = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...comment.replies, reply] };
      }
      if (comment.replies.length > 0) {
        return { ...comment, replies: addReplyToComment(comment.replies, parentId, reply) };
      }
      return comment;
    });
  };

  const handleEdit = (commentId: string, text: string, commentRating?: number) => {
    setEditingId(commentId);
    setEditText(text);
    setEditRating(commentRating || 0);
    setEditHoverRating(0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditRating(0);
    setEditHoverRating(0);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/comments/${editingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_text: editText.trim() || undefined,
          rating: editRating > 0 ? editRating : undefined,
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments((prev) => updateCommentData(prev, editingId, updatedComment.comment_text, updatedComment.rating));
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const updateCommentData = (comments: Comment[], commentId: string, newText: string, newRating?: number): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, comment_text: newText, rating: newRating };
      }
      if (comment.replies.length > 0) {
        return { ...comment, replies: updateCommentData(comment.replies, commentId, newText, newRating) };
      }
      return comment;
    });
  };

  const handleDelete = async (commentId: string) => {
    if (!isSignedIn) return;

    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Check if it's a top-level comment (exists in commentsRef)
        const isTopLevel = commentsRef.current.some((c) => c.id === commentId);
        const newComments = removeComment(comments, commentId);
        setComments(newComments);
        if (isTopLevel) {
          commentsRef.current = commentsRef.current.filter((c) => c.id !== commentId);
          setTotalComments((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const removeComment = (commentList: Comment[], commentId: string): Comment[] => {
    return commentList
      .filter((comment) => comment.id !== commentId)
      .map((comment) => ({
        ...comment,
        replies: removeComment(comment.replies, commentId),
      }));
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

    // Prevent double-clicks
    if (reactingComments.has(commentId)) return;
    setReactingComments(prev => new Set(prev).add(commentId));

    const previousComments = commentsRef.current.length > 0 ? commentsRef.current : comments;
    const optimisticComments = applyOptimisticReaction(previousComments, commentId, reactionType);
    setComments(optimisticComments);
    commentsRef.current = optimisticComments;

    try {
      const token = await getToken();
      if (!token) {
        setComments(previousComments);
        commentsRef.current = previousComments;
        setReactingComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/comments/${commentId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the comment's reactions in the local state
        const updatedComments = updateCommentReactions(commentsRef.current, commentId, data);
        setComments(updatedComments);
        commentsRef.current = updatedComments;
      } else {
        setComments(previousComments);
        commentsRef.current = previousComments;
      }
    } catch (error) {
      console.error("Failed to react to comment:", error);
      setComments(previousComments);
      commentsRef.current = previousComments;
    } finally {
      setReactingComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const updateCommentReactions = (
    comments: Comment[],
    commentId: string,
    reactionData: { action: string; reaction_type: string; reactions: Record<string, number> }
  ): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          reactions: reactionData.reactions,
          userReaction: reactionData.action === "removed" ? null : reactionData.reaction_type,
        };
      }
      return {
        ...comment,
        replies: updateCommentReactions(comment.replies, commentId, reactionData),
      };
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#F03D3D]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden group">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-gradient-to-br from-[#F03D3D]/5 to-orange-500/5 rounded-full blur-3xl opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-gradient-to-tr from-blue-600/5 to-indigo-500/5 rounded-full blur-3xl opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
            <Star className="w-6 h-6 text-[#F03D3D] fill-[#F03D3D]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              Student Reviews
            </h2>
            <p className="text-slate-500 text-sm font-medium">What people say about this instructor</p>
          </div>
        </div>
        {totalComments > 0 && (
          <div className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 text-xs font-bold text-slate-600 shadow-sm">
            {totalComments} total
          </div>
        )}
      </div>

      {/* New Comment Form */}
      {isSignedIn ? (
        <form onSubmit={handleSubmitComment} className="mb-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                    {user?.firstName?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* Star Rating */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rate your experience</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                          : 'fill-slate-200 text-slate-200'
                          }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-sm font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">{rating}.0</span>
                  )}
                </div>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience working with this instructor..."
                className="w-full px-5 py-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#F03D3D]/5 focus:border-[#F03D3D] resize-none bg-white shadow-sm transition-all"
                rows={3}
              />
              <div className="flex justify-between items-center mt-4">
                {rating === 0 ? (
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Please select a rating to continue
                  </p>
                ) : <div />}
                <button
                  type="submit"
                  disabled={rating === 0 || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#F03D3D] rounded-xl hover:bg-[#d63333] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post Review
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-6 bg-slate-50 rounded-3xl text-center border border-slate-100 border-dashed">
          <p className="text-slate-500 font-medium">Sign in to leave a review and join the conversation</p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 && !isLoading ? (
        <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <Star className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No reviews yet</h3>
          <p className="text-slate-500">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="relative z-10">
          {/* Sort Selector */}
          {totalComments > 0 && (
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Latest Feed
              </span>
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "likes")}
                  className="text-xs font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="likes">Most Helpful</option>
                </select>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id}>
                <SingleComment
                  comment={comment}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  replyingTo={replyingTo}
                  editingId={editingId}
                  editText={editText}
                  setEditText={setEditText}
                  editRating={editRating}
                  setEditRating={setEditRating}
                  editHoverRating={editHoverRating}
                  setEditHoverRating={setEditHoverRating}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                />

                {/* Reply Form */}
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
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${getUserDisplayName(comment.user)}...`}
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 resize-none bg-slate-50 transition-all"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyText.trim() || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                          >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Reply
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMoreComments}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm active:scale-95"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More Reviews
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
