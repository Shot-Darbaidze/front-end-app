"use client";

import InstructorHero from "@/components/for-instructors/InstructorHero";
import Stats from "@/components/for-instructors/Stats";
import HowItWorks from "@/components/for-instructors/HowItWorks";
import ComparisonGrid from "@/components/for-instructors/ComparisonGrid";
import Testimonials from "@/components/for-instructors/Testimonials";
import InstructorCTA from "@/components/for-instructors/InstructorCTA";
import FAQ from "@/components/for-instructors/FAQ";

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
