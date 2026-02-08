import InstructorCard from "./InstructorCard";

interface Instructor {
  id: string;
  name: string;
  rating: number;
  specialty: string;
  price: number;
  cityPrice?: number | null;
  tags: string[];
  imageUrl?: string;
}

interface InstructorListProps {
  instructors: Instructor[];
  showBothPrices?: boolean;
}

const InstructorList = ({ instructors, showBothPrices = false }: InstructorListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {instructors.map((instructor) => (
        <InstructorCard key={instructor.id} {...instructor} showBothPrices={showBothPrices} />
      ))}
    </div>
  );
};

export default InstructorList;
