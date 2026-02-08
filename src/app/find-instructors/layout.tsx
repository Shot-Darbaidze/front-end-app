import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Driving Instructors | Compare Ratings & Prices",
  description:
    "Browse and compare driving instructors by rating, price, city, and transmission type. Find the perfect match for your learning journey.",
  openGraph: {
    title: "Find Driving Instructors",
    description:
      "Compare ratings, prices, and reviews to find the best driving instructor for you.",
  },
};

const FindInstructorsLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default FindInstructorsLayout;
