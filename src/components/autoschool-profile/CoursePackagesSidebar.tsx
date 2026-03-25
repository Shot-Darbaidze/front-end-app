"use client";

import { useState } from "react";
import { Check, ChevronRight, Shield } from "lucide-react";
import Link from "next/link";

export interface CoursePackage {
  id: string;
  name: string;
  lessons: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  description: string;
}

interface CoursePackagesSidebarProps {
  packages: CoursePackage[];
  bookingHref?: string;
}

const CoursePackagesSidebar = ({ packages, bookingHref = "#" }: CoursePackagesSidebarProps) => {
  const [mode, setMode] = useState<"package" | "single">("package");
  const [selected, setSelected] = useState(
    packages.find((p) => p.popular)?.id ?? packages[0]?.id
  );

  const active = packages.find((p) => p.id === selected);
  const packageBookingHref = `${bookingHref}?mode=package&package=${selected}`;
  const singleLessonBookingHref = `${bookingHref}?mode=single`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      <p className="text-sm text-gray-500 font-medium mb-4">კურსის პაკეტი</p>

      <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl bg-gray-100">
        <button
          type="button"
          onClick={() => setMode("package")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            mode === "package"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          კურსი
        </button>
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            mode === "single"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          სათითაო გაკვეთილები
        </button>
      </div>

      {mode === "package" ? (
        <>
          <div className="space-y-2 mb-5">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelected(pkg.id)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border text-left transition-all ${
                  selected === pkg.id
                    ? "border-[#F03D3D] bg-[#F03D3D]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected === pkg.id ? "border-[#F03D3D]" : "border-gray-300"
                    }`}
                  >
                    {selected === pkg.id && (
                      <div className="w-2 h-2 rounded-full bg-[#F03D3D]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{pkg.name}</span>
                      {pkg.popular && (
                        <span className="text-xs font-bold text-white bg-[#F03D3D] px-1.5 py-0.5 rounded-md leading-none">
                          პოპულარული
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{pkg.lessons} გაკვეთილი · {pkg.description}</span>
                  </div>
                </div>
                <div className="shrink-0 ml-2 text-right">
                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <div className="text-xs text-gray-400 line-through">₾{pkg.originalPrice}</div>
                  )}
                  <span className="text-base font-bold text-gray-900">₾{pkg.price}</span>
                </div>
              </button>
            ))}
          </div>

          <Link
            href={packageBookingHref}
            className="w-full py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            კურსზე ჩარიცხვა <ChevronRight className="w-5 h-5" />
          </Link>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              თეორიული მომზადება შედის
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              პირველადი გამოცდის მომზადება
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              {active ? `${active.lessons} სტანდარტული გაკვეთილი (60 წთ)` : "სრული კურსი"}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2 mb-5">
            <div className="w-full flex items-center justify-between rounded-xl px-4 py-3 border text-left transition-all border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm font-semibold text-gray-900">სათითაო გაკვეთილები</span>
                  <p className="text-xs text-gray-500 mt-1">
                    აირჩიე ეს ვარიანტი თუ სრული კურსის გარეშე მხოლოდ პრაქტიკული გაკვეთილები გინდა.
                  </p>
                  <span className="text-xs text-gray-500">1 სტანდარტული გაკვეთილი · 60 წთ</span>
                </div>
              </div>
              <span className="text-base font-bold text-gray-900 shrink-0 ml-2">₾50</span>
            </div>
          </div>

          <Link
            href={singleLessonBookingHref}
            className="w-full py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            გაკვეთილის დაჯავშნა <ChevronRight className="w-5 h-5" />
          </Link>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              ინდივიდუალური პრაქტიკული გაკვეთილი
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              მოქნილი დაჯავშნის შესაძლებლობა
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              1 სტანდარტული გაკვეთილი (60 წთ)
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoursePackagesSidebar;
