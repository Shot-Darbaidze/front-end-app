import InstructorProfileHeader from "@/components/instructor-profile/InstructorProfileHeader";
import BookingSidebar from "@/components/instructor-profile/BookingSidebar";
import LocationCard from "@/components/instructor-profile/LocationCard";
import CommentSection from "@/components/instructor-profile/CommentSection";
import BackToInstructorsButton from "@/components/instructor-profile/BackToInstructorsButton";
import Link from "next/link";
import {
  buildInstructorName,
  extractCityName,
  formatLanguages,
  buildVehicleInfo,
  pickFirstValidPrice,
} from "@/utils/instructor";
import { resolveMediaUrl } from "@/utils/media";

type InstructorPost = {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  google_maps_url?: string | null;
  located_at?: string | null;
  applicant_address?: string | null;
  address?: string | null;
  automatic_city_price?: number | null;
  manual_city_price?: number | null;
  language_skills?: string | null;
  rating?: number | null;
  review_count?: number | null;
  transmission?: string | null;
  applicant_first_name?: string | null;
  applicant_last_name?: string | null;
  vehicle_brand?: string | null;
  vehicle_year?: number | null;
  autoschool_id?: string | null;
};

type InstructorAsset = {
  id: string;
  asset_type: string;
  url: string;
  original_filename?: string | null;
};

export default async function InstructorProfilePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { locale, id } = await params;

  const [postResponse, assetsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/posts/${id}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/posts/${id}/assets?asset_type=vehicle_photos`, { cache: "no-store" }),
  ]);

  if (!postResponse.ok) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-28 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900">{locale === "ka" ? "ინსტრუქტორი ვერ მოიძებნა" : "Instructor not found"}</h1>
            <p className="text-gray-500 mt-2">{locale === "ka" ? "ინსტრუქტორის პროფილის ჩატვირთვა ვერ მოხერხდა." : "This instructor profile could not be loaded."}</p>
            <BackToInstructorsButton
              fallbackHref={`/${locale}/find-instructors`}
              className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium mt-6"
            />
          </div>
        </div>
      </div>
    );
  }

  const post = (await postResponse.json()) as InstructorPost;
  const assets = assetsResponse.ok ? ((await assetsResponse.json()) as InstructorAsset[]) : [];

  const name = buildInstructorName(post.applicant_first_name, post.applicant_last_name, post.title || "ინსტრუქტორი");
  const cityLocation = extractCityName(post.located_at);
  const vehicles = buildVehicleInfo(post.vehicle_brand, post.vehicle_year);
  const languages = formatLanguages(post.language_skills);
  const vehiclePhotos = assets
    .map((asset) => resolveMediaUrl(asset.url))
    .filter((url): url is string => Boolean(url));
  const cityPrice = pickFirstValidPrice([post.automatic_city_price, post.manual_city_price]);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb / Back */}
        <div className="mb-4 flex items-center justify-between">
          <BackToInstructorsButton
            fallbackHref={`/${locale}/find-instructors`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#F03D3D] transition-colors font-medium"
          />
        </div>

        {post.title && post.autoschool_id && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm">
            <span className="text-gray-500">{locale === "ka" ? "ავტოსკოლა:" : "Autoschool:"}</span>
            <Link
              href={`/${locale}/autoschools/${post.autoschool_id}`}
              className="font-semibold text-[#F03D3D] hover:underline"
            >
              {post.title}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 1. Profile Card — mobile: 1st, desktop: main column */}
          <div className="order-1 lg:col-span-2 lg:row-span-1">
            <InstructorProfileHeader
              name={name}
              rating={Number(post.rating ?? 0)}
              reviewCount={post.review_count ?? 0}
              specialty={post.title || "მართვის ინსტრუქტორი"}
              location={cityLocation}
              languages={languages.length ? languages : [locale === "ka" ? "არ არის მითითებული" : "Not specified"]}
              vehicles={vehicles}
              vehiclePhotos={vehiclePhotos}
              bio={post.description || (locale === "ka" ? "ინსტრუქტორის აღწერა მალე დაემატება." : "Instructor bio coming soon.")}
              imageUrl={resolveMediaUrl(post.image_url)}
              postId={id}
            />
          </div>

          {/* 2. Booking + Location — mobile: 2nd & 3rd, desktop: sticky sidebar */}
          <div className="order-2 lg:col-span-1 lg:row-span-2 space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <BookingSidebar
              cityPrice={cityPrice}
              lessonDuration={60}
              instructorId={post.id}
            />
            <LocationCard
              location={cityLocation}
              googleMapsUrl={post.google_maps_url}
              locale={locale}
            />
          </div>

          {/* 3. Reviews — mobile: 4th (last), desktop: main column */}
          <div className="order-3 lg:col-span-2">
            <CommentSection postId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
