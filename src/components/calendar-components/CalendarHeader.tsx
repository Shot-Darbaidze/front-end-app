"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarHeaderProps {
  weekRange: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  weekRange,
  onPrevWeek,
  onNextWeek,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <button
        onClick={onPrevWeek}
        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>

      <h2 className="text-base font-semibold text-gray-900">{weekRange}</h2>

      <button
        onClick={onNextWeek}
        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>
    </div>
  );
};
