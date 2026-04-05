"use client";

import InstructorList from "@/components/find-instructors/InstructorList";
import { useLanguage } from "@/contexts/LanguageContext";
import type { InstructorCardData } from "@/types/find-instructors";
import { trackInstructorClick } from "@/utils/analytics";

interface InstructorGridProps {
  instructors: InstructorCardData[];
}

const InstructorGrid = ({ instructors }: InstructorGridProps) => {
  const { language } = useLanguage();
  const isKa = language === "ka";

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        {isKa ? "ინსტრუქტორები" : "Instructors"}
        <span className="ml-2 text-sm font-semibold text-gray-400">({instructors.length})</span>
      </h3>

      <InstructorList instructors={instructors} onInstructorClick={trackInstructorClick} />
    </div>
  );
};

export default InstructorGrid;
