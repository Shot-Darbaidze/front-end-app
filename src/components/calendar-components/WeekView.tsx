"use client";

import React from "react";

export interface WeekViewProps {
  weekDays: Date[];
  isToday: (date: Date) => boolean;
  dayNames: string[];
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  isToday,
  dayNames,
}) => {
  return (
    <>
      {/* Date Row */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-1 bg-gray-50 border-r border-gray-200"></div>
        {weekDays.map((date, index) => (
          <div
            key={index}
            className="p-1 text-center bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            <div
              className={`text-xs font-semibold ${
                isToday(date)
                  ? "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto"
                  : "text-gray-900"
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-2 bg-gray-50 border-r border-gray-200 text-xs font-medium text-gray-500 text-center">
          Time
        </div>
        {dayNames.map((day, _index) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
    </>
  );
};
