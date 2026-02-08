"use client";

import React, { useState } from "react";
import { CalendarHeader } from "@/components/calendar-components/CalendarHeader";
import { WeekView } from "@/components/calendar-components/WeekView";
import { TimeSlot } from "@/components/calendar-components/TimeSlot";
import { EventCard } from "@/components/calendar-components/EventCard";
import { TIME_SLOTS } from "@/components/calendar-components/timeSlotUtils";

interface CalendarEvent {
  id: string;
  type: "regular" | "walk-in" | "intensive" | "test-prep";
  count?: number;
  date: Date;
  startTime: string;
  endTime: string;
  title?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
  editable?: boolean;
  availability?: Record<string, boolean>;
  rates?: Record<string, number>;
  onRateChange?: (key: string, rate: number) => void;
  viewMode?: "schedule" | "rates";
  multiSelectMode?: boolean;
  selectedSlots?: string[];
  onSlotSelect?: (key: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDateClick,
  onEventClick,
  editable: _editable = true,
  availability = {},
  rates = {},
  onRateChange,
  viewMode = "schedule",
  multiSelectMode = false,
  selectedSlots = [],
  onSlotSelect,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const [editingRateKey, setEditingRateKey] = useState<string | null>(null);
  const [rateInputValue, setRateInputValue] = useState<string>("");

  const eventTypeConfig = {
    regular: {
      color: "bg-green-100 text-green-800 border-green-300",
      label: "Regular",
    },
    "walk-in": {
      color: "bg-orange-100 text-orange-800 border-orange-300",
      label: "Walk-in",
    },
    intensive: {
      color: "bg-purple-100 text-purple-800 border-purple-300",
      label: "Intensive",
    },
    "test-prep": {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      label: "Test Prep",
    },
  };

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const hours = TIME_SLOTS.generateHours();
  const weekDays = TIME_SLOTS.getWeekDays(currentWeekStart);

  const getEventsForDateAndHour = (date: Date, hour: string) => {
    return events.filter((event) => {
      if (event.date.toDateString() !== date.toDateString()) return false;

      const eventStartHour = parseInt(event.startTime.split(":")[0]);
      const eventEndHour = parseInt(event.endTime.split(":")[0]);
      const slotHour = parseInt(hour.split(":")[0]);

      return slotHour >= eventStartHour && slotHour < eventEndHour;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      const change = direction === "prev" ? -7 : 7;
      newDate.setDate(prev.getDate() + change);
      return newDate;
    });
  };

  const handleRateInputBlur = () => {
    if (editingRateKey && rateInputValue && !isNaN(parseFloat(rateInputValue))) {
      onRateChange?.(editingRateKey, parseFloat(rateInputValue));
    }
    setEditingRateKey(null);
    setRateInputValue("");
  };

  const handleRateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRateInputBlur();
    } else if (e.key === "Escape") {
      setEditingRateKey(null);
      setRateInputValue("");
    }
  };

  const formatWeekRange = TIME_SLOTS.formatWeekRange(weekDays);
  const isToday = TIME_SLOTS.isToday;

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      <CalendarHeader
        weekRange={formatWeekRange}
        onPrevWeek={() => navigateWeek("prev")}
        onNextWeek={() => navigateWeek("next")}
      />

      <div className="overflow-x-auto">
        <WeekView weekDays={weekDays} isToday={isToday} dayNames={dayNames} />

        <div className="grid grid-cols-8">
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="p-2 bg-gray-50 border-r border-b border-gray-200 text-xs text-gray-500 text-center font-medium h-[40px] flex items-center justify-center">
                {hour}
              </div>

              {weekDays.map((date, _dayIndex) => {
                const hourEvents = getEventsForDateAndHour(date, hour);
                const hourNum = parseInt(hour.split(":")[0]);

                const dateStr = date.toISOString().split("T")[0];
                const timeStr = `${hourNum.toString().padStart(2, "0")}:00`;
                const availabilityKey = `${dateStr}_${timeStr}`;
                const isAvailable = availability[availabilityKey];
                const hasEvent = hourEvents.length > 0;
                const isPastSlot = TIME_SLOTS.isPastSlot(date, hourNum);

                let bgColor = "bg-white";
                let borderClasses = "border-r border-b border-gray-100";

                if (hasEvent) {
                  bgColor = "bg-blue-50";
                } else if (isAvailable) {
                  bgColor = "bg-green-500";
                  borderClasses = "border-r border-b border-gray-100";
                } else if (isToday(date) && !hasEvent) {
                  bgColor = "bg-blue-50";
                } else if (isPastSlot) {
                  bgColor = "bg-gray-100";
                }

                const handleCellClick = () => {
                  if (isPastSlot) return;

                  if (viewMode === "rates" && !hasEvent) {
                    if (multiSelectMode) {
                      onSlotSelect?.(availabilityKey);
                    }
                  } else if (!hasEvent) {
                    onDateClick?.(date, hourNum);
                  }
                };

                const handleRateClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (isPastSlot) return;

                  setEditingRateKey(availabilityKey);
                  setRateInputValue(rates[availabilityKey]?.toString() || "");
                };

                const currentRate = rates[availabilityKey];
                const isSelected = selectedSlots.includes(availabilityKey);

                return (
                  <TimeSlot
                    key={`${date.toDateString()}-${hour}`}
                    hour={hour}
                    date={date}
                    isPastSlot={isPastSlot}
                    isSelected={isSelected}
                    bgColor={bgColor}
                    borderClasses={borderClasses}
                    hasEvent={hasEvent}
                    viewMode={viewMode}
                    editingRateKey={editingRateKey}
                    availabilityKey={availabilityKey}
                    currentRate={currentRate}
                    rateInputValue={rateInputValue}
                    onCellClick={handleCellClick}
                    onRateClick={handleRateClick}
                    onRateInputChange={(e) => setRateInputValue(e.target.value)}
                    onRateInputBlur={handleRateInputBlur}
                    onRateInputKeyDown={handleRateInputKeyDown}
                  >
                    {hasEvent && (
                      <div className="p-1 space-y-1">
                        {hourEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            id={event.id}
                            type={event.type}
                            title={event.title}
                            startTime={event.startTime}
                            endTime={event.endTime}
                            eventTypeConfig={eventTypeConfig}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </TimeSlot>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
