"use client";

import React from "react";

export interface CalendarEventProps {
  id: string;
  type: "regular" | "walk-in" | "intensive" | "test-prep";
  title?: string;
  startTime: string;
  endTime: string;
  eventTypeConfig: Record<
    string,
    { color: string; label: string }
  >;
  onClick: (e: React.MouseEvent) => void;
}

const EventCardComponent: React.FC<CalendarEventProps> = ({
  id: _id,
  type,
  title,
  startTime,
  endTime,
  eventTypeConfig,
  onClick,
}) => {
  return (
    <div
      className={`text-xs px-2 py-1 rounded border-l-2 cursor-pointer hover:opacity-80 ${
        eventTypeConfig[type].color
      }`}
      onClick={onClick}
    >
      <div className="font-medium truncate">
        {title || eventTypeConfig[type].label}
      </div>
      <div className="text-[10px] opacity-75">
        {startTime} - {endTime}
      </div>
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
export const EventCard = React.memo(
  EventCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.type === nextProps.type &&
      prevProps.title === nextProps.title &&
      prevProps.startTime === nextProps.startTime &&
      prevProps.endTime === nextProps.endTime
    );
  }
);
