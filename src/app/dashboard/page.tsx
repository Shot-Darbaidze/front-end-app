"use client";

import React, { useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { API_CONFIG } from '@/config/constants';

// Student components
import { NextLessonCard } from "@/components/dashboard/student/NextLessonCard";
import { QuickActions } from "@/components/dashboard/student/QuickActions";
import { DashboardNav } from "@/components/dashboard/student/DashboardNav";
import { StudentStats } from "@/components/dashboard/student/StudentStats";

// Instructor components
import { InstructorDashboardNav } from "@/components/dashboard/instructor/InstructorDashboardNav";
import { InstructorStats } from "@/components/dashboard/instructor/InstructorStats";
import { InstructorNextLessonCard } from "@/components/dashboard/instructor/InstructorNextLessonCard";
import { InstructorQuickActions } from "@/components/dashboard/instructor/InstructorQuickActions";

export default function DashboardPage() {
  const { getToken } = useClerkAuth();
  const [isApproved, setIsApproved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkApproval = async () => {
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("instructor-approval");
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { is_approved?: boolean | null };
            if (parsed?.is_approved) {
              if (isMounted) {
                setIsApproved(true);
                setIsChecking(false);
              }
              return;
            }
          } catch (_error) {
            sessionStorage.removeItem("instructor-approval");
          }
        }
      }

      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setIsApproved(false);
            setIsChecking(false);
          }
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (isMounted) {
            setIsApproved(false);
            setIsChecking(false);
          }
          return;
        }

        const result: { is_approved?: boolean | null } = await response.json();
        if (typeof window !== "undefined" && result?.is_approved) {
          sessionStorage.setItem("instructor-approval", JSON.stringify(result));
        }
        if (isMounted) {
          setIsApproved(Boolean(result?.is_approved));
          setIsChecking(false);
        }
      } catch (_error) {
        if (isMounted) {
          setIsApproved(false);
          setIsChecking(false);
        }
      }
    };

    checkApproval();

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  if (isChecking) {
    return null;
  }

  if (isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
        <InstructorDashboardNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your schedule and students.</p>
          </div>

          {/* Stats Overview */}
          <section>
            <InstructorStats />
          </section>

          {/* Next Lesson - Hero Card */}
          <section>
            <InstructorNextLessonCard />
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            <InstructorQuickActions />
          </section>
        </div>
      </div>
    );
  }

  // Default: Student Dashboard
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      <DashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
          <p className="text-gray-500 mt-1">Here&apos;s your driving progress.</p>
        </div>

        {/* Stats Overview */}
        <section>
          <StudentStats />
        </section>

        {/* Next Lesson - Hero Card */}
        <section>
          <NextLessonCard />
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <QuickActions />
        </section>
      </div>
    </div>
  );
}
