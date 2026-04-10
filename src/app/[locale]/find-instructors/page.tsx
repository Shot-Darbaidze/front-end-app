import type { Metadata } from "next";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";
import FindInstructorsPageClient from "./FindInstructorsClient";

type SearchParamsShape = Record<string, string | string[] | undefined>;

const getFirstQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsShape>;
}): Promise<Metadata> {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const isKa = locale === "ka";

  const instructorType = getFirstQueryValue(query.instructor_type)?.toLowerCase();
  const isSchoolMode = instructorType === "school";
  const rawMaxPrice = getFirstQueryValue(query.max_price);
  const maxPrice = rawMaxPrice ? Number(rawMaxPrice) : NaN;
  const hasValidMaxPrice = Number.isFinite(maxPrice) && maxPrice > 0;
  const maxPriceLabel = hasValidMaxPrice ? Math.floor(maxPrice).toString() : null;

  const basePath = `/${locale}/find-instructors`;
  const canonical = isSchoolMode
    ? `${basePath}?instructor_type=school`
    : basePath;
  const ogUrl = canonical;

  const title = isSchoolMode
    ? isKa
      ? hasValidMaxPrice
        ? `იპოვე ავტოსკოლები ${maxPriceLabel}₾-მდე | შეადარე ფასები და რეიტინგები`
        : "იპოვე ავტოსკოლები | შეადარე ფასები და რეიტინგები"
      : hasValidMaxPrice
        ? `Find Driving Schools up to ${maxPriceLabel} GEL | Compare Prices & Reviews`
        : "Find Driving Schools | Compare Prices & Reviews"
    : isKa
      ? "იპოვე მართვის ინსტრუქტორი | შეადარე ფასები და შეფასებები"
      : "Find Driving Instructors | Compare Prices and Ratings";

  const description = isSchoolMode
    ? isKa
      ? hasValidMaxPrice
        ? `აღმოაჩინე ავტოსკოლები ${maxPriceLabel}₾-მდე ბიუჯეტით. შეადარე ფასები, შეფასებები და პირობები საუკეთესო არჩევანისთვის.`
        : "აღმოაჩინე ავტოსკოლები, შეადარე ფასები, შეფასებები და მომსახურების პირობები და აირჩიე შენთვის საუკეთესო ვარიანტი."
      : hasValidMaxPrice
        ? `Discover driving schools within ${maxPriceLabel} GEL budget. Compare prices, ratings, and packages to choose the best option.`
        : "Discover driving schools, compare prices, ratings, and lesson packages, and choose the best option for your needs."
    : isKa
      ? "დაათვალიერე და შეადარე მართვის ინსტრუქტორები შეფასების, ფასის, ქალაქისა და გადაცემათა კოლოფის ტიპის მიხედვით."
      : "Browse and compare driving instructors by rating, price, city, and transmission type.";

  const keywords = isSchoolMode
    ? isKa
      ? ["ავტოსკოლა", "მართვის სკოლა", "ავტოსკოლის ფასები", "მართვის კურსები", "ავტომობილის მართვის სწავლა"]
      : ["driving school", "driving schools in Georgia", "driving school prices", "driving course", "learn driving in Georgia"]
    : isKa
      ? ["მართვის ინსტრუქტორი", "ინსტრუქტორის ძიება", "მართვის გაკვეთილები", "ინსტრუქტორი თბილისში", "ავტომატიკა", "მექანიკა"]
      : ["driving instructor", "find driving instructor", "driving lessons", "driving instructor in Tbilisi", "automatic", "manual"];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ka: `/ka/find-instructors${isSchoolMode ? '?instructor_type=school' : ''}`,
        en: `/en/find-instructors${isSchoolMode ? '?instructor_type=school' : ''}`,
      },
    },
    openGraph: {
      title,
      description,
      locale: isKa ? "ka_GE" : "en_US",
      type: "website",
      siteName: "Instruktori.ge",
      url: ogUrl,
    },
    twitter: {
      title,
      description,
    },
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default async function FindInstructorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch top instructors for ItemList schema (SSR-visible for crawlers)
  let itemListSchema = null;
  try {
    const res = await fetch(`${API_BASE}/api/posts?limit=10`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data ?? []);
      if (list.length > 0) {
        itemListSchema = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: locale === 'ka' ? 'მართვის ინსტრუქტორები' : 'Driving Instructors',
          itemListElement: list.map((inst: { id: string; applicant_first_name?: string; applicant_last_name?: string; title?: string }, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://instruktori.ge/${locale}/instructors/${inst.id}`,
            name: [inst.applicant_first_name, inst.applicant_last_name].filter(Boolean).join(' ') || inst.title || 'Instructor',
          })),
        };
      }
    }
  } catch {
    // Non-critical
  }

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <FindInstructorsPageClient />
    </>
  );
}
