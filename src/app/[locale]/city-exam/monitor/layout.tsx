import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის მონიტორი | Instruktori.ge",
  },
  description:
    "თვალყური ადევნე ქალაქის პრაქტიკული გამოცდის განრიგს რეალურ დროში. შეამოწმე თავისუფალი ადგილები და დარეგისტრირდი.",
  alternates: {
    canonical: "/ka/city-exam/monitor",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/monitor",
      en: "https://instruktori.ge/en/city-exam/monitor",
    },
  },
};

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
