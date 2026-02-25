"use client";

// InstructorDashboardNav is replaced by AccountSidebar (desktop) + MobileDashboardNav (mobile)
// Kept for backwards compatibility with sub-pages that import it
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

export const InstructorDashboardNav = () => <MobileDashboardNav isInstructor />;
