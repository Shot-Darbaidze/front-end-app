export interface BookingResponse {
    id: string;
    user_id: string | null;
    post_id: string;
    start_time_utc: string;
    duration_minutes: number;
    status: "available" | "booked" | "cancelled" | "completed";
    mode: "city" | "yard" | null;
    price?: number | null;
    instructor_name?: string | null;
    instructor_image?: string | null;
    instructor_email?: string | null;
    instructor_phone?: string | null;
    // Package discount info (populated when booked via a package)
    package_name_snapshot?: string | null;
    package_percentage_snapshot?: number | null;
    pre_discount_price?: number | null;
}

export type CancellationReason =
    | "schedule_conflict"
    | "personal_emergency"
    | "illness"
    | "weather"
    | "transportation"
    | "found_alternative"
    | "no_longer_needed"
    | "other";

export interface CancellationResponse {
    id: string;
    booking_id: string;
    cancelled_by_user_id: string | null;
    reason: CancellationReason;
    description: string | null;
    original_start_time_utc: string;
    original_duration_minutes: number;
    original_mode: "city" | "yard" | null;
    original_price: number | null;    // discounted price at booking time
    original_post_id: string;
    cancelled_at: string;
    instructor_name?: string | null;
    instructor_image?: string | null;
    instructor_email?: string | null;
    instructor_phone?: string | null;
    // Package discount info (populated when booked via a package)
    package_name_snapshot?: string | null;
    package_percentage_snapshot?: number | null;
    pre_discount_price?: number | null;
}

export type TabId = "upcoming" | "past" | "cancelled";

export const TABS: Array<{ id: TabId; label: string }> = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
];

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
    schedule_conflict: "Schedule Conflict",
    personal_emergency: "Personal Emergency",
    illness: "Illness",
    weather: "Weather Conditions",
    transportation: "Transportation Issues",
    found_alternative: "Found Alternative",
    no_longer_needed: "No Longer Needed",
    other: "Other",
};

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    });
}

export function formatTime(dateString: string, durationMinutes: number): string {
    const start = new Date(dateString);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}
