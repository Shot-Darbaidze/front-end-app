import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის სიმულაციები | Instruktori.ge",
  },
  description:
    "ივარჯიშე ქალაქის პრაქტიკული გამოცდის სიმულაციებით.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SimulationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
