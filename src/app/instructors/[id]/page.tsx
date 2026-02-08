import InstructorProfileHeader from "@/components/instructor-profile/InstructorProfileHeader";
import BookingSidebar from "@/components/instructor-profile/BookingSidebar";
import LocationCard from "@/components/instructor-profile/LocationCard";
import CommentSection from "@/components/instructor-profile/CommentSection";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  buildInstructorName,
  extractCityName,
  formatLanguages,
  buildVehicleInfo,
  pickFirstValidPrice,
} from "@/utils/instructor";

type InstructorPost = {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  google_maps_url?: string | null;
  located_at?: string | null;
  automatic_city_price?: number | null;
  manual_city_price?: number | null;
  language_skills?: string | null;
  rating?: number | null;
  transmission?: string | null;
  applicant_first_name?: string | null;
  applicant_last_name?: string | null;
  vehicle_brand?: string | null;
  vehicle_year?: number | null;
};

type InstructorAsset = {
  id: string;
  asset_type: string;
  url: string;
  original_filename?: string | null;
};

export default async function InstructorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { id } = await params;

  const [postResponse, assetsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/posts/${id}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/posts/${id}/assets?asset_type=vehicle_photos`, { cache: "no-store" }),
  ]);

  if (!postResponse.ok) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-28 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900">Instructor not found</h1>
            <p className="text-gray-500 mt-2">This instructor profile could not be loaded.</p>
            <Link
              href="/find-instructors"
              className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium mt-6"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Instructors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const post = (await postResponse.json()) as InstructorPost;
  const assets = assetsResponse.ok ? ((await assetsResponse.json()) as InstructorAsset[]) : [];

  const name = buildInstructorName(post.applicant_first_name, post.applicant_last_name, post.title || "Instructor");
  const location = extractCityName(post.located_at);
  const vehicles = buildVehicleInfo(post.vehicle_brand, post.vehicle_year);
  const languages = formatLanguages(post.language_skills);
  const vehiclePhotos = assets.map((asset) => asset.url);
  const cityPrice = pickFirstValidPrice([post.automatic_city_price, post.manual_city_price]);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb / Back */}
        <div className="mb-4 flex items-center justify-between">
          <Link 
            href="/find-instructors" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#F03D3D] transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Instructors
          </Link>
          <FavoriteButton postId={id} variant="button" size="md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <InstructorProfileHeader
              name={name}
              rating={Number(post.rating ?? 0)}
              reviewCount={0}
              specialty={post.title || "Driving Instructor"}
              location={location}
              languages={languages.length ? languages : ["Not specified"]}
              vehicles={vehicles}
              vehiclePhotos={vehiclePhotos}
              bio={post.description || "Instructor bio coming soon."}
              imageUrl={post.image_url ?? undefined}
            />
            
            {/* Reviews & Comments Section */}
            <CommentSection postId={id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 sticky top-24 h-fit">
            <BookingSidebar 
              cityPrice={cityPrice}
              lessonDuration={60}
              instructorId={post.id}
            />
            <LocationCard location={location} googleMapsUrl={post.google_maps_url} />
          </div>
        </div>
      </div>
    </div>
  );
}
