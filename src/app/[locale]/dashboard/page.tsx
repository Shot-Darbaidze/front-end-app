"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAutoschoolAdmin } from "@/hooks/useAutoschoolAdmin";
import InviteNotifications from "@/components/autoschool/InviteNotifications";
import ManageInstructors from "@/components/autoschool/ManageInstructors";
import { AutoschoolSidebarNav, type AutoschoolTabId } from "@/components/dashboard/autoschool/AutoschoolSidebarNav";
import { AutoschoolFinances } from "@/components/dashboard/autoschool/AutoschoolFinances";
import { AutoschoolPackages } from "@/components/dashboard/autoschool/AutoschoolPackages";
import { AutoschoolPricing } from "@/components/dashboard/autoschool/AutoschoolPricing";

// Shared
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

// Student components
import { NextLessonCard } from "@/components/dashboard/student/NextLessonCard";
import { StudentStats } from "@/components/dashboard/student/StudentStats";
import { RecentActivity } from "@/components/dashboard/student/RecentActivity";
import { DrivingTips } from "@/components/dashboard/student/DrivingTips";

import { InstructorNextLessonCard } from "@/components/dashboard/instructor/InstructorNextLessonCard";
import type { InstructorNextLessonData } from "@/components/dashboard/instructor/InstructorNextLessonCard";
import { InstructorUpcomingLessonCard, InstructorUpcomingLessonSkeleton } from "@/components/dashboard/instructor/InstructorUpcomingLessonCard";
import { InstructorActivity } from "@/components/dashboard/instructor/InstructorActivity";
import type { InstructorActivityItemData } from "@/components/dashboard/instructor/InstructorActivity";
import type { StudentNextLessonData } from "@/components/dashboard/student/NextLessonCard";
import type { RecentActivityItem } from "@/components/dashboard/student/RecentActivity";

const APPROVAL_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000; // 2 minutes stale-while-revalidate
const API_TIMEOUT_MS = 10_000; // 10 seconds

// ---- Types matching the combined /api/dashboard/summary response ----

type DashboardBooking = {
  id: string;
  post_id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: string;
  mode: string | null;
  price: number | null;
  instructor_name: string | null;
  instructor_image: string | null;
  instructor_location: string | null;
  instructor_transmission: string | null;
};

type DashboardCancellation = {
  id: string;
  original_post_id: string;
  cancelled_at: string;
  instructor_name: string | null;
};

type DashboardComment = {
  id: string;
  post_id: string;
  comment_text: string;
  rating: number | null;
  created_at: string;
  instructor_name: string | null;
};

type DashboardStats = {
  total_completed: number;
  total_hours: number;
  upcoming_count: number;
};

type InstructorSlotStudent = {
  id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: string;
  mode: string | null;
  price: number | null;
  student_first_name: string | null;
  student_last_name: string | null;
  student_image_url: string | null;
};

type InstructorActivityItemAPI = {
  id: string;
  type: string;
  occurred_at: string;
  student_name: string | null;
  price: number | null;
};

type InstructorDashboardData = {
  upcoming_slots: InstructorSlotStudent[];
  recent_activity: InstructorActivityItemAPI[];
  stats_total_completed: number;
  stats_total_hours: number;
  stats_upcoming_count: number;
  stats_total_students: number;
};

type DashboardSummary = {
  is_approved: boolean;
  bookings: DashboardBooking[];
  cancellations: DashboardCancellation[];
  comments: DashboardComment[];
  stats: DashboardStats;
  instructor_data?: InstructorDashboardData | null;
};

