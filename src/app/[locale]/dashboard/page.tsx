"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";
import { useLanguage } from "@/contexts/LanguageContext";


// Shared

import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

// Student components
import { NextLessonCard } from "@/components/dashboard/student/NextLessonCard";
import { StudentStats } from "@/components/dashboard/student/StudentStats";
import { RecentActivity } from "@/components/dashboard/student/RecentActivity";
import { DrivingTips } from "@/components/dashboard/student/DrivingTips";

import { InstructorNextLessonCard } from "@/components/dashboard/instructor/InstructorNextLessonCard";
import { InstructorUpcomingLessonCard } from "@/components/dashboard/instructor/InstructorUpcomingLessonCard";
import { InstructorActivity } from "@/components/dashboard/instructor/InstructorActivity";

const APPROVAL_CACHE_KEY = "instructor-approval-v2";
const APPROVAL_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const API_TIMEOUT_MS = 10_000; // 10 seconds

/** Read cached approval from localStorage with TTL check */
function getCachedApproval(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(APPROVAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { is_approved?: boolean; timestamp?: number };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > APPROVAL_CACHE_TTL) {
      localStorage.removeItem(APPROVAL_CACHE_KEY);
      return null;
    }
    return Boolean(parsed.is_approved);
  } catch {
    localStorage.removeItem(APPROVAL_CACHE_KEY);
    return null;
  }
}

/** Write approval to localStorage with timestamp */
function setCachedApproval(is_approved: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      APPROVAL_CACHE_KEY,
      JSON.stringify({ is_approved, timestamp: Date.now() })
    );
  } catch { /* storage full — ignore */ }
}

/** Fetch with a timeout (AbortController) */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export default function DashboardPage() {
  const { getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { t } = useLanguage();

  // Initialize from cache so we render immediately
  const cachedApproval = useRef(getCachedApproval());
  const [isApproved, setIsApproved] = useState(cachedApproval.current === true);

  const firstName = clerkUser?.firstName || "";

  useEffect(() => {
    let isMounted = true;

    const checkApproval = async () => {
      // If we already have a valid cache, skip the network call
      if (cachedApproval.current !== null) return;

      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) setIsApproved(false);
          return;
        }

        const response = await fetchWithTimeout(
          `${API_CONFIG.BASE_URL}/api/posts/mine`,
          { headers: { Authorization: `Bearer ${token}` } },
          API_TIMEOUT_MS
        );

        if (!response.ok) {
          if (isMounted) setIsApproved(false);
          return;
        }

        const result: { is_approved?: boolean | null } = await response.json();
        const approved = Boolean(result?.is_approved);
        setCachedApproval(approved);
        if (isMounted) setIsApproved(approved);
      } catch {
        // Timeout or network error — keep the default (student) view
        if (isMounted) setIsApproved(false);
      }
    };

    checkApproval();
    return () => { isMounted = false; };
  }, [getToken]);

  if (isApproved) {
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
                <InstructorNextLessonCard />

                {/* Upcoming lessons list */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900 px-1">Upcoming Lessons</h3>
                  </div>
                  <InstructorUpcomingLessonCard />
                  <InstructorUpcomingLessonCard />
                  <InstructorUpcomingLessonCard />
                </div>
              </div>

              {/* Right Column (Narrower) */}
              <div className="xl:col-span-1 min-h-[500px]">
                {/* New Premium Activity Component */}
                <InstructorActivity />
              </div>
            </div>
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

          <StudentStats />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NextLessonCard />
            </div>
            <div className="lg:col-span-1">
              <DrivingTips />
            </div>
          </div>

          <RecentActivity />
        </main>
      </div>
    </div>
  );
}
