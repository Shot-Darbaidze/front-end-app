import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის რჩევები | Instruktori.ge",
  },
  description:
    "რჩევები და ხრიკები ქალაქის პრაქტიკული გამოცდის წარმატებით ჩასაბარებლად. შეცდომები, შეფასების სისტემა და მომზადების გზამკვლევი.",
  alternates: {
    canonical: "/ka/city-exam/tips",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/tips",
      en: "https://instruktori.ge/en/city-exam/tips",
    },
  },
};

export default function TipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
