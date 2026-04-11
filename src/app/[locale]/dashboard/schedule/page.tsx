"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { ResponsiveCalendar, SlotData, SlotStatus, generateTimeSlots } from "@/components/dashboard/instructor/ResponsiveCalendar";
import Button from "@/components/ui/Button";
import { useInstructorApproval } from "@/hooks/useInstructorApproval";
import { Save, RotateCcw, Clock, Loader2, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { API_CONFIG } from '@/config/constants';
import {
  clearDashboardRouteNamespace,
  readDashboardRouteCache,
  writeDashboardRouteCache,
} from "@/lib/dashboardRouteCache";

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

// API response types
interface SlotResponse {
  id: string;
  post_id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: SlotStatus;
  mode: "city" | "yard" | null;
  user_id: string | null;
}

interface BookedSlotWithStudentResponse {
  id: string;
  start_time_utc: string;
  duration_minutes: number;
  mode: "city" | "yard" | null;
  student: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  } | null;
}

interface BatchCreateResponse {
  created: SlotResponse[];
  failed: { booking_time: string; error: string }[];
}

interface BookedSlotCancelState {
  slotId: string;
  slotKey: string;
  status: "booked" | "completed";
  startLabel: string;
  durationMinutes: number;
  mode: "city" | "yard" | null;
  studentName: string;
  studentImage?: string | null;
}

const CANCELLATION_CONFIRM_TOKENS = ["cancel", "გაუქმება"] as const;
const SCHEDULE_CACHE_NAMESPACE = "instructor-schedule";
const SCHEDULE_CACHE_TTL_MS = 60 * 1000;

