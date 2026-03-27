"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, Users, Package, MapPin } from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveMediaUrl } from "@/utils/media";

interface AutoschoolCardProps {
  id: string;
  name: string;
  city?: string | null;
  logo_url?: string | null;
  instructor_count: number;
  package_count: number;
  languages?: string | null;
}

const AutoschoolCard = ({
  id,
  name,
  city,
  logo_url,
  instructor_count,
  package_count,
  languages,
}: AutoschoolCardProps) => {
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const isKa = language === "ka";

  return (
    <Link
      href={localeHref(`/autoschools/${id}`)}
      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-gray-100 hover:border-gray-200 transition-all duration-300 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {logo_url ? (
            <Image
              src={resolveMediaUrl(logo_url) || ""}
              alt={name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-7 h-7 text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[#F03D3D] transition-colors">
            {name}
          </h3>
          {city && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {city}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{instructor_count}</span>
          <span className="text-gray-400">{isKa ? "ინსტრუქტორი" : "instructors"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{package_count}</span>
          <span className="text-gray-400">{isKa ? "პაკეტი" : "packages"}</span>
        </div>
      </div>

      {/* Languages */}
      {languages && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {languages.split(",").map((lang) => (
            <span
              key={lang.trim()}
              className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-md"
            >
              {lang.trim()}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

export default AutoschoolCard;
