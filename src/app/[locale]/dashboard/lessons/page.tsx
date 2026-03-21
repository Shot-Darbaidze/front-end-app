"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import Button from "@/components/ui/Button";
import { AlertCircle, CalendarClock, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useInstructorApproval } from "@/hooks/useInstructorApproval";
import { API_CONFIG } from "@/config/constants";

import {
  BookingResponse, CancellationResponse, CancellationReason, TabId, TABS,
} from "@/components/dashboard/lessons/types";
import { UpcomingLessons } from "@/components/dashboard/lessons/UpcomingLessons";
import { PastLessons } from "@/components/dashboard/lessons/PastLessons";
import { CancelledLessons } from "@/components/dashboard/lessons/CancelledLessons";
import { CancelModal } from "@/components/dashboard/lessons/CancelModal";

const LESSONS_CACHE_KEY_PREFIX = "dashboard-lessons-v1";
const LESSONS_CACHE_TTL = 2 * 60 * 1000;
const CANCELLATION_CONFIRM_TOKENS = ["cancel", "გაუქმება"] as const;

interface LessonsCachePayload {
  upcomingLessons: BookingResponse[];
  pastLessons: BookingResponse[];
  cancelledLessons: CancellationResponse[];
  fetchedTabs: Record<TabId, boolean>;
}

interface InstructorBookingRow {
  id: string;
  user_id: string | null;
  post_id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: "booked" | "completed" | "cancelled";
  mode: "city" | "yard" | null;
  price?: number | null;
  student?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  } | null;
}

function getCachedLessons(userId: string): LessonsCachePayload | null {
  if (typeof window === "undefined") return null;
  const cacheKey = `${LESSONS_CACHE_KEY_PREFIX}:${userId}`;
  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { timestamp?: number; data?: LessonsCachePayload };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > LESSONS_CACHE_TTL) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.data ?? null;
  } catch {
    window.sessionStorage.removeItem(cacheKey);
    return null;
  }
}

function setCachedLessons(userId: string, data: LessonsCachePayload) {
  if (typeof window === "undefined") return;
  const cacheKey = `${LESSONS_CACHE_KEY_PREFIX}:${userId}`;
  try {
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // Ignore storage write failures.
  }
}

