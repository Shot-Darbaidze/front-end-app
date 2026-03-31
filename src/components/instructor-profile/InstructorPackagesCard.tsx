"use client";

import { useState } from "react";
import { ChevronRight, MapPin, SquareParking } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

interface CoursePackage {
  id: string;
  name: string;
  lessons: number;
  percentage?: number | null;
  popular?: boolean;
  description?: string | null;
  mode: string;
  transmission: string;
}

interface InstructorPrices {
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
  autoschoolId: string;
}

function computeTotal(pkg: CoursePackage, post: InstructorPrices): number | null {
  if (pkg.percentage == null) return null;
  const isAuto = (post.transmission || "").toLowerCase().includes("auto");
  let pricePerLesson: number | null | undefined;
  if (pkg.mode === "city") {
    pricePerLesson = isAuto
      ? (post.automatic_city_price ?? post.manual_city_price)
      : (post.manual_city_price ?? post.automatic_city_price);
  } else {
    pricePerLesson = isAuto
      ? (post.automatic_yard_price ?? post.manual_yard_price)
      : (post.manual_yard_price ?? post.automatic_yard_price);
  }
  if (!pricePerLesson) return null;
  return Math.round(pricePerLesson * pkg.lessons * (pkg.percentage / 100));
}

export default function InstructorPackagesCard({
  packages,
  instructorId,
  post,
  autoschoolId,
}: InstructorPackagesCardProps) {
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const isKa = language === "ka";

  const [selected, setSelected] = useState(
    packages.find((p) => p.popular)?.id ?? packages[0]?.id
  );

  const active = packages.find((p) => p.id === selected);
  const bookingHref = active
    ? localeHref(`/autoschools/${autoschoolId}/book?mode=package&package=${active.id}&instructor=${instructorId}`)
    : "#";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {isKa ? "ავტოსკოლის პაკეტები" : "School packages"}
      </p>
      <h3 className="text-base font-bold text-gray-900 mb-4">
        {isKa ? "კურსის პაკეტი" : "Course packages"}
      </h3>

      <div className="space-y-2 mb-5">
        {packages.map((pkg) => {
          const ModeIcon = pkg.mode === "yard" ? SquareParking : MapPin;
          const total = computeTotal(pkg, post);
          const isSelected = selected === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelected(pkg.id)}
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
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                      <ModeIcon className="w-2.5 h-2.5" />
                      {pkg.mode === "city" ? (isKa ? "ქალაქი" : "City") : (isKa ? "მოედანი" : "Yard")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2 text-right">
                {pkg.percentage != null && pkg.percentage > 0 && (
                  <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-lg block mb-1">
                    -{pkg.percentage}%
                  </span>
                )}
                {total != null && (
                  <span className="text-sm font-bold text-gray-900">₾{total}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Link
        href={bookingHref}
        className="w-full py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
      >
        {isKa ? "კურსზე ჩარიცხვა" : "Enroll in course"} <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
