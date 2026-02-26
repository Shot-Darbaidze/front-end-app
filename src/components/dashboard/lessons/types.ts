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
}

export type CancellationReason =
    | "schedule_conflict"
    | "personal_emergency"
    | "illness"
    | "weather"
    | "transportation"
    | "financial"
    | "found_alternative"
    | "no_longer_needed"
    | "instructor_request"
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
    original_price: number | null;
    original_post_id: string;
    cancelled_at: string;
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
    financial: "Financial Reasons",
    found_alternative: "Found Alternative",
    no_longer_needed: "No Longer Needed",
    instructor_request: "Instructor Request",
    other: "Other",
};

export const MOCK_INSTRUCTOR_NAMES = [
    "Giorgi Beridze", "Nino Kvaratskhelia", "Levan Mchedlishvili",
    "Tamara Jikia", "Irakli Tsiklauri", "Ana Gogitidze",
    "Davit Kakhniashvili", "Salome Tsereteli",
];

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
