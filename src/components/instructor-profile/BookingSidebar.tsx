"use client";

import { useState } from "react";
import { Check, ChevronRight, Shield } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatPackageAdjustment,
  formatPackagePrice,
} from "@/utils/packages";

export type BookingSidebarLessonMode = "city" | "yard";

export interface BookingSidebarSelectedPackage {
  id: string;
  name: string;
  percentage?: number | null;
  mode?: string | null;
}

interface BookingSidebarProps {
  cityPrice: number | null;
  yardPrice: number | null;
  instructorId: number | string;
  autoschoolId?: string | null;
  /** Instructor's allowed_modes from the DB: null/undefined = no restriction */
  allowedModes?: "city" | "yard" | "both" | null;
  selectedMode?: BookingSidebarLessonMode;
  onModeChange?: (mode: BookingSidebarLessonMode) => void;
  selectedPackage?: BookingSidebarSelectedPackage | null;
  originalPricePerLesson?: number | null;
  discountedPricePerLesson?: number | null;
  onClearPackage?: () => void;
}

const BookingSidebar = ({
  cityPrice,
  yardPrice,
  instructorId,
  autoschoolId,
  allowedModes,
  selectedMode,
  onModeChange,
  selectedPackage,
  originalPricePerLesson,
  discountedPricePerLesson,
  onClearPackage,
}: BookingSidebarProps) => {
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const isKa = language === "ka";

  const isEmployee = Boolean(autoschoolId);

  // Determine which modes the instructor actually permits.
  // allowed_modes: null/undefined = NOT bookable, 'both' = city + yard, 'city'/'yard' = single mode.
  const cityAllowed = allowedModes === "both" || allowedModes === "city";
  const yardAllowed = allowedModes === "both" || allowedModes === "yard";

  const hasCityMode = cityPrice != null && cityAllowed;
  const hasYardMode = yardPrice != null && yardAllowed;
  const hasBothModes = hasCityMode && hasYardMode && !isEmployee;

  // Auto-select the only available mode; default to city when both exist
  const defaultMode: BookingSidebarLessonMode = hasCityMode ? "city" : "yard";
  const [internalSelectedMode, setInternalSelectedMode] = useState<BookingSidebarLessonMode>(defaultMode);

  const canBook = hasCityMode || hasYardMode;
  const resolvedSelectedMode = selectedMode ?? internalSelectedMode;
  const setResolvedMode = onModeChange ?? setInternalSelectedMode;
  const displayPrice = resolvedSelectedMode === "city" ? cityPrice : yardPrice;
  const activeOriginalPrice = selectedPackage ? (originalPricePerLesson ?? displayPrice) : displayPrice;
  const activeDisplayPrice = selectedPackage ? (discountedPricePerLesson ?? displayPrice) : displayPrice;
  const packageAdjustmentLabel = formatPackageAdjustment(selectedPackage?.percentage);
  const showDiscountedPrice =
    selectedPackage != null &&
    activeOriginalPrice != null &&
    activeDisplayPrice != null &&
    activeOriginalPrice > activeDisplayPrice;
  const modeLockedByPackage = Boolean(selectedPackage);

  const params = new URLSearchParams();
  params.set("mode", resolvedSelectedMode);
  if (selectedPackage?.id) {
    params.set("package", selectedPackage.id);
  }
  if (isEmployee) {
    params.set("instructor", String(instructorId));
  }

  const bookingHref = isEmployee
    ? localeHref(`/autoschools/${autoschoolId}/book?${params.toString()}`)
    : localeHref(`/instructors/${instructorId}/book?${params.toString()}`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      {/* Price display */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-sm text-gray-500 font-medium">
            {selectedPackage
              ? (isKa ? "თითო გაკვეთილის ფასი პაკეტით" : "Package price per lesson")
              : (isKa ? "თითო გაკვეთილის ფასი" : "Price per lesson")}
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            {showDiscountedPrice && activeOriginalPrice != null && (
              <span className="text-base font-semibold text-gray-400 line-through">
                ₾{formatPackagePrice(activeOriginalPrice)}
              </span>
            )}
            <span className={`text-3xl font-bold ${showDiscountedPrice ? "text-[#F03D3D]" : "text-gray-900"}`}>
              {activeDisplayPrice != null
                ? `₾${formatPackagePrice(activeDisplayPrice)}`
                : isKa ? "მიუწვდომელია" : "Not available"}
            </span>
            <span className="text-gray-500">/ {isKa ? "გაკვეთილი" : "lesson"}</span>
          </div>
          {selectedPackage && (
            <p className="mt-1 text-xs font-medium text-emerald-600">
              {selectedPackage.name}
              {packageAdjustmentLabel ? ` · ${packageAdjustmentLabel}` : ""}
            </p>
          )}
        </div>
        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
          {isKa ? "საუკეთესო ფასი" : "Best Value"}
        </div>
      </div>

      {selectedPackage && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-700">
          <div className="flex items-start justify-between gap-3">
            <span>
              {isKa
                ? `არჩეული პაკეტი ავტომატურად იყენებს ${resolvedSelectedMode === "city" ? "ქალაქის" : "მოედნის"} რეჟიმს.`
                : `The selected package automatically uses ${resolvedSelectedMode === "city" ? "city" : "yard"} mode.`}
            </span>
            {onClearPackage && (
              <button
                type="button"
                onClick={onClearPackage}
                className="shrink-0 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                {isKa ? "გამორთვა" : "Disable"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode selector — only shown for independent instructors offering both modes */}
      {hasBothModes && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {isKa ? "გაკვეთილის ტიპი" : "Lesson type"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setResolvedMode("city")}
              disabled={modeLockedByPackage}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                resolvedSelectedMode === "city"
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                  : modeLockedByPackage
                    ? "border-gray-200 text-gray-400"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              🏙 {isKa ? "ქალაქი" : "City"}
              <span className="block text-xs font-normal mt-0.5 opacity-70">₾{formatPackagePrice(cityPrice)}</span>
            </button>
            <button
              type="button"
              onClick={() => setResolvedMode("yard")}
              disabled={modeLockedByPackage}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                resolvedSelectedMode === "yard"
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                  : modeLockedByPackage
                    ? "border-gray-200 text-gray-400"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              🅿 {isKa ? "მოედანი" : "Yard"}
              <span className="block text-xs font-normal mt-0.5 opacity-70">₾{formatPackagePrice(yardPrice)}</span>
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
          {selectedPackage
            ? (isKa ? "პაკეტით დაჯავშნე" : "Book with Package")
            : (isKa ? "დაჯავშნე გაკვეთილი" : "Book Lesson")}
          <ChevronRight className="w-5 h-5" />
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
