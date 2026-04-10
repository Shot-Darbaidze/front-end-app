import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის ჩეკლისტი | Instruktori.ge",
  },
  description:
    "ქალაქის პრაქტიკული გამოცდის სრული ჩეკლისტი. დარწმუნდი, რომ მზად ხარ გამოცდისთვის.",
  alternates: {
    canonical: "/ka/city-exam/checklist",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/checklist",
      en: "https://instruktori.ge/en/city-exam/checklist",
    },
  },
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
