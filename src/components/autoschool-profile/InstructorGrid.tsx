"use client";

import { Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";

export interface SchoolInstructor {
  id: string;
  name: string;
  rating: number;
  transmission: string;
  price: number;
  imageUrl?: string;
}

interface InstructorGridProps {
  instructors: SchoolInstructor[];
}

const InstructorGrid = ({ instructors }: InstructorGridProps) => {
  const localeHref = useLocaleHref();

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        ინსტრუქტორები
        <span className="ml-2 text-sm font-semibold text-gray-400">({instructors.length})</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructors.map((instructor) => (
          <div
            key={instructor.id}
            className="flex flex-col gap-3 p-4 rounded-2xl border border-gray-100 hover:border-[#F03D3D]/30 hover:shadow-md transition-all duration-200 bg-gray-50/50"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                {instructor.imageUrl ? (
                  <img
                    src={instructor.imageUrl}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-500">
                    {instructor.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{instructor.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-700">{instructor.rating}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600">
                {instructor.transmission}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-900">
                ₾{instructor.price} / სთ
              </span>
            </div>

            {/* View Profile */}
            <Link
              href={localeHref(`/instructors/${instructor.id}`)}
              className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-[#F03D3D]/30 text-[#F03D3D] text-sm font-semibold hover:bg-[#F03D3D] hover:text-white transition-all duration-200"
            >
              პროფილის ნახვა
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructorGrid;
