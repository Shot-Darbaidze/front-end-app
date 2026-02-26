export interface CommentUser {
    id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
}

export interface Comment {
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

export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getUserDisplayName(user: CommentUser): string {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Anonymous";
}
