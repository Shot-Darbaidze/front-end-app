"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import Button from "@/components/ui/Button";
import { AlertCircle, Loader2 } from "lucide-react";
import { API_CONFIG } from "@/config/constants";

import {
  BookingResponse, CancellationResponse, CancellationReason, TabId, TABS,
} from "@/components/dashboard/lessons/types";
import { UpcomingLessons } from "@/components/dashboard/lessons/UpcomingLessons";
import { PastLessons } from "@/components/dashboard/lessons/PastLessons";
import { CancelledLessons } from "@/components/dashboard/lessons/CancelledLessons";
import { CancelModal } from "@/components/dashboard/lessons/CancelModal";

export default function LessonsPage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const isInstructor = (clerkUser?.publicMetadata?.userType as string) === "instructor";

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const minCancelHours = parseInt(process.env.NEXT_PUBLIC_MIN_CANCEL_HOURS || "24", 10);

  const fetchLessons = useCallback(async (tab?: TabId) => {
    const currentTab = tab ?? activeTab;
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) { setError("Not authenticated"); return; }

      if (currentTab === "cancelled") {
        // Only fetch cancellations for the cancelled tab
        const cancellationsRes = await fetch(
          `${API_CONFIG.BASE_URL}/api/bookings/cancellations/mine`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allCancellations: CancellationResponse[] = cancellationsRes.ok ? await cancellationsRes.json() : [];
        setCancelledLessons(allCancellations);
      } else {
        // Fetch bookings with status filter for upcoming/past tabs
        const statusParam = currentTab === "upcoming" ? "?status=booked" : "";
        const bookingsRes = await fetch(
          `${API_CONFIG.BASE_URL}/api/bookings/mine${statusParam}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!bookingsRes.ok) throw new Error("Failed to fetch lessons");

        const allBookings: BookingResponse[] = await bookingsRes.json();
        const now = new Date();

        if (currentTab === "upcoming") {
          const upcoming = allBookings.filter((b) => new Date(b.start_time_utc) > now);
          setUpcomingLessons(upcoming);
        } else {
          // "past" tab: completed bookings + booked ones in the past
          const past = allBookings.filter(
            (b) => b.status === "completed" || (b.status === "booked" && new Date(b.start_time_utc) <= now)
          );
          setPastLessons(past);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, activeTab]);

  // Fetch data when tab changes
  useEffect(() => { fetchLessons(activeTab); }, [activeTab, fetchLessons]);

  const canCancelLesson = useCallback((lesson: BookingResponse): boolean => {
    const hours = (new Date(lesson.start_time_utc).getTime() - Date.now()) / (1000 * 60 * 60);
    return hours >= minCancelHours;
  }, [minCancelHours]);

  const handleCancelClick = useCallback((lesson: BookingResponse) => {
    setLessonToCancel(lesson);
    setCancelReason("schedule_conflict");
    setCancelDescription("");
    setCancelError(null);
    setCancelModalOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!lessonToCancel) return;
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
      await fetchLessons("upcoming");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel lesson");
    } finally {
      setIsCancelling(false);
    }
  }, [lessonToCancel, cancelReason, cancelDescription, getToken, fetchLessons]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor={isInstructor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs + Book New Lesson */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 w-full sm:w-fit shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                  ? "bg-[#F03D3D] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button className="w-full sm:w-auto">Book New Lesson</Button>
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
              <Button variant="outline" className="mt-4" onClick={() => fetchLessons()}>Try Again</Button>
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
                />
              )}
              {activeTab === "past" && <PastLessons lessons={pastLessons} />}
              {activeTab === "cancelled" && <CancelledLessons lessons={cancelledLessons} />}
            </>
          )}
        </div>
      </div>

      {cancelModalOpen && lessonToCancel && (
        <CancelModal
          lessonStartTime={lessonToCancel.start_time_utc}
          cancelReason={cancelReason}
          cancelDescription={cancelDescription}
          cancelError={cancelError}
          isCancelling={isCancelling}
          onReasonChange={setCancelReason}
          onDescriptionChange={setCancelDescription}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelModalOpen(false)}
        />
      )}
    </div>
  );
}
