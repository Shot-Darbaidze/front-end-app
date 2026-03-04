import { Star, ShieldCheck, Car, MapPin, Route } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, memo } from "react";
import { PRICING } from "@/config/constants";
import { useLocaleHref } from "@/hooks/useLocaleHref";

interface InstructorCardProps {
  id: string;
  name: string;
  rating: number;
  specialty: string;
  price: number;
  cityPrice?: number | null;
  showBothPrices?: boolean;
  tags: string[];
  imageUrl?: string;
  reviewCount?: number;
  position?: number;
  verified?: boolean;
  onCardClick?: (instructorId: string, position: number) => void;
}

const CityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="text-gray-900">
    <path
      fill="currentColor"
      d="M3 21V7l6-3v6h6V6l6-3v18H3Zm2-2h3v-4H5v4Zm0-6h3V9H5v4Zm5 6h4v-4h-4v4Zm0-6h4V9h-4v4Zm6 6h3v-4h-3v4Zm0-6h3V7h-3v6Z"
    />
  </svg>
);

const InstructorCard = ({
  id,
  name,
  rating,
  specialty,
  price,
  cityPrice,
  showBothPrices = false,
  tags,
  imageUrl,
  reviewCount = 0,
  position = 0,
  verified = false,
  onCardClick,
}: InstructorCardProps) => {
  const localeHref = useLocaleHref();
  const profileHref = localeHref(`/instructors/${id}`);

  const handleCardClick = useCallback(() => {
    if (typeof window !== "undefined") {
      const returnUrl = `${window.location.pathname}${window.location.search}#y=${Math.round(window.scrollY)}`;
      window.sessionStorage.setItem("lastFindInstructorsReturnUrl", returnUrl);
    }

    if (onCardClick) {
      onCardClick(id, position);
    }
  }, [onCardClick, id, position]);

  const hasCityPrice = cityPrice != null;

  return (
    <article className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#F03D3D]/30 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group flex flex-col h-full relative cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl ${imageUrl ? '' : 'bg-gradient-to-br from-gray-100 to-gray-200'} overflow-hidden shadow-inner`}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            {verified ? (
              <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                <ShieldCheck className="w-4 h-4 text-green-500 fill-green-100" />
              </div>
            ) : (
              <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                <ShieldCheck className="w-4 h-4 text-green-500 fill-green-100" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#F03D3D] transition-colors line-clamp-1">{name}</h3>
            <p className="text-sm text-gray-500 mb-1">{specialty}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{rating}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-gray-400">({reviewCount} reviews)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag, index) => {
          const isMode = tag.startsWith('Mode:');
          const isLocation = tag.startsWith('Location:');
          const isTransmission = tag.includes('Manual') || tag.includes('Automatic');
          const label = isMode
            ? tag.replace('Mode:', '').trim()
            : isLocation
              ? tag.replace('Location:', '').trim()
              : tag;

          return (
            <span key={index} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 flex items-center gap-1">
              {isMode ? <Route className="w-3 h-3" /> : null}
              {isLocation ? <MapPin className="w-3 h-3" /> : null}
              {isTransmission ? <Car className="w-3 h-3" /> : null}
              {label}
            </span>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex flex-col pl-1">
          {hasCityPrice ? (
            <div className="flex items-center gap-1">
              <CityIcon />
              <span className="text-lg font-semibold text-gray-900">{PRICING.CURRENCY_SYMBOL}{cityPrice}/hour</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-gray-900">{PRICING.CURRENCY_SYMBOL}{price}/hour</span>
            </div>
          )}
        </div>
        <Link
          href={profileHref}
          className="w-[40%] after:content-[''] after:absolute after:inset-0 after:z-[1] after:rounded-2xl"
          onClick={handleCardClick}
        >
          <button className="w-full py-2.5 px-4 bg-white border-2 border-[#F03D3D] text-[#F03D3D] rounded-xl font-bold text-sm hover:bg-[#F03D3D] hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95">
            View Profile
          </button>
        </Link>
      </div>
    </article>
  );
};

const arePropsEqual = (prev: InstructorCardProps, next: InstructorCardProps): boolean => (
  prev.id === next.id &&
  prev.name === next.name &&
  prev.rating === next.rating &&
  prev.specialty === next.specialty &&
  prev.price === next.price &&
  prev.cityPrice === next.cityPrice &&
  prev.imageUrl === next.imageUrl &&
  prev.reviewCount === next.reviewCount &&
  prev.position === next.position &&
  prev.verified === next.verified &&
  prev.tags.length === next.tags.length &&
  prev.tags.every((t, i) => t === next.tags[i])
);

export default memo(InstructorCard, arePropsEqual);
