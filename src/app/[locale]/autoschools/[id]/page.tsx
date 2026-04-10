import { notFound } from "next/navigation";
import AutoschoolProfileHeader from "@/components/autoschool-profile/AutoschoolProfileHeader";
import InstructorGrid from "@/components/autoschool-profile/InstructorGrid";
import CoursePackagesSidebar from "@/components/autoschool-profile/CoursePackagesSidebar";
import WorkingHoursCard from "@/components/autoschool-profile/WorkingHoursCard";
import LocationCard from "@/components/instructor-profile/LocationCard";
import CommentSection from "@/components/instructor-profile/CommentSection";
import BackToInstructorsButton from "@/components/instructor-profile/BackToInstructorsButton";
import type { CoursePackage, InstructorMini } from "@/components/autoschool-profile/CoursePackagesSidebar";
import type { AutoschoolDetail } from "@/services/autoschoolService";
import type { InstructorCardData } from "@/types/find-instructors";
import { resolveMediaUrl } from "@/utils/media";
import { formatLanguageCodes } from "@/utils/instructor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const revalidate = 60;

/**
 * Fetch autoschool data from the backend at build/request time.
 * Returns null on 404 (school not found or not yet approved).
 */
async function fetchAutoschool(id: string): Promise<AutoschoolDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/autoschools/${id}`, {
      // Keep the profile reasonably fresh while still allowing App Router caching and prefetching.
      next: { revalidate: 60 },
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

  // Parse CSV helper (needed before packages)
  const csvToArray = (csv: string | null | undefined) =>
    csv ? csv.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // Build InstructorMini list for the single-lesson sidebar ("სათითაო" tab)
  const allInstructorMinis: InstructorMini[] = (school.instructors ?? []).map((i) => ({
    id: i.id,
    name: [i.first_name, i.last_name].filter(Boolean).join(" ") || i.title,
    imageUrl: resolveMediaUrl(i.image_url),
    profileHref: `/${locale}/instructors/${i.id}`,
    transmission: i.transmission ?? null,
    cityPrice: i.city_price != null ? Number(i.city_price) : null,
    yardPrice: i.yard_price != null ? Number(i.yard_price) : null,
  }));

  const rawPackages = school.packages ?? [];

  const packages: CoursePackage[] = rawPackages.length > 0
    ? rawPackages.map((p) => ({
        id: p.id,
        name: p.name,
        lessons: p.lessons,
        percentage: p.percentage != null && Number(p.percentage) > 0 ? Number(p.percentage) : undefined,
        popular: p.popular,
        description: p.description ?? "",
        mode: p.mode ?? "city",
        transmission: p.transmission ?? "manual",
      }))
    : [];

  const schedule = (school.working_hours ?? []).map((h) => ({
    days: h.day_label,
    hours: h.hours_label ?? "",
    closed: h.is_closed,
  }));

  const instructors: InstructorCardData[] = (school.instructors ?? []).map((i) => ({
    id: i.id,
    name: [i.first_name, i.last_name].filter(Boolean).join(" ") || i.title,
    rating: i.rating != null ? Number(i.rating) : 0,
    reviewCount: 0,
    specialty: i.title || (locale === "ka" ? "მართვის ინსტრუქტორი" : "Driving Instructor"),
    price: i.city_price != null ? Number(i.city_price) : (i.yard_price != null ? Number(i.yard_price) : 0),
    cityPrice: i.city_price != null ? Number(i.city_price) : null,
    yardPrice: i.yard_price != null ? Number(i.yard_price) : null,
    tags: [
      ...(i.transmission ? [i.transmission] : []),
      ...formatLanguageCodes(csvToArray(i.language_skills)).slice(0, 3),
    ],
    imageUrl: resolveMediaUrl(i.image_url),
  }));

  const instructorRatings = (school.instructors ?? [])
    .map((i) => (i.rating != null ? Number(i.rating) : null))
    .filter((r): r is number => r !== null && !Number.isNaN(r));
  const overallRating = instructorRatings.length > 0
    ? Number((instructorRatings.reduce((sum, r) => sum + r, 0) / instructorRatings.length).toFixed(1))
    : 0;
  const overallReviewCount = instructorRatings.length;
  const instructorPostIds = (school.instructors ?? []).map((i) => i.id);

  const lowestPackagePrice = packages.length > 0
    ? Math.min(...packages.map(p => p.lessons).filter(Boolean))
    : null;

  const autoschoolSchema = {
    '@context': 'https://schema.org',
    '@type': 'DrivingSchool',
    name: school.name,
    url: `https://instruktori.ge/${locale}/autoschools/${id}`,
    image: resolveMediaUrl(school.logo_url) ?? undefined,
    address: school.city ? {
      '@type': 'PostalAddress',
      addressLocality: school.city,
      addressCountry: 'GE',
    } : undefined,
    ...(overallRating > 0 && overallReviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: overallRating,
        reviewCount: overallReviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: instructors.length,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(autoschoolSchema) }}
      />
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
              languages={formatLanguageCodes(csvToArray(school.languages))}
              fleet={csvToArray(school.fleet).length > 0 ? csvToArray(school.fleet) : ["Skoda Rapid", "Volkswagen Jetta"]}
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
            {packages.length > 0 && (
              <CoursePackagesSidebar
                packages={packages}
                allInstructors={allInstructorMinis}
                bookingHref={`/${locale}/autoschools/${id}/book`}
              />
            )}
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
    </>
  );
}
