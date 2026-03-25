import AutoschoolProfileHeader from "@/components/autoschool-profile/AutoschoolProfileHeader";
import InstructorGrid from "@/components/autoschool-profile/InstructorGrid";
import CoursePackagesSidebar from "@/components/autoschool-profile/CoursePackagesSidebar";
import WorkingHoursCard from "@/components/autoschool-profile/WorkingHoursCard";
import LocationCard from "@/components/instructor-profile/LocationCard";
import CommentSection from "@/components/instructor-profile/CommentSection";
import BackToInstructorsButton from "@/components/instructor-profile/BackToInstructorsButton";
import type { SchoolInstructor } from "@/components/autoschool-profile/InstructorGrid";
import type { CoursePackage } from "@/components/autoschool-profile/CoursePackagesSidebar";

const MOCK_SCHOOL = {
  name: "ავტო სკოლა",
  rating: 4.8,
  reviewCount: 134,
  location: "თბილისი",
  description:
    "ავტო სკოლა 2010 წლიდან ამზადებს მომავალ მძღოლებს. ჩვენი 8 გამოცდილი ინსტრუქტორი, თანამედროვე ავტოპარკი და ინდივიდუალური მიდგომა თითოეულ მოსწავლეს სრულფასოვან მომზადებას სთავაზობს, თეორიული გამოცდიდან პრაქტიკული მართვის ჩაბარებამდე.",
  languages: ["ქართული", "English", "Русский"],
  fleet: [
    "Skoda Rapid",
    "Volkswagen Jetta",
  ],
  instructorCount: 8,
  googleMapsUrl:
    "https://maps.google.com/maps?q=Tbilisi,Georgia&t=&z=13&ie=UTF8&iwloc=&output=embed",
};

const MOCK_PACKAGES: CoursePackage[] = [
  { id: "standard", name: "სტანდარტული", lessons: 8, price: 350, description: "დამწყებთათვის" },
  { id: "intensive", name: "ინტენსიური", lessons: 12, price: 450, originalPrice: 600, popular: true, description: "ყველაზე პოპულარული" },
  { id: "vip", name: "VIP", lessons: 20, price: 620, description: "ინდივიდუალური გრაფიკი" },
];

const MOCK_SCHEDULE = [
  { days: "ორშ - პარ", hours: "09:00 - 20:00" },
  { days: "შაბათი", hours: "10:00 -17:00" },
  { days: "კვირა", hours: "", closed: true },
];

const MOCK_INSTRUCTORS: SchoolInstructor[] = [
  { id: "1", name: "გიორგი მ.", rating: 4.9, transmission: "Manual", price: 55 },
  { id: "2", name: "ნინო კ.", rating: 4.7, transmission: "Automatic", price: 60 },
  { id: "3", name: "დავით ლ.", rating: 4.8, transmission: "Manual / Auto", price: 50 },
  { id: "4", name: "ანა ბ.", rating: 4.6, transmission: "Automatic", price: 65 },
  { id: "5", name: "ლუკა თ.", rating: 4.9, transmission: "Manual", price: 55 },
  { id: "6", name: "მარიამ გ.", rating: 4.7, transmission: "Manual", price: 50 },
];

export default async function AutoschoolProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return (
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
              name={MOCK_SCHOOL.name}
              rating={MOCK_SCHOOL.rating}
              reviewCount={MOCK_SCHOOL.reviewCount}
              location={MOCK_SCHOOL.location}
              description={MOCK_SCHOOL.description}
              languages={MOCK_SCHOOL.languages}
              fleet={MOCK_SCHOOL.fleet}
              instructorCount={MOCK_SCHOOL.instructorCount}
            />
          </div>

          {/* 2. Sidebar — sticky, col-span-1, spans multiple rows */}
          <div className="order-2 lg:col-span-1 lg:row-span-3 space-y-6">
            <CoursePackagesSidebar
              packages={MOCK_PACKAGES}
              bookingHref={`/${locale}/autoschools/${id}/book`}
            />
            <WorkingHoursCard
              schedule={MOCK_SCHEDULE}
              phone="+995 555 123 456"
              email="info@tbilisidrivingschool.ge"
            />
            <LocationCard
              location={MOCK_SCHOOL.location}
              googleMapsUrl={MOCK_SCHOOL.googleMapsUrl}
              locale={locale}
            />
          </div>

          {/* 3. Instructors Grid — col-span-2 */}
          <div className="order-3 lg:col-span-2">
            <InstructorGrid instructors={MOCK_INSTRUCTORS} />
          </div>

          {/* 4. Reviews — col-span-2 */}
          <div className="order-4 lg:col-span-2">
            <CommentSection postId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
