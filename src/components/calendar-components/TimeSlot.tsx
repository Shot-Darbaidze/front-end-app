"use client";

import React from "react";
import { Lock } from "lucide-react";

export interface TimeSlotProps {
  hour: string;
  date: Date;
  isPastSlot: boolean;
  isSelected: boolean;
  bgColor: string;
  borderClasses: string;
  hasEvent: boolean;
  viewMode: "schedule" | "rates";
  editingRateKey: string | null;
  availabilityKey: string;
  currentRate?: number;
  rateInputValue: string;
  onCellClick: () => void;
  onRateClick: (e: React.MouseEvent) => void;
  onRateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRateInputBlur: () => void;
  onRateInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  hour: _hour,
  date: _date,
  isPastSlot,
  isSelected,
  bgColor,
  borderClasses,
  hasEvent,
  viewMode,
  editingRateKey,
  availabilityKey,
  currentRate,
  rateInputValue,
  onCellClick,
  onRateClick,
  onRateInputChange,
  onRateInputBlur,
  onRateInputKeyDown,
  children,
}) => {
  return (
    <div
      className={`relative h-[40px] ${borderClasses} last:border-r-0 transition-all ${bgColor} ${
        isPastSlot
          ? "cursor-not-allowed opacity-50"
          : `cursor-pointer hover:border-2 ${
              viewMode === "rates" ? "hover:border-blue-600" : "hover:border-green-600"
            }`
      } ${isSelected ? "ring-2 ring-blue-500 ring-inset" : ""}`}
      onClick={onCellClick}
    >
      {/* Events */}
      {children}

      {/* Rate Input or Display */}
      {viewMode === "rates" && !hasEvent && !isPastSlot && (
        <div className="absolute inset-0 flex items-center justify-center">
          {editingRateKey === availabilityKey ? (
            <input
              type="number"
              value={rateInputValue}
              onChange={onRateInputChange}
              onBlur={onRateInputBlur}
              onKeyDown={onRateInputKeyDown}
              autoFocus
              className="w-full h-full text-center text-sm font-semibold bg-blue-100 bg-opacity-30 border-none outline-none focus:bg-blue-200 focus:bg-opacity-40"
              placeholder="$"
              onClick={(e) => e.stopPropagation()}
            />
          ) : currentRate ? (
            <div
              className="text-xs font-semibold text-black cursor-pointer hover:text-blue-600 transition-colors"
              onClick={onRateClick}
            >
              ${currentRate}
            </div>
          ) : null}
        </div>
      )}

      {/* Lock Icon for Past Slots */}
      {isPastSlot && !hasEvent && (
        <div className="absolute top-1 right-1">
          <Lock size={12} className="text-gray-400" />
        </div>
      )}
    </div>
  );
};
