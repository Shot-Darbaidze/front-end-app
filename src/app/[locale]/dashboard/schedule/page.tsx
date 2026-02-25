"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { ResponsiveCalendar, SlotData, SlotStatus, generateTimeSlots } from "@/components/dashboard/instructor/ResponsiveCalendar";
import Button from "@/components/ui/Button";
import { Save, RotateCcw, Clock, Loader2, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_CONFIG } from '@/config/constants';

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

interface BatchCreateResponse {
  created: SlotResponse[];
  failed: { booking_time: string; error: string }[];
}

export default function SchedulePage() {
  const { getToken } = useClerkAuth();
  const router = useRouter();

  // Auth state
  const [isApproved, setIsApproved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  // Get user's timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Check instructor approval status
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

  // Redirect if not approved
  useEffect(() => {
    if (!isChecking && !isApproved) {
      router.replace("/dashboard");
    }
  }, [isApproved, isChecking, router]);

  // Fetch existing slots
  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/bookings/slots/mine?time_zone=${encodeURIComponent(timeZone)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch slots");
      }

      const data: SlotResponse[] = await response.json();

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
        };
      });

      setSlots(slotMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch slots");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, timeZone]);

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
        return newSlots;
      });

      setSuccessMessage("Slot deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete slot");
    }
  }, [getToken]);

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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
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
              <span>Pending</span>
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
              durationMinutes={durationMinutes}
              onWeekChange={handleWeekChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
