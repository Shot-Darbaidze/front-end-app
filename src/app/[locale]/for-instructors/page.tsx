import type { Metadata } from "next";
import { isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import InstructorHero from "@/components/for-instructors/InstructorHero";
import Stats from "@/components/for-instructors/Stats";
import HowItWorks from "@/components/for-instructors/HowItWorks";
import ComparisonGrid from "@/components/for-instructors/ComparisonGrid";
import Testimonials from "@/components/for-instructors/Testimonials";
import InstructorCTA from "@/components/for-instructors/InstructorCTA";
import FAQ from "@/components/for-instructors/FAQ";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const isKa = locale === "ka";

  return {
    title: isKa
      ? "გახდი პარტნიორი ინსტრუქტორი"
      : "Become a Partner Instructor",
    description: isKa
      ? "შეუერთდი Instruktori.ge-ს პლატფორმას, შექმენი პროფილი, დააყენე შენი ფასები და მიიღე მოსწავლეები ონლაინ."
      : "Join the Instruktori.ge platform, create your profile, set your prices, and get booked online.",
    alternates: {
      canonical: `https://instruktori.ge/${locale}/for-instructors`,
      languages: {
        ka: "https://instruktori.ge/ka/for-instructors",
        en: "https://instruktori.ge/en/for-instructors",
      },
    },
  };
}

export default function ForInstructorsPage() {
  return (
    <main className="min-h-screen bg-white">
      <InstructorHero />
      <Stats />
      <HowItWorks />
      <InstructorCTA />
      <ComparisonGrid />
      <Testimonials />
      <FAQ />
    </main>
  );
}
