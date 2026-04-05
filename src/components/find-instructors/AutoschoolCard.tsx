"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, Users, Package, Star } from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveMediaUrl } from "@/utils/media";

interface AutoschoolCardProps {
  id: string;
  name: string;
  city?: string | null;
  logo_url?: string | null;
  rating?: number | string | null;
  instructor_count: number;
  package_count: number;
  license_categories?: string[];
  languages?: string | null;
  manual_city_price?: number | string | null;
  manual_yard_price?: number | string | null;
  automatic_city_price?: number | string | null;
  automatic_yard_price?: number | string | null;
}

const AutoschoolCard = ({
  id,
  name,
  city,
  logo_url,
  rating,
  instructor_count,
  package_count,
  license_categories,
  languages,
  manual_city_price,
  manual_yard_price,
  automatic_city_price,
  automatic_yard_price,
}: AutoschoolCardProps) => {
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const isKa = language === "ka";
  const toNumber = (value?: number | string | null): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  };

  const autoCity = toNumber(automatic_city_price);
  const autoYard = toNumber(automatic_yard_price);
  const manualCity = toNumber(manual_city_price);
  const manualYard = toNumber(manual_yard_price);
  const displayRating = (() => {
    if (rating === null || rating === undefined) return '-';
    const parsed = typeof rating === 'number' ? rating : Number(rating);
    if (!Number.isFinite(parsed) || parsed <= 0) return '-';
    return parsed.toFixed(1);
  })();

  const formatPrice = (value: number | null) => {
    if (value === null) return "-";
    return `₾${value}`;
  };

  return (
    <article className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#F03D3D]/30 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden shadow-inner flex-shrink-0">
            {logo_url ? (
              <Image
                src={resolveMediaUrl(logo_url) || ""}
                alt={name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-7 h-7 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#F03D3D] transition-colors line-clamp-1">{name}</h3>
            <p className="text-sm text-gray-500 mb-1">{isKa ? "ავტოსკოლა" : "Driving School"}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{displayRating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats as tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {city && (
          <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {city}
          </span>
        )}
        <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {instructor_count} {isKa ? "ინსტრუქტორი" : "instructors"}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 flex items-center gap-1">
          <Package className="w-3 h-3" />
          {package_count} {isKa ? "პაკეტი" : "packages"}
        </span>
        {(license_categories ?? []).map((category) => (
          <span key={`${id}-${category}`} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
            {isKa ? `კატეგორია ${category}` : `Category ${category}`}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
        <div className="pl-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {isKa ? "თითო გაკვეთილის ფასი" : "Price per lesson"}
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="rounded-lg bg-white border border-gray-100 p-2.5">
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{isKa ? "ავტომატიკა" : "Automatic"}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{isKa ? "ქალაქი" : "City"}</span>
                <span className="font-bold text-gray-900">{formatPrice(autoCity)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">{isKa ? "მოედანი" : "Yard"}</span>
                <span className="font-bold text-gray-900">{formatPrice(autoYard)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-gray-100 p-2.5">
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{isKa ? "მექანიკა" : "Manual"}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{isKa ? "ქალაქი" : "City"}</span>
                <span className="font-bold text-gray-900">{formatPrice(manualCity)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">{isKa ? "მოედანი" : "Yard"}</span>
                <span className="font-bold text-gray-900">{formatPrice(manualYard)}</span>
              </div>
            </div>
          </div>
        </div>
        <Link
          href={localeHref(`/autoschools/${id}`)}
          className="block w-full after:content-[''] after:absolute after:inset-0 after:z-[1] after:rounded-2xl"
        >
          <button className="w-full whitespace-nowrap py-2.5 px-4 bg-white border-2 border-[#F03D3D] text-[#F03D3D] rounded-xl font-bold text-sm hover:bg-[#F03D3D] hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95">
            {isKa ? "პროფილის ნახვა" : "View Profile"}
          </button>
        </Link>
      </div>
    </article>
  );
};

export default AutoschoolCard;
