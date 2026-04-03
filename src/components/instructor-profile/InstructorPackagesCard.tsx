"use client";

import { useState } from "react";
import { ChevronRight, MapPin, SquareParking } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatPackageAdjustment,
  formatPackagePrice,
  getPackagePriceBreakdown,
  normalizeInstructorTransmission,
} from "@/utils/packages";

export interface CoursePackage {
  id: string;
  name: string;
  lessons: number;
  percentage?: number | null;
  popular?: boolean;
  description?: string | null;
  mode: string;
  transmission: string;
}

export interface InstructorPrices {
  transmission?: string | null;
  automatic_city_price?: number | null;
  manual_city_price?: number | null;
  automatic_yard_price?: number | null;
  manual_yard_price?: number | null;
}

interface InstructorPackagesCardProps {
  packages: CoursePackage[];
  instructorId: string | number;
  post: InstructorPrices;
  autoschoolId?: string | null;
  selectedPackageId?: string | null;
  onSelectPackage?: (packageId: string | null) => void;
}

function getLessonPrice(pkg: CoursePackage, post: InstructorPrices): number | null {
  const transmission = normalizeInstructorTransmission(post.transmission);
  if (pkg.mode === "city") {
    return transmission === "automatic"
      ? (post.automatic_city_price ?? post.manual_city_price ?? null)
      : (post.manual_city_price ?? post.automatic_city_price ?? null);
  }

  return transmission === "automatic"
    ? (post.automatic_yard_price ?? post.manual_yard_price ?? null)
    : (post.manual_yard_price ?? post.automatic_yard_price ?? null);
}

export default function InstructorPackagesCard({
  packages,
  instructorId,
  post,
  autoschoolId,
  selectedPackageId,
  onSelectPackage,
}: InstructorPackagesCardProps) {
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const isKa = language === "ka";

  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedPackageId !== undefined ? selectedPackageId : internalSelected;
  const setSelected = onSelectPackage ?? setInternalSelected;
  const directMode = post.manual_city_price != null || post.automatic_city_price != null ? "city" : "yard";

  const active = packages.find((p) => p.id === selected);
  const bookingHref = active
    ? autoschoolId
      ? localeHref(`/autoschools/${autoschoolId}/book?package=${active.id}&mode=${active.mode}&instructor=${instructorId}`)
      : localeHref(`/instructors/${instructorId}/book?package=${active.id}&mode=${active.mode}`)
    : autoschoolId
      ? localeHref(`/autoschools/${autoschoolId}/book?instructor=${instructorId}`)
      : localeHref(`/instructors/${instructorId}/book?mode=${directMode}`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {autoschoolId
          ? (isKa ? "ავტოსკოლის პაკეტები" : "School packages")
          : (isKa ? "ინსტრუქტორის პაკეტები" : "Instructor packages")}
      </p>
      <h3 className="text-base font-bold text-gray-900 mb-4">
        {isKa ? "კურსის პაკეტი" : "Course packages"}
      </h3>

      <div className="space-y-2 mb-5">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={`w-full flex items-start justify-between rounded-xl px-4 py-3 border text-left transition-all ${
            selected == null
              ? "border-[#F03D3D] bg-[#F03D3D]/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                selected == null ? "border-[#F03D3D]" : "border-gray-300"
              }`}
            >
              {selected == null && <div className="w-2 h-2 rounded-full bg-[#F03D3D]" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">
                  {isKa ? "პაკეტის გარეშე" : "No package"}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {isKa ? "დაუბრუნდი ჩვეულებრივ სათითაო გაკვეთილებს" : "Switch back to regular direct lessons"}
              </span>
            </div>
          </div>

          <div className="shrink-0 ml-2 text-right">
            <span className="text-xs font-semibold text-gray-400">
              {isKa ? "სათითაო" : "Direct"}
            </span>
          </div>
        </button>

        {packages.map((pkg) => {
          const ModeIcon = pkg.mode === "yard" ? SquareParking : MapPin;
          const pricing = getPackagePriceBreakdown(getLessonPrice(pkg, post), pkg.lessons, pkg.percentage);
          const isSelected = selected === pkg.id;
          const adjustmentLabel = formatPackageAdjustment(pkg.percentage);
          const showOriginalTotal =
            pricing != null && pricing.baseTotalPrice > pricing.discountedTotalPrice;
          const showOriginalLesson =
            pricing != null && pricing.baseLessonPrice > pricing.discountedLessonPrice;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelected(isSelected ? null : pkg.id)}
              className={`w-full flex items-start justify-between rounded-xl px-4 py-3 border text-left transition-all ${
                isSelected
                  ? "border-[#F03D3D] bg-[#F03D3D]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? "border-[#F03D3D]" : "border-gray-300"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#F03D3D]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{pkg.name}</span>
                    {pkg.popular && (
                      <span className="text-xs font-bold text-white bg-[#F03D3D] px-1.5 py-0.5 rounded-md leading-none">
                        {isKa ? "პოპულარული" : "Popular"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {pkg.lessons} {isKa ? "გაკვეთილი" : "lessons"}
                    {pkg.description ? ` · ${pkg.description}` : ""}
                  </span>
                  {pricing && (
                    <span className="block text-[11px] text-gray-500 mt-1">
                      {showOriginalLesson && (
                        <span className="mr-1.5 line-through text-gray-400">
                          ₾{formatPackagePrice(pricing.baseLessonPrice)}
                        </span>
                      )}
                      <span className="font-semibold text-slate-700">
                        ₾{formatPackagePrice(pricing.discountedLessonPrice)}
                      </span>
                      {isKa ? " / გაკვეთილი" : " / lesson"}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                      <ModeIcon className="w-2.5 h-2.5" />
                      {pkg.mode === "city" ? (isKa ? "ქალაქი" : "City") : (isKa ? "მოედანი" : "Yard")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2 text-right">
                {adjustmentLabel && (
                  <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-lg block mb-1">
                    {adjustmentLabel}
                  </span>
                )}
                {pricing != null && (
                  <div className="space-y-0.5">
                    {showOriginalTotal && (
                      <span className="block text-[11px] text-gray-400 line-through">
                        ₾{formatPackagePrice(pricing.baseTotalPrice)}
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-900">
                      ₾{formatPackagePrice(pricing.discountedTotalPrice)}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {active ? (
        <Link
          href={bookingHref}
          className="w-full py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          {isKa ? "პაკეტით დაჯავშნა" : "Book with package"} <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <Link
          href={bookingHref}
          className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          {isKa ? "სათითაო გაკვეთილები" : "Direct lessons"} <ChevronRight className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
}
