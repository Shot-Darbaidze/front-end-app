"use client";

import {
  formatPackageAdjustment,
  formatPackagePrice,
} from "@/utils/packages";

export type BookingOption = {
  id: string;
  name: string;
  lessons: number;
  percentage?: number;
  popular?: boolean;
  description: string;
  mode?: string;
  transmission?: string;
  baseLessonPrice?: number | null;
  discountedLessonPrice?: number | null;
  baseTotalPrice?: number | null;
  discountedTotalPrice?: number | null;
};

interface BookingPricingCardProps {
  selectedPackageId: string;
  packages: BookingOption[];
  onPackageSelect: (packageId: string | null) => void;
  language?: string;
}

export default function BookingPricingCard({
  selectedPackageId,
  packages,
  onPackageSelect,
  language = "ka",
}: BookingPricingCardProps) {
  const isKa = language === "ka";

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900">
          {isKa ? "პაკეტის გამოყენება (არასავალდებულო)" : "Apply a package (optional)"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {isKa
            ? "ჯერ აირჩიეთ დროები როგორც ჩვეულებრივი გაკვეთილები. სურვილის შემთხვევაში შემდეგ გამოიყენეთ პაკეტი ზუსტი გაკვეთილების რაოდენობაზე."
            : "Choose lesson times first as normal bookings, then optionally apply a package to the exact lesson count."}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          {isKa
            ? "პაკეტის არჩევა ავტომატურად დააყენებს მის ქალაქი/მოედნის რეჟიმს."
            : "Choosing a package automatically switches booking to that package's lesson mode."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onPackageSelect(null)}
        className={`w-full text-left rounded-2xl border px-4 py-3 transition-all mb-3 ${
          selectedPackageId === ""
            ? "border-[#F03D3D] bg-[#F03D3D]/5"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-gray-900">
              {isKa ? "პაკეტის გარეშე" : "No package"}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {isKa ? "ჩვეულებრივი ერთჯერადი ფასით" : "Use the regular lesson price"}
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {isKa ? "სათითაო" : "Single"}
          </span>
        </div>
      </button>

      <div className="space-y-2">
        {packages.map((item) => {
          const adjustmentLabel = formatPackageAdjustment(item.percentage);
          const hasPackagePricing = item.discountedTotalPrice != null;
          const showOriginalTotal =
            item.baseTotalPrice != null &&
            item.discountedTotalPrice != null &&
            item.baseTotalPrice > item.discountedTotalPrice;
          const showOriginalLesson =
            item.baseLessonPrice != null &&
            item.discountedLessonPrice != null &&
            item.baseLessonPrice > item.discountedLessonPrice;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPackageSelect(selectedPackageId === item.id ? null : item.id)}
              className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                selectedPackageId === item.id
                  ? "border-[#F03D3D] bg-[#F03D3D]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                    {item.popular && (
                      <span className="text-[10px] font-bold text-white bg-[#F03D3D] px-1.5 py-0.5 rounded-md">
                        {isKa ? "პოპულარული" : "Popular"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.lessons} {isKa ? "გაკვეთილი" : "lessons"}
                    {item.description ? ` · ${item.description}` : ""}
                  </p>
                  {hasPackagePricing && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      {showOriginalLesson && (
                        <span className="mr-1.5 line-through text-gray-400">
                          ₾{formatPackagePrice(item.baseLessonPrice)}
                        </span>
                      )}
                      <span className="font-semibold text-slate-700">
                        ₾{formatPackagePrice(item.discountedLessonPrice)}
                      </span>
                      {isKa ? " / გაკვეთილი" : " / lesson"}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {adjustmentLabel && (
                    <span className="inline-flex text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-lg">
                      {adjustmentLabel}
                    </span>
                  )}
                  {hasPackagePricing && (
                    <div className="mt-2 space-y-0.5">
                      {showOriginalTotal && (
                        <div className="text-[11px] text-gray-400 line-through">
                          ₾{formatPackagePrice(item.baseTotalPrice)}
                        </div>
                      )}
                      <div className="text-sm font-bold text-gray-900">
                        ₾{formatPackagePrice(item.discountedTotalPrice)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
