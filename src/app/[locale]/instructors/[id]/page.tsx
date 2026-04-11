import type { Metadata } from "next";
import { cache } from "react";
import InstructorProfileHeader from "@/components/instructor-profile/InstructorProfileHeader";
import InstructorBookingPanel from "@/components/instructor-profile/InstructorBookingPanel";
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
import { isPackageTransmissionCompatible } from "@/utils/packages";
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
  automatic_yard_price?: number | null;
  manual_yard_price?: number | null;
  language_skills?: string | null;
  rating?: number | null;
  review_count?: number | null;
  transmission?: string | null;
  applicant_first_name?: string | null;
  applicant_last_name?: string | null;
  vehicle_brand?: string | null;
  vehicle_year?: number | null;
  autoschool_id?: string | null;
  allowed_modes?: "city" | "yard" | "both" | null;
  packages?: CoursePackage[];
};

type CoursePackage = {
  id: string;
  name: string;
  lessons: number;
  percentage?: number | null;
  popular?: boolean;
  description?: string | null;
  mode: string;
  transmission: string;
};

type InstructorAsset = {
  id: string;
  asset_type: string;
  url: string;
  original_filename?: string | null;
};

const PROFILE_REVALIDATE_SECONDS = 120;
const ASSETS_REVALIDATE_SECONDS = 120;
const AUTOSCHOOL_REVALIDATE_SECONDS = 120;

