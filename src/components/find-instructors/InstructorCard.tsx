import { Star, ShieldCheck, Car, MapPin, Route } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, memo } from "react";
import { PRICING, CITY_LABELS } from "@/config/constants";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

interface InstructorCardProps {
  id: string;
  name: string;
  rating: number;
  specialty: string;
  price: number;
  cityPrice?: number | null;
  yardPrice?: number | null;
  showBothPrices?: boolean;
  tags: string[];
  imageUrl?: string;
  reviewCount?: number;
  position?: number;
  verified?: boolean;
  onCardClick?: (instructorId: string, position: number) => void;
}

const CityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-gray-500 shrink-0">
    <path
      fill="currentColor"
      d="M3 21V7l6-3v6h6V6l6-3v18H3Zm2-2h3v-4H5v4Zm0-6h3V9H5v4Zm5 6h4v-4h-4v4Zm0-6h4V9h-4v4Zm6 6h3v-4h-3v4Zm0-6h3V7h-3v6Z"
    />
  </svg>
);

const YardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-gray-500 shrink-0">
    <path fill="currentColor" d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/>
  </svg>
);

const transliterateToGeorgian = (value: string) => {
  const multiCharMap: Array<[string, string]> = [
    ["tch", "ჭ"],
    ["shch", "შჩ"],
    ["dzh", "ჯ"],
    ["dz", "ძ"],
    ["ts", "ც"],
    ["ch", "ჩ"],
    ["sh", "შ"],
    ["zh", "ჟ"],
    ["kh", "ხ"],
    ["gh", "ღ"],
    ["ph", "ფ"],
    ["th", "თ"],
  ];

  const singleCharMap: Record<string, string> = {
    a: "ა",
    b: "ბ",
    c: "ც",
    d: "დ",
    e: "ე",
    f: "ფ",
    g: "გ",
    h: "ჰ",
    i: "ი",
    j: "ჯ",
    k: "კ",
    l: "ლ",
    m: "მ",
    n: "ნ",
    o: "ო",
    p: "პ",
    q: "ქ",
    r: "რ",
    s: "ს",
    t: "ტ",
    u: "უ",
    v: "ვ",
    w: "წ",
    x: "ხ",
    y: "ი",
    z: "ზ",
  };

  let result = "";
  let remaining = value.toLowerCase();

  while (remaining.length > 0) {
    const matched = multiCharMap.find(([latin]) => remaining.startsWith(latin));
    if (matched) {
      result += matched[1];
      remaining = remaining.slice(matched[0].length);
      continue;
    }

    const char = remaining[0];
    result += singleCharMap[char] ?? char;
    remaining = remaining.slice(1);
  }

  return result;
};

const translateSpecialtyToGeorgian = (value: string) => {
  const phraseMap: Array<[RegExp, string]> = [
    [/driving instructor/gi, "მართვის ინსტრუქტორი"],
    [/driving school/gi, "ავტოსკოლა"],
    [/exam preparation/gi, "გამოცდისთვის მომზადება"],
    [/manual/gi, "მექანიკა"],
    [/automatic/gi, "ავტომატიკა"],
    [/city/gi, "ქალაქი"],
    [/yard/gi, "მოედანი"],
    [/beginner/gi, "დამწყები"],
    [/advanced/gi, "გამოცდილი"],
    [/nervous students/gi, "ნერვიული მოსწავლეები"],
    [/instructor/gi, "ინსტრუქტორი"],
    [/school/gi, "სკოლა"],
  ];

  let translated = value;

  for (const [pattern, replacement] of phraseMap) {
    translated = translated.replace(pattern, replacement);
  }

  if (/[A-Za-z]/.test(translated)) {
    translated = transliterateToGeorgian(translated);
  }

  return translated;
};

