import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ჩემი პროგრესი | Instruktori.ge",
  },
  description:
    "თვალყური ადევნე შენს სწავლის პროგრესს და მომზადებას ქალაქის გამოცდისთვის.",
  alternates: {
    canonical: "/ka/city-exam/progress",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/progress",
      en: "https://instruktori.ge/en/city-exam/progress",
    },
  },
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
