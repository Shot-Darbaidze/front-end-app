import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის მარშრუტები | Instruktori.ge",
  },
  description:
    "ქალაქის პრაქტიკული გამოცდის მარშრუტები ვიდეოებით. იცოდე შენი ქალაქის მარშრუტი გამოცდამდე.",
  alternates: {
    canonical: "/ka/city-exam/routes",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/routes",
      en: "https://instruktori.ge/en/city-exam/routes",
    },
  },
};

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