/** Read cached approval from localStorage with TTL check */
function getCachedApproval(userId: string): boolean | null {
  if (typeof window === "undefined") return null;
  const cacheKey = `instructor-approval-v2:${userId}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { is_approved?: boolean; timestamp?: number };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > APPROVAL_CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return Boolean(parsed.is_approved);
  } catch {
    localStorage.removeItem(cacheKey);
    return null;
  }
}

/** Write approval to localStorage with timestamp */
function setCachedApproval(userId: string, is_approved: boolean) {
  if (typeof window === "undefined") return;
  const cacheKey = `instructor-approval-v2:${userId}`;
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ is_approved, timestamp: Date.now() })
    );
  } catch { /* storage full — ignore */ }
}

/** Read cached dashboard summary from sessionStorage (short TTL) */
function getCachedDashboard(userId: string): DashboardSummary | null {
  if (typeof window === "undefined") return null;
  const cacheKey = `dashboard-summary-v1:${userId}`;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: DashboardSummary; timestamp: number };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > DASHBOARD_CACHE_TTL) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    return parsed.data;
  } catch {
    sessionStorage.removeItem(cacheKey);
    return null;
  }
}

/** Cache dashboard summary in sessionStorage */
function setCachedDashboard(userId: string, data: DashboardSummary) {
  if (typeof window === "undefined") return;
  const cacheKey = `dashboard-summary-v1:${userId}`;
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch { /* storage full — ignore */ }
}

/** Fetch with a timeout (AbortController) */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Process raw dashboard data into derived UI state */
function processDashboardData(data: DashboardSummary) {
  const { bookings, cancellations, comments } = data;
  const now = Date.now();

  // --- Next lesson ---
  const upcoming = bookings
    .filter((b) => b.status === "booked" && new Date(b.start_time_utc).getTime() > now)
    .sort((a, b) => new Date(a.start_time_utc).getTime() - new Date(b.start_time_utc).getTime());

  const next = upcoming[0];
  const nextLesson: StudentNextLessonData | null = next
    ? {
        id: next.id,
        postId: next.post_id,
        startTimeUtc: next.start_time_utc,
        durationMinutes: next.duration_minutes,
        mode: next.mode as "city" | "yard" | null,
        location: next.instructor_location || null,
        transmission: next.instructor_transmission || null,
        instructorName: next.instructor_name || "Instructor",
      }
    : null;

  // --- Recent Activity (mixed feed) ---
  const pastLessons = bookings
    .filter((b) => b.status === "completed" || (b.status === "booked" && new Date(b.start_time_utc).getTime() <= now))
    .sort((a, b) => new Date(b.start_time_utc).getTime() - new Date(a.start_time_utc).getTime());

  const completedActivity: RecentActivityItem[] =
    pastLessons.length > 0
      ? [
          {
            id: `completed-${pastLessons[0].id}`,
            type: "completed",
            instructorName: pastLessons[0].instructor_name || "Instructor",
            occurredAt: pastLessons[0].start_time_utc,
          },
        ]
      : [];

  const cancelledActivity: RecentActivityItem[] = cancellations.map((c) => ({
    id: `cancelled-${c.id}`,
    type: "cancelled",
    instructorName: c.instructor_name || undefined,
    occurredAt: c.cancelled_at,
  }));

  const reviewActivity: RecentActivityItem[] = comments.map((c) => ({
    id: `reviewed-${c.id}`,
    type: "reviewed",
    instructorName: c.instructor_name || undefined,
    occurredAt: c.created_at,
  }));

  const recentActivity = [...completedActivity, ...cancelledActivity, ...reviewActivity]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 6);

  return { nextLesson, recentActivity };
}

export default function DashboardPage() {
  const { getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { t, language } = useLanguage();
  const { schoolId: mySchoolId, isAutoschoolAdmin, isLoading: isAutoschoolRoleLoading } = useAutoschoolAdmin();
  const userId = clerkUser?.id;

  // Always start with loading/empty state to match SSR (avoids hydration mismatch).
  // Cache is applied in useEffect after mount.
  const cachedApproval = useRef<boolean | null>(null);
  const cachedDashboard = useRef<DashboardSummary | null>(null);

  const [isApproved, setIsApproved] = useState(false);
  const [nextLesson, setNextLesson] = useState<StudentNextLessonData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [studentStats, setStudentStats] = useState<DashboardStats>(
    { total_completed: 0, total_hours: 0, upcoming_count: 0 }
  );
  // Instructor-specific state
  const [instructorNextLesson, setInstructorNextLesson] = useState<InstructorNextLessonData | null>(null);
  const [instructorUpcoming, setInstructorUpcoming] = useState<InstructorNextLessonData[]>([]);
  const [instructorActivities, setInstructorActivities] = useState<InstructorActivityItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolvedApproval, setHasResolvedApproval] = useState(false);

  const [autoschoolTab, setAutoschoolTab] = useState<AutoschoolTabId>("members");
  const firstName = clerkUser?.firstName || "";

  useEffect(() => {
    if (!isUserLoaded) {
      return;
    }

    if (!userId) {
      setIsApproved(false);
      setIsLoading(false);
      setHasResolvedApproval(true);
      return;
    }

    setHasResolvedApproval(false);

    let isMounted = true;

    // Read caches on client only (after mount) to avoid hydration mismatch
    cachedApproval.current = getCachedApproval(userId);
    cachedDashboard.current = getCachedDashboard(userId);

    // Apply cached approval immediately so instructor view shows without flash
    if (cachedApproval.current !== null) {
      setIsApproved(cachedApproval.current);
      setHasResolvedApproval(true);
    }

    const loadDashboard = async () => {
      // If we have a fresh cache, apply it immediately (stale-while-revalidate)
      if (cachedDashboard.current) {
        const data = cachedDashboard.current;
        const { nextLesson: nl, recentActivity: ra } = processDashboardData(data);
        if (isMounted) {
          setIsApproved(data.is_approved);
          setCachedApproval(userId, data.is_approved);
          setNextLesson(nl);
          setRecentActivity(ra);
          setStudentStats(data.stats);
          applyInstructorData(data);
          setIsLoading(false);
          setHasResolvedApproval(true);
        }
        // Still revalidate in background (stale-while-revalidate)
      }

      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setIsLoading(false);
            setHasResolvedApproval(true);
          }
          return;
        }

        // SINGLE request replaces the previous 4 separate requests
        const response = await fetchWithTimeout(
          `${API_CONFIG.BASE_URL}/api/dashboard/summary?cancellation_limit=10&comment_limit=10`,
          { headers: { Authorization: `Bearer ${token}` } },
          API_TIMEOUT_MS
        );

        if (!response.ok) {
          if (isMounted) {
            setIsLoading(false);
            setHasResolvedApproval(true);
          }
          return;
        }

        const data = (await response.json()) as DashboardSummary;
        const { nextLesson: nl, recentActivity: ra } = processDashboardData(data);

        if (isMounted) {
          setIsApproved(data.is_approved);
          setCachedApproval(userId, data.is_approved);
          setNextLesson(nl);
          setRecentActivity(ra);
          setStudentStats(data.stats);
          applyInstructorData(data);
          setIsLoading(false);
          setHasResolvedApproval(true);
        }

        // Cache for stale-while-revalidate on next navigation
        setCachedDashboard(userId, data);

      } catch {
        if (isMounted) {
          setIsLoading(false);
          setHasResolvedApproval(true);
          if (!cachedDashboard.current) {
            setNextLesson(null);
            setRecentActivity([]);
          }
        }
      }
    };

    /** Map API instructor data into component-friendly state */
    function applyInstructorData(data: DashboardSummary) {
      const iData = data.instructor_data;
      if (!iData) return;

      const slots: InstructorNextLessonData[] = iData.upcoming_slots.map((s) => ({
        id: s.id,
        startTimeUtc: s.start_time_utc,
        durationMinutes: s.duration_minutes,
        mode: s.mode,
        price: s.price,
        studentFirstName: s.student_first_name,
        studentLastName: s.student_last_name,
        studentImageUrl: s.student_image_url,
      }));

      setInstructorNextLesson(slots[0] ?? null);
      setInstructorUpcoming(slots.slice(1)); // all remaining after the hero card

      setInstructorActivities(
        iData.recent_activity.map((a) => ({
          id: a.id,
          type: a.type,
          occurredAt: a.occurred_at,
          studentName: a.student_name,
          price: a.price,
        }))
      );
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [getToken, userId, isUserLoaded]);

  if (!hasResolvedApproval || isAutoschoolRoleLoading) {
    return <div className="min-h-screen bg-[#f8fafc] pt-20" />;
  }

  if (isApproved || isAutoschoolAdmin) {
    // Dedicated autoschool-admin view when the user manages a school
    // but is not an approved instructor.
    if (!isApproved && isAutoschoolAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 pt-20 transition-colors duration-500">
          <MobileDashboardNav />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {t("dashboard.nav.overview")}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {language === "ka" ? "ავტოსკოლის ადმინ პანელი" : "Autoschool admin panel"}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-3">
                <AutoschoolSidebarNav
                  activeTab={autoschoolTab}
                  setActiveTab={setAutoschoolTab}
                  language={language}
                />
              </div>

              {/* Content */}
              <div className="lg:col-span-9 space-y-6">
                {autoschoolTab === "members" && (
                  <>
                    <InviteNotifications />
                    {mySchoolId && <ManageInstructors schoolId={mySchoolId} />}
                  </>
                )}
                {autoschoolTab === "finances" && mySchoolId && (
                  <AutoschoolFinances schoolId={mySchoolId} />
                )}
                {autoschoolTab === "packages" && mySchoolId && (
                  <AutoschoolPackages schoolId={mySchoolId} />
                )}
                {autoschoolTab === "pricing" && mySchoolId && (
                  <AutoschoolPricing schoolId={mySchoolId} />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pt-20 transition-colors duration-500">
        <MobileDashboardNav isInstructor />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <main className="flex-1 min-w-0 space-y-8">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
              {/* Left Column (Wider) */}
              <div className="xl:col-span-2 space-y-6 xl:space-y-8 flex flex-col">
                {/* Next Lesson Card - takes prominent width */}
                <InstructorNextLessonCard lesson={instructorNextLesson} isLoading={isLoading} />

                {/* Upcoming lessons list */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900 px-1">Upcoming Lessons</h3>
                  </div>
                  {isLoading ? (
                    <>{[1, 2, 3].map((i) => <InstructorUpcomingLessonSkeleton key={i} />)}</>
                  ) : instructorUpcoming.length > 0 ? (
                    instructorUpcoming.map((slot) => (
                      <InstructorUpcomingLessonCard key={slot.id} lesson={slot} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 px-1">No upcoming lessons scheduled</p>
                  )}
                </div>
              </div>

              {/* Right Column (Narrower) */}
              <div className="xl:col-span-1 min-h-[500px] space-y-6">
                {/* Autoschool Invites (self-hides if none) */}
                <InviteNotifications />

                {/* Activity Timeline */}
                <InstructorActivity activities={instructorActivities} isLoading={isLoading} />
              </div>
            </div>

            {/* Autoschool Admin: Manage Instructors */}
            {mySchoolId && (
              <div className="mt-6">
                <ManageInstructors schoolId={mySchoolId} />
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Default: Student Dashboard
  return (
    <div className="min-h-screen bg-[#f8fafc] pt-20">
      <MobileDashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <main className="flex-1 min-w-0 space-y-6">

          <InviteNotifications />

          <StudentStats
            totalCompleted={studentStats.total_completed}
            totalHours={studentStats.total_hours}
            upcomingCount={studentStats.upcoming_count}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NextLessonCard lesson={nextLesson} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-1">
              <DrivingTips />
            </div>
          </div>

          <RecentActivity activities={recentActivity} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
