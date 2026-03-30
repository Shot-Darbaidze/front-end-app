"use client";

import { AlertCircle, Calendar as CalendarIcon, Clock } from "lucide-react";

export type BookingSlot = {
  id: string;
  time: string;
  durationMinutes: number;
};

interface AvailableTimeSlotsCardProps {
  viewingDate: string | null;
  slots: BookingSlot[];
  selectedSlotIds: string[];
  bookingError: string | null;
  selectedOptionLabel: string;
  selectedOptionPrice?: number;
  discountActive?: boolean;
  onSelectSlot: (slotId: string) => void;
  onContinue: () => void;
  formatTimeRange: (startTime: string, durationMinutes: number) => string;
}

type SelectionEffectVariant =
  | "soft"
  | "ring"
  | "accent"
  | "dark"
  | "outline";

export default function AvailableTimeSlotsCard({
  viewingDate,
  slots,
  selectedSlotIds,
  bookingError,
  selectedOptionLabel,
  selectedOptionPrice,
  onSelectSlot,
  onContinue,
  formatTimeRange,
}: AvailableTimeSlotsCardProps) {
  const showPrice = selectedOptionPrice != null && selectedOptionPrice > 0;
  const effectVariant: SelectionEffectVariant = "soft";

  const getSelectedSlotClasses = (variant: SelectionEffectVariant) => {
    switch (variant) {
      case "ring":
        return "bg-white text-gray-900 border-[#F03D3D]/50 ring-2 ring-[#F03D3D]/30";
      case "accent":
        return "bg-red-50 text-gray-900 border-[#F03D3D]/20 shadow-sm";
      case "dark":
        return "bg-gray-900 text-white border-gray-900 shadow-md";
      case "outline":
        return "bg-white text-[#F03D3D] border-[#F03D3D]";
      case "soft":
      default:
        return "bg-[#FFEAEA] text-gray-900 border-[#F03D3D]/30 shadow-sm";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm min-h-[400px] flex flex-col">
      <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#F03D3D]" />
        ხელმისაწვდომი დროები
      </h2>

      {!viewingDate ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
          <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
          <p>აირჩიე თარიღი კალენდარში.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            ხელმისაწვდომი სლოტები <span className="font-bold text-gray-900">{viewingDate}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
            {slots.map((slot) => {
              const isSelected = selectedSlotIds.includes(slot.id);
              const selectedIndex = selectedSlotIds.indexOf(slot.id) + 1;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelectSlot(slot.id)}
                  className={`relative w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center border ${
                    isSelected
                      ? getSelectedSlotClasses(effectVariant)
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100"
                  }`}
                >
                  <span>{formatTimeRange(slot.time, slot.durationMinutes)}</span>
                  {isSelected && (
                    <span className="absolute right-4 text-[11px] font-semibold leading-none opacity-80">
                      {selectedIndex}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{bookingError}</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 text-sm">{selectedOptionLabel}</span>
              {showPrice && <span className="font-bold text-gray-900">₾{selectedOptionPrice}</span>}
            </div>

            <button
              type="button"
              onClick={onContinue}
              className="w-full py-3 px-4 rounded-xl bg-[#F03D3D] text-white font-semibold hover:bg-[#d62f2f] transition-colors"
            >
              დადასტურებაზე გადასვლა
            </button>
          </div>
        </>
      )}
    </div>
  );
}
