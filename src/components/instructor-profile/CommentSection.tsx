"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { MessageCircle, Send, Reply, Trash2, Edit2, X, Check, Loader2, ChevronDown, ChevronUp, Star } from "lucide-react";
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
  currentUserId: string | null;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  editingId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  depth?: number;
}

function SingleComment({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  replyingTo,
  editingId,
  editText,
  setEditText,
  onCancelEdit,
  onSaveEdit,
  depth = 0,
}: SingleCommentProps) {
  const isOwner = currentUserId === comment.user.id;
  const isEditing = editingId === comment.id;
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}`}>
      <div className="flex gap-3 py-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {comment.user.image_url ? (
              <img
                src={comment.user.image_url}
                alt={getUserDisplayName(comment.user)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                {getUserDisplayName(comment.user).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {getUserDisplayName(comment.user)}
            </span>
            <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
            {comment.rating && !comment.parent_id && (
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= comment.rating!
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={onSaveEdit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#F03D3D] rounded-lg hover:bg-[#d63333] transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
              {comment.comment_text}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
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
                    onClick={() => onEdit(comment.id, comment.comment_text)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
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
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2 ml-13"
          >
            {showReplies ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
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
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  replyingTo={replyingTo}
                  editingId={editingId}
                  editText={editText}
                  setEditText={setEditText}
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
  const { getToken, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch current user's DB ID
  useEffect(() => {
    const fetchUserId = async () => {
      if (!isSignedIn) {
        setCurrentUserId(null);
        return;
      }
      // For now, we'll match by comparing with comment user IDs
      // The actual matching happens when we compare comment.user.id
    };
    fetchUserId();
  }, [isSignedIn]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/comments/post/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Get current user's DB ID from comments
  useEffect(() => {
    if (user && comments.length > 0) {
      // We'll need to identify our user in the comments by their clerk_user_id
      // For now, we'll store the user ID when we create a comment
    }
  }, [user, comments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isSignedIn) return;

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
          comment_text: newComment.trim(),
          rating: rating > 0 ? rating : undefined,
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments((prev) => [{ ...newCommentData, replies: [] }, ...prev]);
        setNewComment("");
        setRating(0);
        // Store current user's DB ID
        setCurrentUserId(newCommentData.user.id);
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
        setCurrentUserId(newReply.user.id);
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

  const handleEdit = (commentId: string, text: string) => {
    setEditingId(commentId);
    setEditText(text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingId || !isSignedIn) return;

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
          comment_text: editText.trim(),
        }),
      });

      if (response.ok) {
        setComments((prev) => updateCommentText(prev, editingId, editText.trim()));
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const updateCommentText = (comments: Comment[], commentId: string, newText: string): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, comment_text: newText };
      }
      if (comment.replies.length > 0) {
        return { ...comment, replies: updateCommentText(comment.replies, commentId, newText) };
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
        setComments((prev) => removeComment(prev, commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const removeComment = (comments: Comment[], commentId: string): Comment[] => {
    return comments
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 text-[#F03D3D] fill-[#F03D3D]" />
        <h2 className="text-2xl font-bold text-gray-900">
          Student Reviews {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {/* New Comment Form */}
      {isSignedIn ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                    {user?.firstName?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              {/* Star Rating */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Rate your experience:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
                  )}
                </div>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your review..."
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#F03D3D] rounded-lg hover:bg-[#d63333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mb-8 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-gray-600">Sign in to leave a review</p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <div key={comment.id}>
              <SingleComment
                comment={comment}
                currentUserId={currentUserId}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                replyingTo={replyingTo}
                editingId={editingId}
                editText={editText}
                setEditText={setEditText}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
              />

              {/* Reply Form */}
              {replyingTo === comment.id && isSignedIn && (
                <div className="ml-13 pb-4">
                  <div className="flex gap-3 ml-8 border-l-2 border-gray-100 pl-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                            {user?.firstName?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${getUserDisplayName(comment.user)}...`}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyText.trim() || isSubmitting}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#F03D3D] rounded-lg hover:bg-[#d63333] transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Reply
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
      )}
    </div>
  );
}
