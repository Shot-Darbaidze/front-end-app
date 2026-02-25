"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProgressRingProps {
  percentage?: number;
}

export const ProgressRing = ({ percentage = 45 }: ProgressRingProps) => {
  const { t } = useLanguage();

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">{t("dashboard.progressRing.title")}</h3>
      <div className="flex justify-center">
        <div className="relative w-36 h-36">
          {/* Background glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F03D3D]/5 to-orange-500/5" />
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="8"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F03D3D" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            {/* Progress arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
            <span className="text-[11px] text-gray-400 font-medium">{t("dashboard.progressRing.toLicense")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