export default function LessonsPage() {
  const { user } = useUser();
  const { getToken } = useClerkAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localeHref = useLocaleHref();
  const { isInstructor, isLoading: isRoleLoading } = useInstructorApproval();
  const userId = user?.id;
  const locale = pathname?.split("/")[1] ?? "ka";
  const confirmationPrimary = locale === "ka" ? "გაუქმება" : "cancel";
  const confirmationSecondary = locale === "ka" ? "cancel" : "გაუქმება";

  const [activeTab, setActiveTab] = useState<TabId>("upcoming");
  const [upcomingLessons, setUpcomingLessons] = useState<BookingResponse[]>([]);
  const [pastLessons, setPastLessons] = useState<BookingResponse[]>([]);
  const [cancelledLessons, setCancelledLessons] = useState<CancellationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [lessonToCancel, setLessonToCancel] = useState<BookingResponse | null>(null);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("schedule_conflict");
  const [cancelDescription, setCancelDescription] = useState("");
  const [cancelConfirmationText, setCancelConfirmationText] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const minCancelHours = parseInt(process.env.NEXT_PUBLIC_MIN_CANCEL_HOURS || "24", 10);
  const requestedTab = (searchParams.get("tab") as TabId | null) ?? null;
  const notificationBookingId = searchParams.get("bookingId");
  const notificationCancellationId = searchParams.get("cancellationId");
  const highlightedBookingId = activeTab !== "cancelled" ? notificationBookingId : null;
  const highlightedCancellationId = activeTab === "cancelled" ? notificationCancellationId : null;

  const activeTabMeta = {
    upcoming: {
      title: "Upcoming Lessons",
      subtitle: "These are your next scheduled lessons.",
      icon: CalendarClock,
    },
    past: {
      title: "Past Lessons",
      subtitle: "Completed and elapsed lessons are listed here.",
      icon: CheckCircle2,
    },
    cancelled: {
      title: "Cancelled Lessons",
      subtitle: "Lessons cancelled by you or the other participant.",
      icon: XCircle,
    },
  } as const;

  const ActiveTabIcon = activeTabMeta[activeTab].icon;

  useEffect(() => {
    if (!requestedTab) return;
    if (!TABS.some((tab) => tab.id === requestedTab)) return;
    if (requestedTab === activeTab) return;
    setActiveTab(requestedTab);
  }, [requestedTab, activeTab]);

  const fetchLessons = useCallback(async (tab?: TabId, showLoading = true) => {
    const currentTab = tab ?? activeTab;
    try {
      if (showLoading) {
        setIsLoading(true);
        setError(null);
      }

      const token = await getToken();
      if (!token) {
        if (showLoading) setError("Not authenticated");
        return;
      }

      if (currentTab === "cancelled") {
        // Only fetch cancellations for the cancelled tab
        const cancellationsUrl = isInstructor
          ? `${API_CONFIG.BASE_URL}/api/bookings/cancellations/instructor/mine`
          : `${API_CONFIG.BASE_URL}/api/bookings/cancellations/mine`;
        const cancellationsRes = await fetch(
          cancellationsUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allCancellations: CancellationResponse[] = cancellationsRes.ok ? await cancellationsRes.json() : [];

        const cached = userId ? getCachedLessons(userId) : null;
        if (userId) {
          setCachedLessons(userId, {
            upcomingLessons: cached?.upcomingLessons ?? [],
            pastLessons: cached?.pastLessons ?? [],
            cancelledLessons: allCancellations,
            fetchedTabs: {
              upcoming: cached?.fetchedTabs.upcoming ?? false,
              past: cached?.fetchedTabs.past ?? false,
              cancelled: true,
            },
          });
        }

        setCancelledLessons(allCancellations);
      } else {
        // Fetch bookings with status filter for upcoming/past tabs
        const statusParam = currentTab === "upcoming" ? "?status=booked" : "";
        const bookingsUrl = isInstructor
          ? `${API_CONFIG.BASE_URL}/api/bookings/slots/mine/with-students?statuses=booked,completed`
          : `${API_CONFIG.BASE_URL}/api/bookings/mine${statusParam}`;
        const bookingsRes = await fetch(
          bookingsUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!bookingsRes.ok) throw new Error("Failed to fetch lessons");

        const rawBookings = await bookingsRes.json();
        const allBookings: BookingResponse[] = isInstructor
          ? (rawBookings as InstructorBookingRow[]).map((row) => {
            const studentName = row.student
              ? `${row.student.first_name || ""} ${row.student.last_name || ""}`.trim() || "Student"
              : "Student";
            return {
              id: row.id,
              user_id: row.user_id,
              post_id: row.post_id,
              start_time_utc: row.start_time_utc,
              duration_minutes: row.duration_minutes,
              status: row.status,
              mode: row.mode,
              price: row.price ?? null,
              // Reuse existing card fields for role-specific rendering.
              instructor_name: studentName,
              instructor_image: row.student?.image_url ?? null,
            };
          })
          : (rawBookings as BookingResponse[]);
        const now = new Date();

        if (currentTab === "upcoming") {
          const upcoming = allBookings.filter((b) => new Date(b.start_time_utc) > now);
          setUpcomingLessons(upcoming);

          const cached = userId ? getCachedLessons(userId) : null;
          if (userId) {
            setCachedLessons(userId, {
              upcomingLessons: upcoming,
              pastLessons: cached?.pastLessons ?? [],
              cancelledLessons: cached?.cancelledLessons ?? [],
              fetchedTabs: {
                upcoming: true,
                past: cached?.fetchedTabs.past ?? false,
                cancelled: cached?.fetchedTabs.cancelled ?? false,
              },
            });
          }
        } else {
          // "past" tab: completed bookings + booked ones in the past
          const past = allBookings.filter(
            (b) => b.status === "completed" || (b.status === "booked" && new Date(b.start_time_utc) <= now)
          );
          setPastLessons(past);

          const cached = userId ? getCachedLessons(userId) : null;
          if (userId) {
            setCachedLessons(userId, {
              upcomingLessons: cached?.upcomingLessons ?? [],
              pastLessons: past,
              cancelledLessons: cached?.cancelledLessons ?? [],
              fetchedTabs: {
                upcoming: cached?.fetchedTabs.upcoming ?? false,
                past: true,
                cancelled: cached?.fetchedTabs.cancelled ?? false,
              },
            });
          }
        }
      }
    } catch (err) {
      if (showLoading) {
        setError(err instanceof Error ? err.message : "Failed to load lessons");
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [getToken, activeTab, userId, isInstructor]);

  // Fetch data when tab changes
  useEffect(() => {
    if (isRoleLoading) {
      setIsLoading(true);
      return;
    }

    if (!userId) {
      setUpcomingLessons([]);
      setPastLessons([]);
      setCancelledLessons([]);
      setIsLoading(false);
      return;
    }

    const cached = getCachedLessons(userId);
    if (cached) {
      setUpcomingLessons(cached.upcomingLessons);
      setPastLessons(cached.pastLessons);
      setCancelledLessons(cached.cancelledLessons);
    }

    if (cached?.fetchedTabs?.[activeTab]) {
      setIsLoading(false);
      setError(null);
      void fetchLessons(activeTab, false);
      return;
    }

    void fetchLessons(activeTab, true);
  }, [activeTab, fetchLessons, userId, isRoleLoading]);

  useEffect(() => {
    if (isLoading) return;

    const targetId = activeTab === "cancelled"
      ? notificationCancellationId
      : notificationBookingId;

    if (!targetId) return;

    const elementId = activeTab === "cancelled"
      ? `cancel-card-${targetId}`
      : `lesson-card-${targetId}`;
    const targetElement = document.getElementById(elementId);

    if (!targetElement) return;

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [
    isLoading,
    activeTab,
    notificationBookingId,
    notificationCancellationId,
    upcomingLessons,
    pastLessons,
    cancelledLessons,
  ]);

  const canCancelLesson = useCallback((lesson: BookingResponse): boolean => {
    const hours = (new Date(lesson.start_time_utc).getTime() - Date.now()) / (1000 * 60 * 60);
    return hours >= minCancelHours;
  }, [minCancelHours]);

  const handleCancelClick = useCallback((lesson: BookingResponse) => {
    setLessonToCancel(lesson);
    setCancelReason("schedule_conflict");
    setCancelDescription("");
    setCancelConfirmationText("");
    setCancelError(null);
    setCancelModalOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!lessonToCancel) return;

    const normalized = cancelConfirmationText.trim().toLowerCase();
    if (!CANCELLATION_CONFIRM_TOKENS.includes(normalized as (typeof CANCELLATION_CONFIRM_TOKENS)[number])) {
      setCancelError('Please type "cancel" or "გაუქმება" to confirm cancellation');
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
      if (!token) { setCancelError("Not authenticated"); return; }

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/bookings/${lessonToCancel.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason, description: cancelDescription.trim() || null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to cancel lesson");
      }

      setCancelModalOpen(false);
      setLessonToCancel(null);
      setCancelConfirmationText("");
      await fetchLessons("upcoming");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel lesson");
    } finally {
      setIsCancelling(false);
    }
  }, [lessonToCancel, cancelReason, cancelDescription, cancelConfirmationText, getToken, fetchLessons]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {!isRoleLoading && <MobileDashboardNav isInstructor={isInstructor} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs + Book New Lesson */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-fit shadow-inner">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap border ${activeTab === tab.id
                  ? "bg-[#F03D3D] text-white border-[#F03D3D] shadow-lg shadow-red-600/25 scale-[1.01]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                  }`}
              >
                <span className="inline-flex items-center gap-2">
                  {tab.label}
                  {activeTab === tab.id && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/90" />}
                </span>
              </button>
            ))}
          </div>
          <Link href={localeHref("/find-instructors")}>
            <Button className="w-full sm:w-auto">Book New Lesson</Button>
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-red-100 text-[#F03D3D]">
              <ActiveTabIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{activeTabMeta[activeTab].title}</p>
              <p className="text-xs text-slate-600">{activeTabMeta[activeTab].subtitle}</p>
            </div>
          </div>

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
              <Button variant="outline" className="mt-4" onClick={() => fetchLessons(activeTab, true)}>Try Again</Button>
            </div>
          ) : (
            <>
              {activeTab === "upcoming" && (
                <UpcomingLessons
                  lessons={upcomingLessons}
                  onCancelClick={handleCancelClick}
                  canCancelLesson={canCancelLesson}
                  lessonCodes={{}}
                  isLoadingCodes={false}
                  minCancelHours={minCancelHours}
                  isInstructor={isInstructor}
                  highlightedBookingId={highlightedBookingId}
                />
              )}
              {activeTab === "past" && (
                <PastLessons
                  lessons={pastLessons}
                  isInstructor={isInstructor}
                  highlightedBookingId={highlightedBookingId}
                />
              )}
              {activeTab === "cancelled" && (
                <CancelledLessons
                  lessons={cancelledLessons}
                  isInstructor={isInstructor}
                  highlightedCancellationId={highlightedCancellationId}
                />
              )}
            </>
          )}
        </div>
      </div>

      {cancelModalOpen && lessonToCancel && (
        <CancelModal
          lessonStartTime={lessonToCancel.start_time_utc}
          cancelReason={cancelReason}
          cancelDescription={cancelDescription}
          cancelConfirmationText={cancelConfirmationText}
          confirmationPrimary={confirmationPrimary}
          confirmationSecondary={confirmationSecondary}
          cancelError={cancelError}
          isCancelling={isCancelling}
          onReasonChange={setCancelReason}
          onDescriptionChange={setCancelDescription}
          onConfirmationTextChange={setCancelConfirmationText}
          onConfirm={handleConfirmCancel}
          onClose={() => {
            setCancelModalOpen(false);
            setCancelConfirmationText("");
          }}
        />
      )}
    </div>
  );
}
