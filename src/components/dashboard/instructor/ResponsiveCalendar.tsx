"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";

// Slot status types matching backend plus local UI-only pending state.
export type SlotStatus = "available" | "reserved" | "booked" | "cancelled" | "completed" | "pending";

export interface SlotData {
  id?: string;
  status: SlotStatus;
  duration_minutes: number;
  mode?: "city" | "yard" | null;
  student?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
}

interface ResponsiveCalendarProps {
  /** Map of slot keys to slot data. Key format: "YYYY-MM-DD_HH:MM" */
  slots?: Record<string, SlotData>;
  /** Called when user clicks to toggle a slot (add/remove pending) */
  onSlotToggle?: (date: Date, timeString: string) => void;
  /** Called when user wants to delete an existing slot */
  onSlotDelete?: (slotId: string, slotKey: string) => void;
  /** Duration in minutes for the time grid (30, 45, 60, 90, 120) */
  durationMinutes?: number;
  /** Whether the calendar is in read-only mode */
  readOnly?: boolean;
  /** Callback when the current week changes - provides week start date and week days */
  onWeekChange?: (weekStart: Date, weekDays: Date[]) => void;
  /** Called when instructor clicks a booked slot to cancel the lesson */
  onBookedSlotCancel?: (slotId: string, slotKey: string) => void;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM

// Helper function to get Monday of a given week - exported for use by parent
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Generate time slots based on duration - exported for use by parent
export const generateTimeSlots = (durationMinutes: number): string[] => {
  const slots: string[] = [];
  let currentMinutes = START_HOUR * 60;
  const endMinutes = END_HOUR * 60;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
    currentMinutes += durationMinutes;
  }

  return slots;
};