const getInstructorPost = cache(async (baseUrl: string, id: string): Promise<{ ok: boolean; status: number; data: InstructorPost | null }> => {
  const res = await fetch(`${baseUrl}/api/posts/${id}`, {
    next: { revalidate: PROFILE_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  const data = (await res.json()) as InstructorPost;
  return { ok: true, status: res.status, data };
});

const getInstructorAssets = cache(async (baseUrl: string, id: string): Promise<InstructorAsset[]> => {
  const res = await fetch(`${baseUrl}/api/posts/${id}/assets?asset_type=vehicle_photos`, {
    next: { revalidate: ASSETS_REVALIDATE_SECONDS },
  });
  if (!res.ok) return [];
  return (await res.json()) as InstructorAsset[];
});

const getAutoschoolPackages = cache(async (baseUrl: string, autoschoolId: string): Promise<CoursePackage[]> => {
  const schoolRes = await fetch(`${baseUrl}/api/autoschools/${autoschoolId}`, {
    next: { revalidate: AUTOSCHOOL_REVALIDATE_SECONDS },
  });
  if (!schoolRes.ok) return [];
  const school = await schoolRes.json();
  return (school.packages || []) as CoursePackage[];
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { locale, id } = await params;
  const isKa = locale === "ka";

  try {
    const postResult = await getInstructorPost(baseUrl, id);
    if (!postResult.ok || !postResult.data) return {};
    const post = postResult.data;

    const name = buildInstructorName(post.applicant_first_name, post.applicant_last_name, post.title || "ინსტრუქტორი");
    const city = extractCityName(post.located_at);
    const transmission = post.transmission?.toLowerCase();
    const price = pickFirstValidPrice([
      post.automatic_city_price, post.manual_city_price,
      post.automatic_yard_price, post.manual_yard_price,
    ]);

    const transLabel = isKa
      ? (transmission === "automatic" ? "ავტომატიკა" : transmission === "manual" ? "მექანიკა" : "")
      : (transmission === "automatic" ? "Automatic" : transmission === "manual" ? "Manual" : "");

    const title = isKa
      ? `${name} - მართვის ინსტრუქტორი${city ? ` ${city}` : ""}`
      : `${name} - Driving Instructor${city ? ` in ${city}` : ""}`;

    const descParts = [
      isKa ? `${name} - მართვის ინსტრუქტორი` : `${name} - Driving Instructor`,
      city ? (isKa ? `${city}` : `in ${city}`) : null,
      transLabel || null,
      price ? (isKa ? `${price}₾-დან` : `from ${price} GEL`) : null,
      post.rating ? (isKa ? `შეფასება: ${Number(post.rating).toFixed(1)}/5` : `Rating: ${Number(post.rating).toFixed(1)}/5`) : null,
    ].filter(Boolean);
    const description = descParts.join(" | ");

    const imageUrl = resolveMediaUrl(post.image_url);

    return {
      title,
      description,
      alternates: {
        canonical: `https://instruktori.ge/${locale}/instructors/${id}`,
        languages: {
          ka: `https://instruktori.ge/ka/instructors/${id}`,
          en: `https://instruktori.ge/en/instructors/${id}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://instruktori.ge/${locale}/instructors/${id}`,
        locale: isKa ? "ka_GE" : "en_US",
        type: "profile",
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default async function InstructorProfilePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { locale, id } = await params;

  const [postResult, assets] = await Promise.all([
    getInstructorPost(baseUrl, id),
    getInstructorAssets(baseUrl, id),
  ]);

  if (!postResult.ok || !postResult.data) {
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

  const post = postResult.data;

  const name = buildInstructorName(post.applicant_first_name, post.applicant_last_name, post.title || "ინსტრუქტორი");
  const cityLocation = extractCityName(post.located_at);
  const vehicles = buildVehicleInfo(post.vehicle_brand, post.vehicle_year);
  const languages = formatLanguages(post.language_skills);
  const vehiclePhotos = assets
    .map((asset) => resolveMediaUrl(asset.url))
    .filter((url): url is string => Boolean(url));
  const cityPrice = pickFirstValidPrice([post.automatic_city_price, post.manual_city_price]);
  const yardPrice = pickFirstValidPrice([post.automatic_yard_price, post.manual_yard_price]);

  // Use school packages for employees, own packages for solo instructors.
  let packages: CoursePackage[] = [];
  if (post.autoschool_id) {
    try {
      const schoolPackages = await getAutoschoolPackages(baseUrl, post.autoschool_id);
      const trans = (post.transmission || "").toLowerCase();
      packages = schoolPackages.filter((pkg: CoursePackage) => {
        return isPackageTransmissionCompatible(pkg.transmission, trans);
      });
    } catch {
      // non-critical — profile still works without packages
    }
  } else {
    const trans = (post.transmission || "").toLowerCase();
    packages = (post.packages || []).filter((pkg: CoursePackage) => {
      return isPackageTransmissionCompatible(pkg.transmission, trans, { allowBoth: false });
    });
  }

  const lowestPrice = pickFirstValidPrice([
    post.automatic_city_price,
    post.manual_city_price,
    post.automatic_yard_price,
    post.manual_yard_price,
  ]);

  const isKa = locale === "ka";
  const pageUrl = `https://instruktori.ge/${locale}/instructors/${id}`;

  const instructorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: isKa ? `მართვის გაკვეთილები - ${name}` : `Driving Lessons with ${name}`,
    serviceType: 'Driving Instruction',
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${pageUrl}#business`,
      name,
      image: resolveMediaUrl(post.image_url) ?? undefined,
      url: pageUrl,
      ...(cityLocation ? {
        address: {
          '@type': 'PostalAddress',
          addressLocality: cityLocation,
          addressCountry: 'GE',
        },
      } : {}),
      ...(post.rating && post.review_count && post.review_count > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(post.rating),
          reviewCount: post.review_count,
          bestRating: 5,
          worstRating: 1,
        },
      } : {}),
    },
    ...(lowestPrice ? {
      offers: {
        '@type': 'Offer',
        name: isKa ? 'მართვის გაკვეთილი' : 'Driving Lesson',
        price: lowestPrice,
        priceCurrency: 'GEL',
        availability: 'https://schema.org/InStock',
      },
    } : {}),
    ...(cityLocation ? {
      areaServed: {
        '@type': 'City',
        name: cityLocation,
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
        name: isKa ? 'ინსტრუქტორები' : 'Instructors',
        item: `https://instruktori.ge/${locale}/find-instructors`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(instructorSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
              <InstructorBookingPanel
                cityPrice={cityPrice}
                yardPrice={yardPrice}
                instructorId={post.id}
                autoschoolId={post.autoschool_id}
                allowedModes={post.allowed_modes ?? null}
                packages={packages}
                pricing={{
                  transmission: post.transmission,
                  automatic_city_price: post.automatic_city_price,
                  manual_city_price: post.manual_city_price,
                  automatic_yard_price: post.automatic_yard_price,
                  manual_yard_price: post.manual_yard_price,
                }}
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
    </>
  );
}
