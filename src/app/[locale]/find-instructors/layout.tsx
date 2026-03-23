import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "იპოვე მართვის ინსტრუქტორი | შეადარე ფასები და შეფასებები",
  description:
    "დაათვალიერე და შეადარე მართვის ინსტრუქტორები შეფასების, ფასის, ქალაქისა და გადაცემათა კოლოფის ტიპის მიხედვით.",
  openGraph: {
    title: "იპოვე მართვის ინსტრუქტორი",
    description:
      "შეადარე ფასები, შეფასებები და მიმოხილვები, რათა შენთვის სასურველი ინსტრუქტორი იპოვო.",
  },
};

const FindInstructorsLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default FindInstructorsLayout;
