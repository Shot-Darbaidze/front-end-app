"use client";

import { useState } from "react";
import { Check, ChevronRight, Shield } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookingSidebarProps {
  cityPrice: number | null;
  yardPrice: number | null;
  lessonDuration: number; // in minutes
  instructorId: number | string;
  autoschoolId?: string | null;
  defaultPackageId?: string | null;
}

const BookingSidebar = ({ cityPrice, yardPrice, lessonDuration, instructorId, autoschoolId, defaultPackageId }: BookingSidebarProps) => {
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const isKa = language === "ka";

  const isEmployee = Boolean(autoschoolId);

  const hasCityMode = cityPrice != null;
  const hasYardMode = yardPrice != null;
  const hasBothModes = hasCityMode && hasYardMode && !isEmployee;

  // Auto-select the only available mode; default to city when both exist
  const defaultMode: "city" | "yard" = hasCityMode ? "city" : "yard";
  const [selectedMode, setSelectedMode] = useState<"city" | "yard">(defaultMode);

  const canBook = hasCityMode || hasYardMode;
  const displayPrice = selectedMode === "city" ? cityPrice : yardPrice;

  const bookingHref = isEmployee
    ? localeHref(
        `/autoschools/${autoschoolId}/book?mode=package${defaultPackageId ? `&package=${defaultPackageId}` : ""}&instructor=${instructorId}`
      )
    : localeHref(`/instructors/${instructorId}/book?mode=${selectedMode}`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      {/* Price display */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-sm text-gray-500 font-medium">
            {isKa ? "ფასი გაკვეთილზე" : "Price per lesson"}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {displayPrice != null
                ? `₾${displayPrice}`
                : isKa ? "მიუწვდომელია" : "Not available"}
            </span>
            <span className="text-gray-500">/ {lessonDuration}{isKa ? "წთ" : "min"}</span>
          </div>
        </div>
        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
          {isKa ? "საუკეთესო ფასი" : "Best Value"}
        </div>
      </div>

      {/* Mode selector — only shown for independent instructors offering both modes */}
      {hasBothModes && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {isKa ? "გაკვეთილის ტიპი" : "Lesson type"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMode("city")}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedMode === "city"
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              🏙 {isKa ? "ქალაქი" : "City"}
              <span className="block text-xs font-normal mt-0.5 opacity-70">₾{cityPrice}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("yard")}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedMode === "yard"
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              🅿 {isKa ? "მოედანი" : "Yard"}
              <span className="block text-xs font-normal mt-0.5 opacity-70">₾{yardPrice}</span>
            </button>
          </div>
        </div>
      )}

      {/* Single-mode label when only one is available (independent instructors only) */}
      {!hasBothModes && canBook && !isEmployee && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
            {hasCityMode
              ? (isKa ? "🏙 ქალაქის გაკვეთილი" : "🏙 City lesson")
              : (isKa ? "🅿 მოედნის გაკვეთილი" : "🅿 Yard lesson")}
          </span>
        </div>
      )}

      {canBook ? (
        <Link
          href={bookingHref}
          className="w-full py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          {isEmployee
            ? (isKa ? "კურსზე ჩარიცხვა" : "Enroll in Course")
            : (isKa ? "დაჯავშნე პირველი გაკვეთილი" : "Book First Lesson")} <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <button
          disabled
          className="w-full py-4 bg-gray-200 text-gray-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 cursor-not-allowed"
        >
          {isKa ? "ჯავშანი მიუწვდომელია" : "Booking unavailable"} <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-4 mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-50 rounded-full text-blue-600 mt-0.5">
            <Shield className="w-3 h-3" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{isKa ? "უსაფრთხო გადახდა" : "Secure Payment"}</h4>
            <p className="text-xs text-gray-500">{isKa ? "თანხა დაცულად ინახება, სანამ გაკვეთილი დასრულდება." : "Your money is held until the lesson is complete."}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-1 bg-green-50 rounded-full text-green-600 mt-0.5">
            <Check className="w-3 h-3" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{isKa ? "უფასო გაუქმება" : "Free Cancellation"}</h4>
            <p className="text-xs text-gray-500">{isKa ? "გააუქმე ჯავშანი გაკვეთილამდე 24 საათით ადრე." : "Cancel up to 24 hours before your lesson."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSidebar;
