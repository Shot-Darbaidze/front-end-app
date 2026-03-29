import { notFound } from "next/navigation";
import AutoschoolProfileHeader from "@/components/autoschool-profile/AutoschoolProfileHeader";
import InstructorGrid from "@/components/autoschool-profile/InstructorGrid";
import CoursePackagesSidebar from "@/components/autoschool-profile/CoursePackagesSidebar";
import WorkingHoursCard from "@/components/autoschool-profile/WorkingHoursCard";
import LocationCard from "@/components/instructor-profile/LocationCard";
import CommentSection from "@/components/instructor-profile/CommentSection";
import BackToInstructorsButton from "@/components/instructor-profile/BackToInstructorsButton";
import type { SchoolInstructor } from "@/components/autoschool-profile/InstructorGrid";
import type { CoursePackage } from "@/components/autoschool-profile/CoursePackagesSidebar";
import type { AutoschoolDetail } from "@/services/autoschoolService";
import { resolveMediaUrl } from "@/utils/media";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Fetch autoschool data from the backend at build/request time.
 * Returns null on 404 (school not found or not yet approved).
 */
async function fetchAutoschool(id: string): Promise<AutoschoolDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/autoschools/${id}`, {
      // Keep profile data fresh for client navigation and avoid stale prefetch payloads.
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export default async function AutoschoolProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const school = await fetchAutoschool(id);

  // Gracefully 404 if school doesn't exist or isn't approved yet
  if (!school) {
    notFound();
  }

  // ── Transform API data to component-prop shapes ──────────────────────────

  const packages: CoursePackage[] = (school.packages ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    lessons: p.lessons,
    price: Number(p.price),
    originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
    popular: p.popular,
    description: p.description ?? "",
  }));

  const schedule = (school.working_hours ?? []).map((h) => ({
    days: h.day_label,
    hours: h.hours_label ?? "",
    closed: h.is_closed,
  }));

  // Parse CSV helper
  const csvToArray = (csv: string | null | undefined) =>
    csv ? csv.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const instructors: SchoolInstructor[] = (school.instructors ?? []).map((i) => ({
    id: i.id,
    name: [i.first_name, i.last_name].filter(Boolean).join(" ") || i.title,
    rating: i.rating != null ? Number(i.rating) : 0,
    transmission: i.transmission ?? "Manual",
    price: i.city_price != null ? Number(i.city_price) : (i.yard_price != null ? Number(i.yard_price) : 0),
    imageUrl: resolveMediaUrl(i.image_url),
    languages: csvToArray(i.language_skills),
  }));

  const instructorRatings = (school.instructors ?? [])
    .map((i) => (i.rating != null ? Number(i.rating) : null))
    .filter((r): r is number => r !== null && !Number.isNaN(r));
  const overallRating = instructorRatings.length > 0
    ? Number((instructorRatings.reduce((sum, r) => sum + r, 0) / instructorRatings.length).toFixed(1))
    : 0;
  const overallReviewCount = instructorRatings.length;
  const instructorPostIds = (school.instructors ?? []).map((i) => i.id);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Back button */}
        <div className="mb-4">
          <BackToInstructorsButton
            fallbackHref={`/${locale}/find-instructors`}
            label="Back to Instructors"
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#F03D3D] transition-colors font-medium"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 1. School Header — col-span-2 */}
          <div className="order-1 lg:col-span-2">
            <AutoschoolProfileHeader
              name={school.name}
              rating={overallRating}
              reviewCount={overallReviewCount}
              location={school.city ?? ""}
              description={school.description ?? ""}
              languages={csvToArray(school.languages)}
              instructorCount={instructors.length}
              imageUrl={resolveMediaUrl(school.logo_url)}
              coverImageUrl={resolveMediaUrl(school.cover_image_url)}
              galleryImages={(school.image_urls ?? [])
                .map((u: string) => resolveMediaUrl(u))
                .filter((u): u is string => Boolean(u))}
            />
          </div>

          {/* 2. Sidebar — sticky, col-span-1, spans multiple rows */}
          <div className="order-2 lg:col-span-1 lg:row-span-3 space-y-6">
            <CoursePackagesSidebar
              packages={packages}
              bookingHref={`/${locale}/autoschools/${id}/book`}
            />
            <WorkingHoursCard
              schedule={schedule}
            />
            <LocationCard
              location={school.city ?? ""}
              googleMapsUrl={school.google_maps_url ?? ""}
              locale={locale}
            />
          </div>

          {/* 3. Instructors Grid — col-span-2 */}
          <div className="order-3 lg:col-span-2">
            <InstructorGrid instructors={instructors} />
          </div>

          {/* 4. Reviews — col-span-2 */}
          <div className="order-4 lg:col-span-2">
            <CommentSection postIds={instructorPostIds} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