// Format time for display
const formatTimeRange = (timeString: string, durationMinutes: number): string => {
  const [hours, mins] = timeString.split(":").map(Number);
  const startMinutes = hours * 60 + mins;
  const endMinutes = startMinutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${timeString}-${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
};

// Get slot styling based on status
const getSlotStyles = (status: SlotStatus | undefined, isPast: boolean) => {
  // Keep booked/completed visually distinct and clickable even in the past
  // so instructors can open lesson details.
  if (isPast && status !== "booked" && status !== "completed") {
    return "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50";
  }

  switch (status) {
    case "available":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300";
    case "reserved":
      return "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed";
    case "booked":
      return "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300";
    case "cancelled":
      return "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:border-orange-300";
    case "completed":
      return "bg-purple-50 text-purple-700 border border-purple-200 cursor-not-allowed opacity-75";
    case "pending":
      return "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 animate-pulse";
    default:
      return "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600";
  }
};

// Get status label
const getStatusLabel = (status: SlotStatus | undefined): string => {
  switch (status) {
    case "available":
      return "✓ Free";
    case "reserved":
      return "Reserved";
    case "booked":
      return "Booked";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "pending":
      return "+ New";
    default:
      return "";
  }
};

export const ResponsiveCalendar: React.FC<ResponsiveCalendarProps> = ({
  slots = {},
  onSlotToggle,
  onSlotDelete,
  durationMinutes = 60,
  readOnly = false,
  onWeekChange,
  onBookedSlotCancel,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Generate time slots based on duration
  const timeSlots = useMemo(() => generateTimeSlots(durationMinutes), [durationMinutes]);

  // Memoize week calculations
  const { weekStart, weekDays } = useMemo(() => {
    const start = getWeekStart(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
    return { weekStart: start, weekDays: days };
  }, [currentDate]);

  // Notify parent when week changes
  useEffect(() => {
    onWeekChange?.(weekStart, weekDays);
  }, [weekStart, weekDays, onWeekChange]);

  // Memoize formatted date strings for header
  const weekRangeLabel = useMemo(() => {
    const startStr = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startStr} - ${endStr}`;
  }, [weekStart, weekDays]);

  const getSlotKey = useCallback((date: Date, timeString: string) => {
    const dateStr = date.toISOString().split("T")[0];
    return `${dateStr}_${timeString}`;
  }, []);

  const getSlotData = useCallback((date: Date, timeString: string): SlotData | undefined => {
    const key = getSlotKey(date, timeString);
    return slots[key];
  }, [slots, getSlotKey]);

  const isSlotPast = useCallback((date: Date, timeString: string): boolean => {
    const [hours, mins] = timeString.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, mins, 0, 0);
    return slotDate < new Date();
  }, []);

  const canDeleteSlot = useCallback((slotData: SlotData | undefined): boolean => {
    if (!slotData || !slotData.id) return false;
    return slotData.status === "available" || slotData.status === "cancelled";
  }, []);

  const handleSlotClick = useCallback((date: Date, timeString: string) => {
    if (readOnly) return;

    const slotData = getSlotData(date, timeString);
    const slotKey = getSlotKey(date, timeString);
    const isPast = isSlotPast(date, timeString);

    // Allow opening details for booked/completed slots regardless of whether
    // the time is in the past. Other past slots remain non-interactive.
    if (slotData?.status === "booked" && slotData.id) {
      onBookedSlotCancel?.(slotData.id, slotKey);
      return;
    }

    if (slotData?.status === "completed" && slotData.id) {
      onBookedSlotCancel?.(slotData.id, slotKey);
      return;
    }

    if (isPast) return;

    // Locked states should never be edited from schedule grid.
    if (slotData?.status === "booked" || slotData?.status === "completed" || slotData?.status === "reserved") {
      return;
    }

    onSlotToggle?.(date, timeString);
  }, [readOnly, isSlotPast, getSlotData, getSlotKey, onBookedSlotCancel, onSlotToggle]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, slotId: string, slotKey: string) => {
    e.stopPropagation();
    setDeleteConfirm(slotKey);
  }, []);

  const confirmDelete = useCallback((slotId: string, slotKey: string) => {
    onSlotDelete?.(slotId, slotKey);
    setDeleteConfirm(null);
  }, [onSlotDelete]);

  const goToPreviousWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-4 pb-4 border-b border-gray-200 relative">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-[#F03D3D] rounded transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-gray-900 min-w-[200px] text-center">
            {weekRangeLabel}
          </span>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-[#F03D3D] rounded transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="absolute right-0 px-4 py-2 text-sm font-semibold text-[#F03D3D] bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors duration-200"
        >
          Today
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-max pb-4">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-3">
            <div className="w-20"></div>
            {weekDays.map((day, idx) => (
              <div key={idx} className="w-28 text-center">
                <div className={`text-xs font-bold transition-colors mb-1 ${isToday(day) ? "text-[#F03D3D]" : "text-gray-600"
                  }`}>
                  {DAYS_OF_WEEK[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                </div>
                <div className={`text-sm font-semibold px-2 py-1 rounded-lg transition-colors ${isToday(day)
                  ? "text-white bg-[#F03D3D]"
                  : "text-gray-700 bg-gray-100"
                  }`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="space-y-1">
            {timeSlots.map((timeString) => (
              <div key={timeString} className="grid grid-cols-8 gap-1 items-center">
                <div className="w-20 text-right pr-2">
                  <span className="text-xs font-semibold text-gray-500">
                    {formatTimeRange(timeString, durationMinutes)}
                  </span>
                </div>
                {weekDays.map((day, idx) => {
                  const slotKey = getSlotKey(day, timeString);
                  const slotData = getSlotData(day, timeString);
                  const isPast = isSlotPast(day, timeString);
                  const canDelete = canDeleteSlot(slotData);
                  const showDeleteConfirm = deleteConfirm === slotKey;

                  return (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => handleSlotClick(day, timeString)}
                        disabled={readOnly}
                        className={`
                          w-28 h-10 rounded-lg font-semibold text-xs transition-all duration-200
                          ${!isPast && slotData?.status !== "completed" ? "hover:shadow-md" : ""}
                          ${getSlotStyles(slotData?.status, isPast)}
                        `}
                      >
                        {getStatusLabel(slotData?.status)}
                      </button>

                      {/* Delete button for existing deletable slots */}
                      {canDelete && !readOnly && !showDeleteConfirm && (
                        <button
                          onClick={(e) => handleDeleteClick(e, slotData!.id!, slotKey)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete confirmation popup */}
                      {showDeleteConfirm && (
                        <div className="absolute z-10 inset-0 bg-red-500 rounded-lg flex flex-col items-center justify-center gap-1 p-1">
                          <span className="text-xs text-white font-semibold">Delete?</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => confirmDelete(slotData!.id!, slotKey)}
                              className="px-2 py-0.5 bg-white text-red-500 text-xs rounded font-semibold hover:bg-gray-100"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-0.5 bg-red-600 text-white text-xs rounded font-semibold hover:bg-red-700"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tablet View - 3 days at a time */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <div className="space-y-4 pb-4">
          {Array.from({ length: Math.ceil(7 / 3) }, (_, daySetIdx) => {
            const daySet = weekDays.slice(daySetIdx * 3, (daySetIdx + 1) * 3);
            return (
              <div key={daySetIdx} className="min-w-max rounded-xl border border-gray-200 bg-white overflow-hidden">
                {/* Day headers */}
                <div className="grid gap-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200" style={{ gridTemplateColumns: "80px repeat(3, 1fr)" }}>
                  <div className="px-2 py-3 text-xs font-bold text-gray-600 border-r border-gray-200"></div>
                  {daySet.map((day, idx) => (
                    <div key={idx} className={`text-center px-2 py-3 ${idx !== daySet.length - 1 ? "border-r border-gray-200" : ""}`}>
                      <div className={`text-xs font-bold transition-colors mb-1 ${isToday(day) ? "text-[#F03D3D]" : "text-gray-600"
                        }`}>
                        {DAYS_OF_WEEK[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                      </div>
                      <div className={`text-sm font-semibold px-2 py-1 rounded-lg transition-colors ${isToday(day)
                        ? "text-white bg-[#F03D3D]"
                        : "text-gray-700 bg-gray-200"
                        }`}>
                        {day.getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                {timeSlots.map((timeString, timeIdx) => (
                  <div
                    key={timeString}
                    className={`grid gap-0 ${timeIdx !== timeSlots.length - 1 ? "border-b border-gray-200" : ""}`}
                    style={{ gridTemplateColumns: "80px repeat(3, 1fr)" }}
                  >
                    <div className="text-right px-2 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-r border-gray-200">
                      {timeString}
                    </div>
                    {daySet.map((day, idx) => {
                      const slotData = getSlotData(day, timeString);
                      const isPast = isSlotPast(day, timeString);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSlotClick(day, timeString)}
                          disabled={readOnly}
                          className={`
                            h-10 font-semibold text-xs transition-all duration-200 ${idx !== daySet.length - 1 ? "border-r border-gray-200" : ""}
                            ${getSlotStyles(slotData?.status, isPast)}
                          `}
                        >
                          {slotData?.status ? getStatusLabel(slotData.status).charAt(0) : "-"}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile View - 1 day at a time */}
      <div className="md:hidden space-y-4 pb-4">
        {weekDays.map((day, dayIdx) => (
          <div key={dayIdx} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className={`px-4 py-3 transition-colors ${isToday(day)
              ? "bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200"
              : "bg-gray-50 border-b border-gray-200"
              }`}>
              <div className={`text-sm font-bold transition-colors ${isToday(day) ? "text-[#F03D3D]" : "text-gray-900"
                }`}>
                {DAYS_OF_WEEK[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-0 divide-x divide-y divide-gray-200">
              {timeSlots.map((timeString) => {
                const slotData = getSlotData(day, timeString);
                const isPast = isSlotPast(day, timeString);

                return (
                  <button
                    key={timeString}
                    onClick={() => handleSlotClick(day, timeString)}
                    disabled={readOnly}
                    className={`
                      py-3 px-2 text-xs font-semibold transition-colors duration-200
                      ${getSlotStyles(slotData?.status, isPast)}
                    `}
                  >
                    <div>{timeString}</div>
                    {slotData?.status && <div className="text-[10px] mt-0.5">{getStatusLabel(slotData.status)}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
