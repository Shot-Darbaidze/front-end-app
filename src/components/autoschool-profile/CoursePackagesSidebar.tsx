"use client";

import { useState } from "react";
import { Check, ChevronRight, Shield } from "lucide-react";

export interface CoursePackage {
  id: string;
  name: string;
  lessons: number;
  price: number;
  popular?: boolean;
  description: string;
}

interface CoursePackagesSidebarProps {
  packages: CoursePackage[];
}

const CoursePackagesSidebar = ({ packages }: CoursePackagesSidebarProps) => {
  const [selected, setSelected] = useState(
    packages.find((p) => p.popular)?.id ?? packages[0]?.id
  );

  const active = packages.find((p) => p.id === selected);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
      <p className="text-sm text-gray-500 font-medium mb-4">კურსის პაკეტი</p>

      <div className="space-y-2 mb-5">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
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
            <span className="text-base font-bold text-gray-900 shrink-0 ml-2">
              ₾{pkg.price}
            </span>
          </button>
        ))}
      </div>

      <button className="w-full py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2">
        კურსზე ჩარიცხვა <ChevronRight className="w-5 h-5" />
      </button>

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
    </div>
  );
};

export default CoursePackagesSidebar;
