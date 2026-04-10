import type { Metadata } from "next";
import { isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import HeroModern from "@/components/home/HeroModern";
import TrustStrip from "@/components/home/TrustStrip";
import LearningRoadmap from "@/components/home/LearningRoadmap";
import InstructorShowcase from "@/components/home/InstructorShowcase";
import InstructorCTA from "@/components/home/InstructorCTA";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    alternates: {
      canonical: `https://instruktori.ge/${locale}`,
      languages: {
        ka: "https://instruktori.ge/ka",
        en: "https://instruktori.ge/en",
        "x-default": "https://instruktori.ge/ka",
      },
    },
  };
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Instruktori.ge',
  url: 'https://instruktori.ge',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://instruktori.ge/ka/find-instructors?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Instruktori.ge',
  url: 'https://instruktori.ge',
  logo: 'https://instruktori.ge/icon.svg',
  email: 'support@instruktori.ge',
  description: 'Georgian driving instructor marketplace — find, compare, and book certified driving instructors across Georgia.',
  areaServed: {
    '@type': 'Country',
    name: 'Georgia',
  },
  sameAs: [],
}

export default function MainPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="min-h-screen bg-white">
        <HeroModern />
        <TrustStrip />
        <LearningRoadmap />
        <InstructorShowcase />
        <InstructorCTA />
      </div>
    </>
  );
}

