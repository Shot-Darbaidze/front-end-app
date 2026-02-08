"use client";

import React from "react";
import { Calendar, Clock, User } from "lucide-react";

export interface LessonCardProps {
  studentName: string;
  lessonType: string;
  status: "Confirmed" | "Pending";
  date: string;
  time: string;
  gradientFrom: string;
  gradientTo: string;
}

const LessonCardComponent: React.FC<LessonCardProps> = ({
  studentName,
  lessonType,
  status,
  date,
  time,
  gradientFrom,
  gradientTo,
}) => {
  const statusColor = status === "Confirmed"
    ? "bg-green-50 text-green-700"
    : "bg-yellow-50 text-yellow-700";

  return (
    <div className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center`}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">{studentName}</h3>
            <p className="text-xs text-gray-500">{lessonType}</p>
          </div>
        </div>
        <span className={`text-xs font-medium ${statusColor} px-2 py-1 rounded-full`}>
          {status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
export const LessonCard = React.memo(
  LessonCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.studentName === nextProps.studentName &&
      prevProps.lessonType === nextProps.lessonType &&
      prevProps.status === nextProps.status &&
      prevProps.date === nextProps.date &&
      prevProps.time === nextProps.time
    );
  }
);
