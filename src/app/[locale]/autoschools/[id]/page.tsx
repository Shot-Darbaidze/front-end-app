import type { Metadata } from "next";
import { cache } from "react";
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
const AUTOSCHOOL_PROFILE_REVALIDATE_SECONDS = 60;

/**
 * Fetch autoschool data from the backend at build/request time.
 * Returns null on 404 (school not found or not yet approved).
 */
const fetchAutoschool = cache(async (id: string): Promise<AutoschoolDetail | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/autoschools/${id}`, {
      // Keep the profile reasonably fresh while still allowing App Router caching and prefetching.
      next: { revalidate: AUTOSCHOOL_PROFILE_REVALIDATE_SECONDS },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return (await res.json()) as AutoschoolDetail;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const isKa = locale === "ka";

  try {
    const school = await fetchAutoschool(id);
    if (!school) return {};

    const title = isKa
      ? `${school.name} - ავტოსკოლა${school.city ? ` ${school.city}` : ""}`
      : `${school.name} - Driving School${school.city ? ` in ${school.city}` : ""}`;

    const instructorCount = school.instructors?.length ?? 0;
    const descParts = [
      isKa ? `${school.name} - ავტოსკოლა` : `${school.name} - Driving School`,
      school.city || null,
      instructorCount > 0
        ? (isKa ? `${instructorCount} ინსტრუქტორი` : `${instructorCount} instructors`)
        : null,
      school.description?.replace(/<[^>]*>/g, '').slice(0, 100) || null,
    ].filter(Boolean);
    const description = descParts.join(" | ");

    const imageUrl = resolveMediaUrl(school.logo_url);

    return {
      title,
      description,
      alternates: {
        canonical: `https://instruktori.ge/${locale}/autoschools/${id}`,
        languages: {
          ka: `https://instruktori.ge/ka/autoschools/${id}`,
          en: `https://instruktori.ge/en/autoschools/${id}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://instruktori.ge/${locale}/autoschools/${id}`,
        locale: isKa ? "ka_GE" : "en_US",
        type: "website",
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      },
    };
  } catch {
    return {};
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

  const isKa = locale === "ka";
  const pageUrl = `https://instruktori.ge/${locale}/autoschools/${id}`;

  // Build openingHoursSpecification from working_hours data
  const dayMap: Record<string, string> = {
    'ორშაბათი': 'Monday', 'სამშაბათი': 'Tuesday', 'ოთხშაბათი': 'Wednesday',
    'ხუთშაბათი': 'Thursday', 'პარასკევი': 'Friday', 'შაბათი': 'Saturday', 'კვირა': 'Sunday',
    'Monday': 'Monday', 'Tuesday': 'Tuesday', 'Wednesday': 'Wednesday',
    'Thursday': 'Thursday', 'Friday': 'Friday', 'Saturday': 'Saturday', 'Sunday': 'Sunday',
  };

  const openingHours = (school.working_hours ?? [])
    .filter((h) => !h.is_closed && h.hours_label)
    .map((h) => {
      const timeParts = h.hours_label?.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      const dayOfWeek = dayMap[h.day_label] ?? h.day_label;
      if (!timeParts || !dayOfWeek) return null;
      return {
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek,
        opens: timeParts[1],
        closes: timeParts[2],
      };
    })
    .filter(Boolean);

  // Compute a price range hint from school-level and instructor prices
  const allPrices = [
    school.manual_city_price ?? null, school.manual_yard_price ?? null,
    school.automatic_city_price ?? null, school.automatic_yard_price ?? null,
    ...(school.instructors ?? []).flatMap((i) => [
      i.city_price != null ? Number(i.city_price) : null,
      i.yard_price != null ? Number(i.yard_price) : null,
    ]),
  ].filter((p): p is number => p !== null && p > 0);
  const priceRange = allPrices.length > 0
    ? `${Math.min(...allPrices)}–${Math.max(...allPrices)} GEL`
    : undefined;

  const autoschoolSchema = {
    '@context': 'https://schema.org',
    '@type': 'DrivingSchool',
    '@id': `${pageUrl}#school`,
    name: school.name,
    url: pageUrl,
    image: resolveMediaUrl(school.logo_url) ?? undefined,
    ...(school.city ? {
      address: {
        '@type': 'PostalAddress',
        addressLocality: school.city,
        addressCountry: 'GE',
      },
    } : {}),
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
    ...(priceRange ? { priceRange } : {}),
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: instructors.length,
    },
    ...(school.city ? {
      areaServed: {
        '@type': 'City',
        name: school.city,
      },
    } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isKa ? 'მთავარი' : 'Home',
        item: `https://instruktori.ge/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isKa ? 'ავტოსკოლები' : 'Driving Schools',
        item: `https://instruktori.ge/${locale}/find-instructors`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: school.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(autoschoolSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
