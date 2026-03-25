"use client";

import { useState, useEffect } from "react";
import { Star, MapPin, Clock, Car, BadgeCheck, Expand } from "lucide-react";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { useLanguage } from "@/contexts/LanguageContext";

interface InstructorProfileHeaderProps {
  name: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  location: string;
  languages: string[];
  vehicles: string[];
  vehiclePhotos?: string[];
  bio: string;
  imageUrl?: string;
  postId: string; // Used to fetch dynamic availability
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for availability

const InstructorProfileHeader = ({
  name,
  rating,
  reviewCount,
  specialty,
  location,
  languages,
  vehicles,
  vehiclePhotos = [],
  bio,
  imageUrl,
  postId
}: InstructorProfileHeaderProps) => {
  const { language } = useLanguage();
  const isKa = language === "ka";
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Dynamic Availability State
  const [isAvailableThisWeek, setIsAvailableThisWeek] = useState<boolean | null>(null);

  useEffect(() => {
    if (!postId) {
      setIsAvailableThisWeek(false);
      return;
    }

    let active = true;
    const fetchAvailability = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Convert postId to string correctly, as sometimes it might be passed as an unexpected type
        const res = await fetch(`${baseUrl}/api/bookings/by-post/${String(postId)}?status=available&limit=500`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch slots");
        
        const slots: { start_time_utc: string }[] = await res.json();
        
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const hasUpcomingWithinWeek = slots.some(slot => {
          const slotDate = new Date(slot.start_time_utc);
          return slotDate > now && slotDate <= nextWeek;
        });

        if (active) setIsAvailableThisWeek(hasUpcomingWithinWeek);
      } catch (err) {
        if (active) setIsAvailableThisWeek(false); // Fallback to not available on error
      }
    };

    fetchAvailability();
    return () => { active = false; };
  }, [postId]);

  // Build combined list of all images for the lightbox
  const allImages = [
    ...(imageUrl ? [{ src: imageUrl, alt: isKa ? `${name} - პროფილის ფოტო` : `${name} profile photo` }] : []),
    ...vehiclePhotos.map((url, idx) => ({ src: url, alt: isKa ? `ავტომობილის ფოტო ${idx + 1}` : `Vehicle photo ${idx + 1}` })),
  ];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Offset for vehicle photos in the combined images array
  const vehiclePhotoOffset = imageUrl ? 1 : 0;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
      {/* Cover Area */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-gray-900 to-gray-800 relative">
        <div className="absolute inset-0 bg-[#F03D3D]/10 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
        {/* Profile Image & Main Info */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start -mt-16 mb-6 md:mb-8">
          <div className="relative group">
            <div
              className={`w-32 h-32 rounded-3xl border-4 border-white bg-gray-200 shadow-lg overflow-hidden ${imageUrl ? "cursor-pointer" : ""}`}
              onClick={() => imageUrl && openLightbox(0)}
              role={imageUrl ? "button" : undefined}
              tabIndex={imageUrl ? 0 : undefined}
              aria-label={imageUrl ? (isKa ? `${name}-ის პროფილის ფოტოს ნახვა` : `View ${name}'s profile photo`) : undefined}
              onKeyDown={(e) => {
                if (imageUrl && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  openLightbox(0);
                }
              }}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-3xl font-bold text-gray-400">
                  {name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pt-2 md:pt-0 md:mt-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {name}
                  <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 fill-blue-50 shrink-0" />
                </h1>
                <p className="text-gray-500 text-base sm:text-lg">{specialty}</p>
              </div>
              
              <div className="flex items-center gap-3 self-start">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900 leading-none">{rating}</span>
                    {reviewCount > 0 && <span className="text-xs text-gray-500">{isKa ? `${reviewCount} შეფასება` : `${reviewCount} reviews`}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 md:hidden">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {location}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-6 md:mb-8" />

        {/* Bio & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{isKa ? "ჩემ შესახებ" : "About Me"}</h3>
              <p className="text-gray-600 leading-relaxed">
                {bio}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{isKa ? "ავტომობილები" : "Vehicles"}</h3>
              <div className="flex flex-wrap gap-3">
                {vehicles.map((vehicle, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium">
                    <Car className="w-4 h-4 text-gray-400" />
                    {vehicle}
                  </div>
                ))}
              </div>
              {vehiclePhotos.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{isKa ? "ავტომობილის ფოტოები" : "Vehicle Photos"}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vehiclePhotos.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 cursor-pointer group relative"
                        onClick={() => openLightbox(idx + vehiclePhotoOffset)}
                        role="button"
                        tabIndex={0}
                        aria-label={isKa ? `ავტომობილის ფოტოს ნახვა ${idx + 1}` : `View vehicle photo ${idx + 1}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openLightbox(idx + vehiclePhotoOffset);
                          }
                        }}
                      >
                        <img
                          src={url}
                          alt={isKa ? `ავტომობილის ფოტო ${idx + 1}` : `Vehicle photo ${idx + 1}`}
                          className="w-full h-36 sm:h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{isKa ? "ენები" : "Languages"}</h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{isKa ? "ხელმისაწვდომობა" : "Availability"}</h3>
              {isAvailableThisWeek === null ? (
                <div className="flex items-center gap-3 bg-gray-50 px-5 py-4 rounded-xl border border-gray-100 animate-pulse w-full max-w-sm">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                </div>
              ) : isAvailableThisWeek ? (
                <div className="inline-flex items-center gap-3 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100/80 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
                  <div className="relative flex items-center justify-center bg-white p-2 rounded-full shadow-sm">
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white z-10"></div>
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="pr-2">
                    <span className="block text-[15px] font-semibold text-gray-900 leading-tight">
                      {isKa ? "ხელმისაწვდომია ამ კვირაში" : "Available this week"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 shadow-sm opacity-90">
                  <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="pr-2">
                    <span className="block text-[15px] font-medium text-gray-700 leading-tight">
                      {isKa ? "ამ კვირაში ადგილი არ არის" : "No availability this week"}
                    </span>
                    <span className="block text-[13px] text-gray-500 font-medium mt-0.5">
                      {isKa ? "შეამოწმე მოგვიანებით" : "Check back soon"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default InstructorProfileHeader;
