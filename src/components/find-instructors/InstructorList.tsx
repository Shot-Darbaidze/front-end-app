import InstructorCard from "./InstructorCard";
import type { InstructorCardData } from "@/types/find-instructors";
import { memo } from "react";

interface InstructorListProps {
  instructors: InstructorCardData[];
  onInstructorClick?: (instructorId: string, position: number) => void;
}

const InstructorList = memo(({ instructors, onInstructorClick }: InstructorListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {instructors.map((instructor, index) => (
        <InstructorCard
          key={instructor.id}
          {...instructor}
          position={index}
          onCardClick={onInstructorClick}
        />
      ))}
    </div>
  );
});

InstructorList.displayName = 'InstructorList';

export default InstructorList;
