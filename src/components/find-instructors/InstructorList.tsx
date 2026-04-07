import InstructorCard from "./InstructorCard";
import type { InstructorCardData } from "@/types/find-instructors";
import { memo } from "react";

interface InstructorListProps {
  instructors: InstructorCardData[];
  activeModeFilter?: string;
  onInstructorClick?: (instructorId: string, position: number) => void;
}

const InstructorList = memo(({ instructors, activeModeFilter, onInstructorClick }: InstructorListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {instructors.map((instructor, index) => (
        <InstructorCard
          key={instructor.id}
          {...instructor}
          activeModeFilter={activeModeFilter}
          position={index}
          onCardClick={onInstructorClick}
        />
      ))}
    </div>
  );
});

InstructorList.displayName = 'InstructorList';

export default InstructorList;

