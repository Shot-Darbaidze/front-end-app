import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ავტოსკოლის პარტნიორობა | Instruktori.ge",
  },
  description:
    "დაარეგისტრირე შენი ავტოსკოლა Instruktori.ge-ზე. მართე მოსწავლეები, ინსტრუქტორები და პაკეტები ციფრულ პლატფორმაზე.",
  alternates: {
    canonical: "/ka/for-autoschools",
    languages: {
      ka: "https://instruktori.ge/ka/for-autoschools",
      en: "https://instruktori.ge/en/for-autoschools",
    },
  },
};

export default function ForAutoschoolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
