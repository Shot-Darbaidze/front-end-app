import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის სიმულაციები | Instruktori.ge",
  },
  description:
    "ივარჯიშე ქალაქის პრაქტიკული გამოცდის სიმულაციებით.",
  alternates: {
    canonical: "/ka/city-exam/simulations",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/simulations",
      en: "https://instruktori.ge/en/city-exam/simulations",
    },
  },
};

export default function SimulationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
