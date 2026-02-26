"use client";

import React, { useState, useCallback, memo, useEffect } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import Button from "@/components/ui/Button";
import { Clock, MoreVertical, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { API_CONFIG } from '@/config/constants';
import Link from "next/link";

// Types for lessons from API
interface BookingResponse {
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

// ─── MOCK UPCOMING LESSONS (remove before production) ───────────────────────
const MOCK_UPCOMING: BookingResponse[] = [
  {
    id: "mock-1",
    user_id: null,
    post_id: "abc",
    start_time_utc: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    status: "booked",
    mode: "city",
    price: 45,
    instructor_name: "Giorgi Beridze",
  },
  {
    id: "mock-2",
    user_id: null,
    post_id: "def",
    start_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 90,
    status: "booked",
    mode: "yard",
    price: 60,
    instructor_name: "Nino Kvaratskhelia",
  },
];
// ────────────────────────────────────────────────────────────────────────────

// ─── MOCK CANCELLED LESSONS (remove before production) ───────────────────────
const MOCK_CANCELLED: CancellationResponse[] = [
  {
    id: "cancel-1",
    booking_id: "bk-1",
    cancelled_by_user_id: null,
    reason: "schedule_conflict",
    description: null,
    original_start_time_utc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    original_duration_minutes: 60,
    original_mode: "city",
    original_price: 45,
    original_post_id: "abc",
    cancelled_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cancel-2",
    booking_id: "bk-2",
    cancelled_by_user_id: null,
    reason: "illness",
    description: "Had a fever that day",
    original_start_time_utc: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    original_duration_minutes: 90,
    original_mode: "yard",
    original_price: 60,
    original_post_id: "def",
    cancelled_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cancel-3",
    booking_id: "bk-3",
    cancelled_by_user_id: null,
    reason: "instructor_request",
    description: null,
    original_start_time_utc: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    original_duration_minutes: 60,
    original_mode: "city",
    original_price: null,
    original_post_id: "ghi",
    cancelled_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
// ────────────────────────────────────────────────────────────────────────────

// Cancellation record from API
interface CancellationResponse {
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

// Structured cancellation reasons
type CancellationReason =
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

const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
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

// Define tab IDs as a union type for type safety
type TabId = "upcoming" | "past" | "cancelled";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

export default function LessonsPage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const userType = (clerkUser?.publicMetadata?.userType as "student" | "instructor") || "student";
  const isInstructor = userType === "instructor";
  const [activeTab, setActiveTab] = useState<TabId>("upcoming");

  // State for lessons data
  const [upcomingLessons, setUpcomingLessons] = useState<BookingResponse[]>([]);
  const [pastLessons, setPastLessons] = useState<BookingResponse[]>([]);
  const [cancelledLessons, setCancelledLessons] = useState<CancellationResponse[]>([]);
  const [lessonCodes, setLessonCodes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [lessonToCancel, setLessonToCancel] = useState<BookingResponse | null>(null);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("schedule_conflict");
  const [cancelDescription, setCancelDescription] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Fetch lessons from API
  const fetchLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Fetch all user's bookings and cancellations in parallel
      const [bookingsResponse, cancellationsResponse] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/api/bookings/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_CONFIG.BASE_URL}/api/bookings/cancellations/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!bookingsResponse.ok) {
        throw new Error("Failed to fetch lessons");
      }

      const allBookings: BookingResponse[] = await bookingsResponse.json();
      const allCancellations: CancellationResponse[] = cancellationsResponse.ok
        ? await cancellationsResponse.json()
        : [];

      const now = new Date();

      // Filter by status and time
      const upcoming = allBookings.filter(
        (b) => b.status === "booked" && new Date(b.start_time_utc) > now
      );
      const past = allBookings.filter(
        (b) => b.status === "completed" || (b.status === "booked" && new Date(b.start_time_utc) <= now)
      );

      setUpcomingLessons([...MOCK_UPCOMING, ...upcoming]); // TODO: remove MOCK_UPCOMING before production
      setPastLessons(past);
      setCancelledLessons([...MOCK_CANCELLED, ...allCancellations]); // TODO: remove MOCK_CANCELLED before production

      // Fetch lesson codes for all upcoming lessons
      if (upcoming.length > 0) {
        setIsLoadingCodes(true);
        const codes: Record<string, string> = {};

        await Promise.all(
          upcoming.map(async (lesson) => {
            try {
              const codeResponse = await fetch(
                `${API_CONFIG.BASE_URL}/api/bookings/${lesson.id}/code`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (codeResponse.ok) {
                const codeData = await codeResponse.json();
                codes[lesson.id] = codeData.lesson_code;
              }
            } catch {
              // Silently fail for individual code fetches
            }
          })
        );

        setLessonCodes(codes);
        setIsLoadingCodes(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Memoize tab click handler
  const handleTabClick = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  // Handle cancel button click
  const handleCancelClick = useCallback((lesson: BookingResponse) => {
    setLessonToCancel(lesson);
    setCancelReason("schedule_conflict");
    setCancelDescription("");
    setCancelError(null);
    setCancelModalOpen(true);
  }, []);

  // Handle cancel confirmation
  const handleConfirmCancel = useCallback(async () => {
    if (!lessonToCancel) {
      setCancelError("No lesson selected");
      return;
    }

    if (cancelReason === "other" && !cancelDescription.trim()) {
      setCancelError("Please provide a description for 'Other' reason");
      return;
    }

    try {
      setIsCancelling(true);
      setCancelError(null);
      const token = await getToken();
      if (!token) {
        setCancelError("Not authenticated");
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/bookings/${lessonToCancel.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: cancelReason,
            description: cancelDescription.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to cancel lesson");
      }

      // Success - close modal and refresh lessons
      setCancelModalOpen(false);
      setLessonToCancel(null);
      setCancelReason("schedule_conflict");
      setCancelDescription("");
      await fetchLessons();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel lesson");
    } finally {
      setIsCancelling(false);
    }
  }, [lessonToCancel, cancelReason, cancelDescription, getToken, fetchLessons]);

  // Cancellation policy - configurable hours before lesson start
  const minCancelHours = parseInt(process.env.NEXT_PUBLIC_MIN_CANCEL_HOURS || "24", 10);

  // Check if lesson can be cancelled (minCancelHours+ before start)
  const canCancelLesson = useCallback((lesson: BookingResponse): boolean => {
    const startTime = new Date(lesson.start_time_utc);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilStart >= minCancelHours;
  }, [minCancelHours]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs + Book New Lesson */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 w-fit shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  px-6 py-2.5 text-sm font-medium rounded-lg transition-all
                  ${activeTab === tab.id
                    ? "bg-[#F03D3D] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button className="hidden sm:block">Book New Lesson</Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-100">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Error loading lessons</h3>
              <p className="text-gray-500 mt-1">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchLessons}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {activeTab === "upcoming" && (
                <UpcomingLessons
                  lessons={upcomingLessons}
                  onCancelClick={handleCancelClick}
                  canCancelLesson={canCancelLesson}
                  lessonCodes={lessonCodes}
                  isLoadingCodes={isLoadingCodes}
                  minCancelHours={minCancelHours}
                />
              )}
              {activeTab === "past" && <PastLessons lessons={pastLessons} />}
              {activeTab === "cancelled" && <CancelledLessons lessons={cancelledLessons} />}
            </>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && lessonToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Lesson</h2>
            <p className="text-gray-500 mb-4">
              Are you sure you want to cancel this lesson scheduled for{" "}
              <span className="font-medium text-gray-900">
                {formatDate(lessonToCancel.start_time_utc)}
              </span>
              ?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value as CancellationReason)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                {(Object.keys(CANCELLATION_REASON_LABELS) as CancellationReason[]).map((key) => (
                  <option key={key} value={key}>
                    {CANCELLATION_REASON_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            {cancelReason === "other" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe your reason
                </label>
                <textarea
                  value={cancelDescription}
                  onChange={(e) => setCancelDescription(e.target.value)}
                  placeholder="Please provide details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}

            {cancelError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Lesson
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmCancel}
                disabled={isCancelling || (cancelReason === "other" && !cancelDescription.trim())}
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
        </div>
      )}
    </div>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Helper function to format time
function formatTime(dateString: string, durationMinutes: number): string {
  const start = new Date(dateString);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

// Memoized lesson card for upcoming lessons
interface UpcomingLessonCardProps {
  lesson: BookingResponse;
  onCancelClick: (lesson: BookingResponse) => void;
  canCancel: boolean;
  lessonCode?: string;
  isLoadingCode: boolean;
  minCancelHours: number;
}

const UpcomingLessonCard = memo(function UpcomingLessonCard({
  lesson,
  onCancelClick,
  canCancel,
  lessonCode,
  isLoadingCode,
  minCancelHours
}: UpcomingLessonCardProps) {
  const startDate = new Date(lesson.start_time_utc);
  const fullDate = startDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Left: icon + date + link */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
            <Clock className="w-5 h-5 text-[#F03D3D]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{lesson.instructor_name || "Instructor"}</h3>
            <p className="text-sm text-gray-500">{fullDate}</p>
            <Link
              href={`/instructors/${lesson.post_id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-1"
            >
              View Instructor
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right: badges + actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time & Duration */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {formatTime(lesson.start_time_utc, lesson.duration_minutes)} · {lesson.duration_minutes} min
          </div>

          {/* Price */}
          {lesson.price != null && (
            <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
              ₾{lesson.price.toFixed(0)}
            </span>
          )}

          {/* Cancel */}
          {canCancel ? (
            <button
              onClick={() => onCancelClick(lesson)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
            >
              Cancel
            </button>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">
              Locked {minCancelHours}h before
            </span>
          )}
        </div>

      </div>
    </div>
  );
});

// Memoized lesson card for past lessons
interface PastLessonCardProps {
  lesson: BookingResponse;
}

const MOCK_INSTRUCTOR_NAMES = [
  "Giorgi Beridze", "Nino Kvaratskhelia", "Levan Mchedlishvili",
  "Tamara Jikia", "Irakli Tsiklauri", "Ana Gogitidze",
  "Davit Kakhniashvili", "Salome Tsereteli",
];

const PastLessonCard = memo(function PastLessonCard({ lesson }: PastLessonCardProps) {
  const startDate = new Date(lesson.start_time_utc);
  const fullDate = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fallbackName = MOCK_INSTRUCTOR_NAMES[
    lesson.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_INSTRUCTOR_NAMES.length
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
            <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{lesson.instructor_name || fallbackName}</h3>
            <p className="text-sm text-gray-500">{fullDate} • {lesson.duration_minutes} min</p>
            <Link
              href={`/instructors/${lesson.post_id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-1"
            >
              View Instructor
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Time & Duration */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {formatTime(lesson.start_time_utc, lesson.duration_minutes)} · {lesson.duration_minutes} min
          </div>

          {lesson.price != null && (
            <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">₾{lesson.price.toFixed(0)}</span>
          )}
          <Button variant="subtle" size="sm">Rate Lesson</Button>
          <Button variant="outline" size="sm">Book Again</Button>
        </div>
      </div>
    </div>
  );
});

// Cancelled lesson card - uses CancellationResponse from the dedicated cancellations table
interface CancelledLessonCardProps {
  cancellation: CancellationResponse;
}

const CancelledLessonCard = memo(function CancelledLessonCard({ cancellation }: CancelledLessonCardProps) {
  const startDate = new Date(cancellation.original_start_time_utc);
  const fullDate = startDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const reasonLabel = CANCELLATION_REASON_LABELS[cancellation.reason] || cancellation.reason;

  const fallbackName = MOCK_INSTRUCTOR_NAMES[
    cancellation.original_post_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_INSTRUCTOR_NAMES.length
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-70 hover:opacity-100 transition-opacity group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Left: icon + name + date + link */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{fallbackName}</h3>
            <p className="text-sm text-gray-500">{fullDate}</p>
            <Link
              href={`/instructors/${cancellation.original_post_id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#F03D3D] hover:text-red-700 hover:underline mt-1"
            >
              View Instructor
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right: reason | time + price + badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Reason */}
          <span className="text-xs font-semibold text-gray-400">{reasonLabel}</span>

          <span className="text-gray-200 select-none">|</span>

          {/* Time & Duration */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {formatTime(cancellation.original_start_time_utc, cancellation.original_duration_minutes)} · {cancellation.original_duration_minutes} min
          </div>

          {/* Price */}
          {cancellation.original_price != null && (
            <span className="text-sm font-bold text-emerald-600">
              ₾{cancellation.original_price.toFixed(0)}
            </span>
          )}

          {/* Cancelled badge */}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-500">
            Cancelled
          </span>
        </div>

      </div>
    </div>
  );
});

// Memoized list components
interface UpcomingLessonsProps {
  lessons: BookingResponse[];
  onCancelClick: (lesson: BookingResponse) => void;
  canCancelLesson: (lesson: BookingResponse) => boolean;
  lessonCodes: Record<string, string>;
  isLoadingCodes: boolean;
  minCancelHours: number;
}

const UpcomingLessons = memo(function UpcomingLessons({
  lessons,
  onCancelClick,
  canCancelLesson,
  lessonCodes,
  isLoadingCodes,
  minCancelHours
}: UpcomingLessonsProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No upcoming lessons</h3>
        <p className="text-gray-500 mt-1">Book a lesson to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {lessons.map((lesson) => (
        <UpcomingLessonCard
          key={lesson.id}
          lesson={lesson}
          onCancelClick={onCancelClick}
          canCancel={canCancelLesson(lesson)}
          lessonCode={lessonCodes[lesson.id]}
          isLoadingCode={isLoadingCodes}
          minCancelHours={minCancelHours}
        />
      ))}
    </div>
  );
});

interface PastLessonsProps {
  lessons: BookingResponse[];
}

const PastLessons = memo(function PastLessons({ lessons }: PastLessonsProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No past lessons</h3>
        <p className="text-gray-500 mt-1">Your completed lessons will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {lessons.map((lesson) => (
        <PastLessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
});

interface CancelledLessonsProps {
  lessons: CancellationResponse[];
}

const CancelledLessons = memo(function CancelledLessons({ lessons }: CancelledLessonsProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No cancelled lessons</h3>
        <p className="text-gray-500 mt-1">You haven&apos;t cancelled any lessons recently.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {lessons.map((cancellation) => (
        <CancelledLessonCard key={cancellation.id} cancellation={cancellation} />
      ))}
    </div>
  );
});
