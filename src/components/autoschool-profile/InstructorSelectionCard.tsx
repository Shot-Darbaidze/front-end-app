"use client";

import { MapPin, SquareParking } from "lucide-react";

export type InstructorOption = {
  id: string;
  name: string;
  transmission: string;
  imageUrl?: string;
  cityPrice?: number | null;
  yardPrice?: number | null;
};

interface InstructorSelectionCardProps {
  instructors: InstructorOption[];
  selectedInstructorId: string;
  lessonMode: "city" | "yard";
  onSelect: (instructorId: string) => void;
}

export default function InstructorSelectionCard({
  instructors,
  selectedInstructorId,
  lessonMode,
  onSelect,
}: InstructorSelectionCardProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">ინსტრუქტორის არჩევა</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {instructors.map((instructor) => {
          const isActive = selectedInstructorId === instructor.id;
          const price = lessonMode === "city" ? instructor.cityPrice : instructor.yardPrice;

          return (
            <button
              key={instructor.id}
              type="button"
              onClick={() => onSelect(instructor.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {instructor.imageUrl ? (
                      <img
                        src={instructor.imageUrl}
                        alt={instructor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                        {instructor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{instructor.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{instructor.transmission}</p>
                    {price != null && (
                      <p className="text-xs font-semibold text-[#F03D3D] mt-1 flex items-center gap-1">
                        {lessonMode === "city"
                          ? <MapPin className="w-3 h-3" />
                          : <SquareParking className="w-3 h-3" />}
                        ₾{price} / გაკვ.
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    isActive ? "border-[#F03D3D]" : "border-gray-300"
                  }`}
                >
                  {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#F03D3D]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
