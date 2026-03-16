"use client";

import React from "react";
import Image from "next/image";

export type HotspotId =
  | "seat"
  | "mirrors"
  | "seatbelt"
  | "gear"
  | "clutch"
  | "ignition"
  | "handbrake"
  | "signal";

interface FabiaInteriorProps {
  activeHotspot: string | null;
  completedHotspots: string[];
  onHotspotClick: (id: HotspotId) => void;
  wrongHotspot: string | null;
}

type Hotspot = {
  id: HotspotId;
  x: number; // percentage from left
  y: number; // percentage from top
  label: string;
  icon: string;
};

const HOTSPOTS: Hotspot[] = [
  { id: "seat", x: 14, y: 88, label: "სავარძელი", icon: "💺" },
  { id: "mirrors", x: 46, y: 6, label: "სარკეები", icon: "🪞" },
  { id: "seatbelt", x: 3, y: 38, label: "ღვედი", icon: "🔒" },
  { id: "gear", x: 60, y: 88, label: "გადაცემა", icon: "⚙️" },
  { id: "clutch", x: 28, y: 92, label: "ქლაჩი", icon: "🦶" },
  { id: "ignition", x: 43, y: 52, label: "გასაღები", icon: "🔑" },
  { id: "handbrake", x: 72, y: 90, label: "მუხრუჭი", icon: "🅿️" },
  { id: "signal", x: 15, y: 48, label: "მაშუქი", icon: "↙️" },
];

export const FabiaInterior: React.FC<FabiaInteriorProps> = ({
  activeHotspot,
  completedHotspots,
  onHotspotClick,
  wrongHotspot,
}) => {
  const getButtonStyle = (id: string): string => {
    if (wrongHotspot === id) {
      return "bg-red-500/90 ring-2 ring-red-300 scale-110 shadow-lg shadow-red-500/40";
    }
    if (activeHotspot === id) {
      return "bg-[#F03D3D]/90 ring-2 ring-white/60 shadow-lg shadow-red-500/30 animate-pulse";
    }
    if (completedHotspots.includes(id)) {
      return "bg-green-500/90 ring-2 ring-green-300 shadow-lg shadow-green-500/30";
    }
    return "bg-white/20 ring-1 ring-white/40 hover:bg-white/30";
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl select-none">
      {/* Car interior photo */}
      <div className="relative w-full aspect-[16/10]">
        <Image
          src="/images/car-interior.jpg"
          alt="Skoda Rapid interior"
          fill
          sizes="(max-width: 768px) 100vw, 700px"
          className="object-cover"
          priority
        />

        {/* Dark overlay for better button visibility */}
        <div className="absolute inset-0 bg-black/25" />

        {/* Hotspot buttons */}
        {HOTSPOTS.map((spot) => {
          const isCompleted = completedHotspots.includes(spot.id);
          const isWrong = wrongHotspot === spot.id;
          const isActive = activeHotspot === spot.id;
          const showCompletedState = isCompleted && !isActive;

          return (
            <button
              key={spot.id}
              onClick={() => onHotspotClick(spot.id)}
              className={`
                absolute flex flex-col items-center justify-center
                -translate-x-1/2 -translate-y-1/2
                rounded-xl backdrop-blur-sm
                transition-all duration-300 cursor-pointer
                w-[60px] h-[52px] sm:w-[72px] sm:h-[58px]
                ${getButtonStyle(spot.id)}
              `}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
              }}
              aria-label={spot.label}
            >
              <span className="text-sm sm:text-base leading-none">
                {showCompletedState ? "✓" : spot.icon}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold mt-0.5 leading-tight text-center
                  ${showCompletedState ? "text-white" : isWrong ? "text-white" : isActive ? "text-white" : "text-white/90"}
                `}
              >
                {spot.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
