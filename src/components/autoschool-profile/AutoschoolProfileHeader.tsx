"use client";

import { Star, MapPin, Car, BadgeCheck, Building2, Users } from "lucide-react";

interface AutoschoolProfileHeaderProps {
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  description: string;
  languages: string[];
  fleet: string[];
  instructorCount: number;
  imageUrl?: string;
  coverImageUrl?: string;
}

const AutoschoolProfileHeader = ({
  name,
  rating,
  reviewCount,
  location,
  description,
  languages,
  fleet,
  instructorCount,
  imageUrl,
  coverImageUrl,
}: AutoschoolProfileHeaderProps) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
      {/* Cover Area */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-gray-900 to-gray-800 relative">
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt={`${name} cover`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-[#F03D3D]/10 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
        {/* School Logo & Main Info */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start -mt-16 mb-6 md:mb-8">
          {/* School Logo / Building Icon */}
          <div className="w-32 h-32 rounded-3xl border-4 border-white bg-gray-100 shadow-lg overflow-hidden flex items-center justify-center shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-14 h-14 text-gray-400" />
            )}
          </div>

          <div className="flex-1 pt-2 md:pt-0 md:mt-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {name}
                  <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 fill-blue-50 shrink-0" />
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    {instructorCount} ინსტრუქტორი
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900 leading-none">{rating}</span>
                    {reviewCount > 0 && (
                      <span className="text-xs text-gray-500">{reviewCount} შეფასება</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 md:hidden">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {location}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-6 md:mb-8" />

        {/* About + Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* About the School */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">სკოლის შესახებ</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>

            {/* Fleet */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">ავტოპარკი</h3>
              <div className="flex flex-wrap gap-3">
                {fleet.map((vehicle, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium"
                  >
                    <Car className="w-4 h-4 text-gray-400" />
                    {vehicle}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">სწავლების ენები</h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoschoolProfileHeader;