export default function SchedulePage() {
  const { getToken } = useClerkAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] ?? "ka";
  const userId = user?.id ?? null;
  const confirmationPrimary = locale === "ka" ? "გაუქმება" : "cancel";
  const confirmationSecondary = locale === "ka" ? "cancel" : "გაუქმება";

  // Auth state
  const { isInstructor: isApproved, isLoading: isChecking } = useInstructorApproval();

  // Schedule state
  const [slots, setSlots] = useState<Record<string, SlotData>>({});
  const [pendingSlots, setPendingSlots] = useState<Set<string>>(new Set());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [currentWeekDays, setCurrentWeekDays] = useState<Date[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [slotToCancel, setSlotToCancel] = useState<BookedSlotCancelState | null>(null);
  const [showCancelStep, setShowCancelStep] = useState(false);
  const [cancelConfirmationText, setCancelConfirmationText] = useState("");
  const [isCancellingBookedSlot, setIsCancellingBookedSlot] = useState(false);

  // Get user's timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const persistScheduleCache = useCallback((nextSlots: Record<string, SlotData>) => {
    if (!userId) return;
    writeDashboardRouteCache(
      {
        namespace: SCHEDULE_CACHE_NAMESPACE,
        userId,
        variant: timeZone,
      },
      nextSlots
    );
  }, [userId, timeZone]);

  // Redirect if not approved
  useEffect(() => {
    if (!isChecking && !isApproved) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [isApproved, isChecking, locale, router]);

  // Fetch existing slots
  const fetchSlots = useCallback(async () => {
    const cached = userId
      ? readDashboardRouteCache<Record<string, SlotData>>({
          namespace: SCHEDULE_CACHE_NAMESPACE,
          userId,
          variant: timeZone,
          ttlMs: SCHEDULE_CACHE_TTL_MS,
        })
      : null;

    if (cached) {
      setSlots(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        if (!cached) {
          setError("Authentication required");
        }
        return;
      }

      const [slotsResponse, bookedWithStudentsResponse] = await Promise.all([
        fetch(
          `${API_CONFIG.BASE_URL}/api/bookings/slots/mine?time_zone=${encodeURIComponent(timeZone)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        ),
        fetch(
          `${API_CONFIG.BASE_URL}/api/bookings/slots/mine/with-students`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        ),
      ]);

      if (!slotsResponse.ok) {
        const errorData = await slotsResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch slots");
      }

      const data: SlotResponse[] = await slotsResponse.json();
      const bookedWithStudents: BookedSlotWithStudentResponse[] = bookedWithStudentsResponse.ok
        ? await bookedWithStudentsResponse.json()
        : [];
      const bookedById = new Map(bookedWithStudents.map((item) => [item.id, item]));

      // Convert API response to slot map
      const slotMap: Record<string, SlotData> = {};
      data.forEach((slot) => {
        // Convert UTC to local time for display
        const utcDate = new Date(slot.start_time_utc);
        const localDateStr = utcDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format
        const localHours = utcDate.getHours().toString().padStart(2, "0");
        const localMins = utcDate.getMinutes().toString().padStart(2, "0");
        const slotKey = `${localDateStr}_${localHours}:${localMins}`;

        slotMap[slotKey] = {
          id: slot.id,
          status: slot.status,
          duration_minutes: slot.duration_minutes,
          mode: slot.mode,
          student: bookedById.get(slot.id)?.student ?? undefined,
        };
      });

      setSlots(slotMap);
      persistScheduleCache(slotMap);
    } catch (err) {
      if (!cached) {
        setError(err instanceof Error ? err.message : "Failed to fetch slots");
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, persistScheduleCache, timeZone, userId]);

  // Fetch slots on mount
  useEffect(() => {
    if (isApproved && !isChecking) {
      fetchSlots();
    }
  }, [isApproved, isChecking, fetchSlots]);

  // Handle slot toggle (add/remove pending slots)
  const handleSlotToggle = useCallback((date: Date, timeString: string) => {
    const dateStr = date.toISOString().split("T")[0];
    const slotKey = `${dateStr}_${timeString}`;

    // Check if it's an existing slot from backend
    const existingSlot = slots[slotKey];
    if (existingSlot?.id) {
      // Existing slot - don't toggle, user should use delete button
      return;
    }

    setPendingSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotKey)) {
        newSet.delete(slotKey);
      } else {
        newSet.add(slotKey);
      }
      return newSet;
    });
  }, [slots]);

  // Handle slot deletion
  const handleSlotDelete = useCallback(async (slotId: string, slotKey: string) => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/bookings/slots/${slotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete slot");
      }

      // Remove from local state
      setSlots((prev) => {
        const newSlots = { ...prev };
        delete newSlots[slotKey];
        if (userId) {
          clearDashboardRouteNamespace(SCHEDULE_CACHE_NAMESPACE, userId);
        }
        persistScheduleCache(newSlots);
        return newSlots;
      });

      setSuccessMessage("Slot deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete slot");
    }
  }, [getToken, persistScheduleCache, userId]);

  // Combine existing slots with pending slots for display
  const combinedSlots = React.useMemo(() => {
    const result: Record<string, SlotData> = { ...slots };

    // Add pending slots
    pendingSlots.forEach((key) => {
      if (!result[key]) {
        result[key] = {
          status: "pending",
          duration_minutes: durationMinutes,
        };
      }
    });

    return result;
  }, [slots, pendingSlots, durationMinutes]);

  const handleBookedSlotCancelClick = useCallback((slotId: string, slotKey: string) => {
    const selectedSlot = slots[slotKey];
    if (!selectedSlot || (selectedSlot.status !== "booked" && selectedSlot.status !== "completed")) {
      return;
    }

    const [dateStr, timeStr] = slotKey.split("_");
    const localDate = new Date(`${dateStr}T${timeStr}:00`);
    const startLabel = localDate.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const studentName = selectedSlot.student
      ? `${selectedSlot.student.first_name || ""} ${selectedSlot.student.last_name || ""}`.trim() || "Student"
      : "Student";

    setSlotToCancel({
      slotId,
      slotKey,
      status: selectedSlot.status,
      startLabel,
      durationMinutes: selectedSlot.duration_minutes,
      mode: selectedSlot.mode ?? null,
      studentName,
      studentImage: selectedSlot.student?.image_url,
    });
    setShowCancelStep(false);
    setCancelConfirmationText("");
  }, [slots]);

  const handleConfirmBookedSlotCancel = useCallback(async () => {
    if (!slotToCancel) return;

    const normalized = cancelConfirmationText.trim().toLowerCase();
    if (!CANCELLATION_CONFIRM_TOKENS.includes(normalized as (typeof CANCELLATION_CONFIRM_TOKENS)[number])) {
      setError('Please type "cancel" or "გაუქმება" to confirm cancellation.');
      return;
    }

    setIsCancellingBookedSlot(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/bookings/${slotToCancel.slotId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            reason: "instructor_request",
            description: "Cancelled by instructor from schedule",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to cancel lesson");
      }

      setSlots((prev) => {
        const next = { ...prev };
        const current = next[slotToCancel.slotKey];
        if (current) {
          next[slotToCancel.slotKey] = {
            ...current,
            status: "cancelled",
            mode: null,
            student: undefined,
          };
        }
        if (userId) {
          clearDashboardRouteNamespace(SCHEDULE_CACHE_NAMESPACE, userId);
        }
        persistScheduleCache(next);
        return next;
      });

      setSuccessMessage("Booked lesson cancelled successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
      setSlotToCancel(null);
      setShowCancelStep(false);
      setCancelConfirmationText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel lesson");
    } finally {
      setIsCancellingBookedSlot(false);
    }
  }, [slotToCancel, cancelConfirmationText, getToken, persistScheduleCache, userId]);

  // Save pending slots to backend
  const handleSave = async () => {
    if (pendingSlots.size === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Convert pending slots to API format
      const slotsToCreate = Array.from(pendingSlots).map((key) => {
        const [dateStr, timeStr] = key.split("_");
        return {
          booking_time: `${dateStr}T${timeStr}:00`,
        };
      });

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/bookings/slots/batch`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            time_zone: timeZone,
            duration_minutes: durationMinutes,
            slots: slotsToCreate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create slots");
      }

      const data: BatchCreateResponse = await response.json();

      // Update local state with created slots
      const newSlots: Record<string, SlotData> = { ...slots };
      data.created.forEach((slot) => {
        const utcDate = new Date(slot.start_time_utc);
        const localDateStr = utcDate.toLocaleDateString("en-CA");
        const localHours = utcDate.getHours().toString().padStart(2, "0");
        const localMins = utcDate.getMinutes().toString().padStart(2, "0");
        const slotKey = `${localDateStr}_${localHours}:${localMins}`;

        newSlots[slotKey] = {
          id: slot.id,
          status: slot.status,
          duration_minutes: slot.duration_minutes,
          mode: slot.mode,
        };
      });

      setSlots(newSlots);
      if (userId) {
        clearDashboardRouteNamespace(SCHEDULE_CACHE_NAMESPACE, userId);
      }
      persistScheduleCache(newSlots);
      setPendingSlots(new Set());

      // Show success message
      const successMsg = data.failed.length > 0
        ? `Created ${data.created.length} slots. ${data.failed.length} failed (overlapping).`
        : `Created ${data.created.length} slots successfully!`;
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save slots");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset pending slots
  const handleReset = () => {
    if (pendingSlots.size === 0) return;

    if (confirm("Discard unsaved changes?")) {
      setPendingSlots(new Set());
    }
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    if (pendingSlots.size > 0) {
      if (!confirm("Changing duration will clear pending slots. Continue?")) {
        return;
      }
      setPendingSlots(new Set());
    }
    setDurationMinutes(newDuration);
  };

  // Handle week change from calendar
  const handleWeekChange = useCallback((weekStart: Date, weekDays: Date[]) => {
    setCurrentWeekStart(weekStart);
    setCurrentWeekDays(weekDays);
  }, []);

  // Copy slots from last week
  const handleCopyFromLastWeek = useCallback(() => {
    if (!currentWeekStart || currentWeekDays.length === 0) {
      setError("Calendar not ready. Please wait.");
      return;
    }

    setIsCopying(true);
    setError(null);

    try {
      // Calculate last week's date range
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // Get time slots for the current duration
      const timeSlots = generateTimeSlots(durationMinutes);

      // Find all slots from last week that are "available" status
      const lastWeekSlotKeys: string[] = [];
      for (let i = 0; i < 7; i++) {
        const lastWeekDay = new Date(lastWeekStart);
        lastWeekDay.setDate(lastWeekDay.getDate() + i);
        const lastWeekDateStr = lastWeekDay.toISOString().split("T")[0];

        timeSlots.forEach((timeString) => {
          const slotKey = `${lastWeekDateStr}_${timeString}`;
          const slotData = slots[slotKey];
          // Only copy "available" slots (not booked, cancelled, etc.)
          if (slotData?.status === "available") {
            lastWeekSlotKeys.push(slotKey);
          }
        });
      }

      if (lastWeekSlotKeys.length === 0) {
        setError("No available slots found in last week to copy.");
        setIsCopying(false);
        return;
      }

      // Map last week slots to this week
      const newPendingSlots = new Set<string>();
      lastWeekSlotKeys.forEach((lastWeekKey) => {
        const [dateStr, timeStr] = lastWeekKey.split("_");
        const lastWeekDate = new Date(dateStr);

        // Calculate day of week (0-6, where 0 is Monday in our system)
        const dayOfWeek = (lastWeekDate.getDay() + 6) % 7; // Convert to Mon=0, Sun=6

        // Get the corresponding day in current week
        const currentWeekDay = currentWeekDays[dayOfWeek];
        if (!currentWeekDay) return;

        const currentWeekDateStr = currentWeekDay.toISOString().split("T")[0];
        const newSlotKey = `${currentWeekDateStr}_${timeStr}`;

        // Only add if slot doesn't already exist and is not in the past
        const existingSlot = slots[newSlotKey];
        if (!existingSlot?.id) {
          // Check if slot is in the future
          const [hours, mins] = timeStr.split(":").map(Number);
          const slotDateTime = new Date(currentWeekDay);
          slotDateTime.setHours(hours, mins, 0, 0);

          if (slotDateTime > new Date()) {
            newPendingSlots.add(newSlotKey);
          }
        }
      });

      if (newPendingSlots.size === 0) {
        setError("All copied slots would overlap with existing slots or are in the past.");
        setIsCopying(false);
        return;
      }

      // Add to pending slots (merge with existing pending)
      setPendingSlots((prev) => {
        const merged = new Set(prev);
        newPendingSlots.forEach((key) => merged.add(key));
        return merged;
      });

      setSuccessMessage(`Copied ${newPendingSlots.size} slots from last week. Click Save to confirm.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy from last week");
    } finally {
      setIsCopying(false);
    }
  }, [currentWeekStart, currentWeekDays, slots, durationMinutes]);

  if (isChecking || !isApproved) {
    return null;
  }

  const hasChanges = pendingSlots.size > 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your weekly availability.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Duration Selector */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <select
                value={durationMinutes}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#F03D3D] focus:border-transparent"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Copy from Last Week Button */}
            <Button
              variant="outline"
              onClick={handleCopyFromLastWeek}
              disabled={isCopying || isSaving || isLoading}
              className="text-sm"
            >
              {isCopying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy Last Week
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="text-sm"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save {pendingSlots.size > 0 && `(${pendingSlots.size})`}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-emerald-500 hover:text-emerald-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Calendar Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-200"></div>
              <span>Empty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Completed</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#F03D3D] animate-spin" />
              <span className="ml-3 text-gray-500">Loading schedule...</span>
            </div>
          ) : (
            <ResponsiveCalendar
              slots={combinedSlots}
              onSlotToggle={handleSlotToggle}
              onSlotDelete={handleSlotDelete}
              onBookedSlotCancel={handleBookedSlotCancelClick}
              durationMinutes={durationMinutes}
              onWeekChange={handleWeekChange}
            />
          )}
        </div>
      </div>

      {slotToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">
              {slotToCancel.status === "completed" ? "Completed lesson details" : "Booked lesson details"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Slot: <span className="font-semibold text-gray-900">{slotToCancel.startLabel}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Duration: <span className="font-semibold text-gray-900">{slotToCancel.durationMinutes} min</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Mode: <span className="font-semibold text-gray-900">{slotToCancel.mode || "N/A"}</span>
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              {slotToCancel.studentImage ? (
                <img
                  src={slotToCancel.studentImage}
                  alt={slotToCancel.studentName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                  {slotToCancel.studentName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Booked by</p>
                <p className="text-sm font-semibold text-gray-900">{slotToCancel.studentName}</p>
              </div>
            </div>

            {slotToCancel.status === "booked" && showCancelStep && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-700">
                  To confirm cancellation, type <strong>{confirmationPrimary}</strong> or <strong>{confirmationSecondary}</strong>.
                </p>
                <input
                  value={cancelConfirmationText}
                  onChange={(e) => setCancelConfirmationText(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  placeholder={`Type "${confirmationPrimary}" or "${confirmationSecondary}"`}
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSlotToCancel(null);
                  setShowCancelStep(false);
                  setCancelConfirmationText("");
                }}
                disabled={isCancellingBookedSlot}
              >
                Close
              </Button>
              {slotToCancel.status === "booked" && !showCancelStep ? (
                <Button
                  className="flex-1"
                  onClick={() => setShowCancelStep(true)}
                >
                  Cancel Lesson
                </Button>
              ) : slotToCancel.status === "booked" ? (
                <Button
                  className="flex-1"
                  onClick={handleConfirmBookedSlotCancel}
                  disabled={isCancellingBookedSlot}
                >
                  {isCancellingBookedSlot ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </span>
                  ) : (
                    "Confirm Cancel"
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