const InstructorCard = ({
  id,
  name,
  rating,
  specialty,
  price,
  cityPrice,
  yardPrice,
  showBothPrices = false,
  tags,
  imageUrl,
  reviewCount = 0,
  position = 0,
  verified = false,
  onCardClick,
}: InstructorCardProps) => {
  const { language } = useLanguage();
  const isKa = language === "ka";
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
  const hasYardPrice = yardPrice != null;
  const hasAnyModePrice = hasCityPrice || hasYardPrice;
  const displayName = isKa && /[A-Za-z]/.test(name) ? transliterateToGeorgian(name) : name;
  const displaySpecialty = isKa && /[A-Za-z]/.test(specialty)
    ? translateSpecialtyToGeorgian(specialty)
    : specialty;

  const translateTag = (tag: string) => {
    if (tag.startsWith("Mode:")) {
      const value = tag.replace("Mode:", "").trim();
      return isKa ? value.replace("City", "ქალაქი").replace("Yard", "მოედანი") : value;
    }

    if (tag.startsWith("Location:")) {
      const location = tag.replace("Location:", "").trim();
      return isKa ? CITY_LABELS[location]?.ka ?? location : location;
    }

    if (tag === "Manual") return isKa ? "მექანიკა" : tag;
    if (tag === "Automatic") return isKa ? "ავტომატიკა" : tag;

    return tag;
  };

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
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#F03D3D] transition-colors line-clamp-1">{displayName}</h3>
            <p className="text-sm text-gray-500 mb-1">{displaySpecialty}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{rating}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-gray-400">{isKa ? `(${reviewCount} შეფასება)` : `(${reviewCount} reviews)`}</span>
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
          const label = translateTag(tag);

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

      <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
        <div className="pl-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {isKa ? "თითო გაკვეთილის ფასი" : "Price per lesson"}
          </p>
          {hasAnyModePrice ? (
            <div className="space-y-2">
              {hasCityPrice && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <CityIcon />
                    <span className="whitespace-nowrap text-lg font-bold text-gray-900">{PRICING.CURRENCY_SYMBOL}{cityPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="block whitespace-nowrap text-xs font-medium text-gray-500">
                      {isKa ? "ქალაქი" : "City"}
                    </span>
                    <span className="block whitespace-nowrap text-[11px] text-gray-400">
                      {isKa ? "გაკვეთილი" : "lesson"}
                    </span>
                  </div>
                </div>
              )}
              {hasYardPrice && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <YardIcon />
                    <span className="whitespace-nowrap text-lg font-bold text-gray-900">{PRICING.CURRENCY_SYMBOL}{yardPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="block whitespace-nowrap text-xs font-medium text-gray-500">
                      {isKa ? "მოედანი" : "Yard"}
                    </span>
                    <span className="block whitespace-nowrap text-[11px] text-gray-400">
                      {isKa ? "გაკვეთილი" : "lesson"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <span className="whitespace-nowrap text-xl font-bold text-gray-900">{PRICING.CURRENCY_SYMBOL}{price}</span>
              <span className="block whitespace-nowrap text-xs font-medium text-gray-500">
                {isKa ? "გაკვეთილი" : "lesson"}
              </span>
            </div>
          )}
        </div>
        <Link
          href={profileHref}
          className="block w-full after:content-[''] after:absolute after:inset-0 after:z-[1] after:rounded-2xl"
          onClick={handleCardClick}
        >
          <button className="w-full whitespace-nowrap py-2.5 px-4 bg-white border-2 border-[#F03D3D] text-[#F03D3D] rounded-xl font-bold text-sm hover:bg-[#F03D3D] hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95">
            {isKa ? "პროფილის ნახვა" : "View Profile"}
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
  prev.yardPrice === next.yardPrice &&
  prev.imageUrl === next.imageUrl &&
  prev.reviewCount === next.reviewCount &&
  prev.position === next.position &&
  prev.verified === next.verified &&
  prev.tags.length === next.tags.length &&
  prev.tags.every((t, i) => t === next.tags[i])
);

export default memo(InstructorCard, arePropsEqual);
