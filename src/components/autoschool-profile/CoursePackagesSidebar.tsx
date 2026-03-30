"use client";

import { useState } from "react";
import { Check, ChevronRight, Shield, Users, MapPin, SquareParking } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export interface InstructorMini {
  id: string;
  name: string;
  imageUrl?: string | null;
  profileHref: string;
  transmission?: string | null;
  cityPrice?: number | null;
  yardPrice?: number | null;
}

export interface CoursePackage {
  id: string;
  name: string;
  lessons: number;
  percentage?: number;
  popular?: boolean;
  description: string;
  appliesToAll: boolean;
  assignedInstructors: InstructorMini[];
}

interface CoursePackagesSidebarProps {
  packages: CoursePackage[];
  allInstructors: InstructorMini[];
  bookingHref?: string;
}

// Small avatar stack — max 4 shown, rest as "+N"
function AvatarStack({ instructors }: { instructors: InstructorMini[] }) {
  const visible = instructors.slice(0, 4);
  const rest = instructors.length - visible.length;
  return (
    <div className="flex items-center -space-x-1.5 mt-1.5">
      {visible.map((inst) => (
        <Link
          key={inst.id}
          href={inst.profileHref}
          onClick={(e) => e.stopPropagation()}
          className="relative w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 shrink-0 hover:z-10 hover:scale-110 transition-transform"
          title={inst.name}
        >
          {inst.imageUrl ? (
            <Image src={inst.imageUrl} alt={inst.name} fill className="object-cover" sizes="24px" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-[8px] font-bold text-gray-500 uppercase">
              {inst.name.charAt(0)}
            </span>
          )}
        </Link>
      ))}
      {rest > 0 && (
        <span className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0">
          +{rest}
        </span>
      )}
    </div>
  );
}

// Transmission pill
function TransmissionPill({ transmission }: { transmission?: string | null }) {
  if (!transmission) return null;
  const isAuto = transmission.toLowerCase().includes("auto") || transmission === "automatic";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
      isAuto ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
    }`}>
      {isAuto ? "ავტო" : "მექ."}
    </span>
  );
}

const CoursePackagesSidebar = ({ packages, allInstructors = [], bookingHref = "#" }: CoursePackagesSidebarProps) => {
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
            mode === "package" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          კურსი
        </button>
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            mode === "single" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          სათითაო გაკვეთილები
        </button>
      </div>

      {mode === "package" ? (
        <>
          <div className="space-y-2 mb-5">
            {packages.map((pkg) => {
              const instructors = pkg.appliesToAll ? allInstructors : (pkg.assignedInstructors ?? []);
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelected(pkg.id)}
                  className={`w-full flex items-start justify-between rounded-xl px-4 py-3 border text-left transition-all ${
                    selected === pkg.id
                      ? "border-[#F03D3D] bg-[#F03D3D]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        selected === pkg.id ? "border-[#F03D3D]" : "border-gray-300"
                      }`}
                    >
                      {selected === pkg.id && <div className="w-2 h-2 rounded-full bg-[#F03D3D]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{pkg.name}</span>
                        {pkg.popular && (
                          <span className="text-xs font-bold text-white bg-[#F03D3D] px-1.5 py-0.5 rounded-md leading-none">
                            პოპულარული
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {pkg.lessons} გაკვეთილი · {pkg.description}
                      </span>

                      {/* Instructor scope */}
                      {pkg.appliesToAll ? (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-[11px] text-gray-400">ყველა ინსტრუქტორი</span>
                        </div>
                      ) : (
                        <AvatarStack instructors={instructors} />
                      )}
                    </div>
                  </div>
                  {pkg.percentage != null && pkg.percentage > 0 && (
                    <span className="shrink-0 ml-2 text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-lg">
                      -{pkg.percentage}%
                    </span>
                  )}
                </button>
              );
            })}
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
          {allInstructors.length > 0 ? (
            <div className="space-y-2.5 mb-5">
              {allInstructors.map((inst) => {
                const hasCity = inst.cityPrice != null && inst.cityPrice > 0;
                const hasYard = inst.yardPrice != null && inst.yardPrice > 0;
                return (
                  <Link
                    key={inst.id}
                    href={inst.profileHref}
                    className="flex items-center gap-3 rounded-2xl p-3 border border-gray-200 hover:border-[#F03D3D]/40 hover:shadow-md hover:shadow-red-500/5 bg-white transition-all group"
                  >
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {inst.imageUrl ? (
                        <Image src={inst.imageUrl} alt={inst.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-base font-bold text-gray-400 uppercase">
                          {inst.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm font-bold text-gray-900 truncate group-hover:text-[#F03D3D] transition-colors">
                          {inst.name}
                        </span>
                        <TransmissionPill transmission={inst.transmission} />
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCity && (
                          <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-0.5">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">₾{inst.cityPrice}</span>
                          </div>
                        )}
                        {hasYard && (
                          <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-0.5">
                            <SquareParking className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">₾{inst.yardPrice}</span>
                          </div>
                        )}
                        {!hasCity && !hasYard && (
                          <span className="text-xs text-gray-400">ფასი მოთხოვნით</span>
                        )}
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-[#F03D3D]/10 flex items-center justify-center shrink-0 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#F03D3D] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-5 text-center py-4">ინსტრუქტორები არ არის</p>
          )}

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
