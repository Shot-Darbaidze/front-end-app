"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingCalendarCardProps {
  currentMonth: Date;
  days: number;
  startDay: number;
  isDateAvailable: (day: number) => boolean;
  isDateSelected: (day: number) => boolean;
  onDateClick: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function BookingCalendarCard({
  currentMonth,
  days,
  startDay,
  isDateAvailable,
  isDateSelected,
  onDateClick,
  onPrevMonth,
  onNextMonth,
}: BookingCalendarCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {currentMonth.toLocaleDateString("ka-GE", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <button onClick={onPrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" type="button">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" type="button">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }).map((_, index) => {
          const day = index + 1;
          const available = isDateAvailable(day);
          const selected = isDateSelected(day);

          return (
            <button
              key={day}
              type="button"
              disabled={!available}
              onClick={() => onDateClick(day)}
              className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                selected
                  ? "bg-gray-900 text-white shadow-lg"
                  : available
                    ? "bg-red-50 text-red-600 hover:bg-red-100 font-bold"
                    : "text-gray-300 cursor-not-allowed"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs text-gray-500 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-50 border border-red-100" />
          <span>ხელმისაწვდომი</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-900" />
          <span>არჩეული დღე</span>
        </div>
      </div>
    </div>
  );
}
