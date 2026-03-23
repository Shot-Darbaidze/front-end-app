import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClientProviders from "@/components/providers/ClientProviders";
import { isValidLocale, defaultLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const isKa = locale === "ka";

  const title = isKa ? "Instruktori.ge - მართვის ინსტრუქტორები საქართველოში" : "Instruktori.ge - Find Driving Instructors in Georgia";
  const description = isKa 
    ? "დაუკავშირდით სერტიფიცირებულ მართვის ინსტრუქტორებს მთელ საქართველოში. დაჯავშნეთ გაკვეთილები, შეადარეთ ფასები და ისწავლეთ უსაფრთხოდ მართვა." 
    : "Connect with certified driving instructors across Georgia. Book lessons, compare prices, and learn to drive safely.";
  const keywords = isKa 
    ? ["მართვის ინსტრუქტორი", "ავტოსკოლა", "მართვის მოწმობა", "მართვის გაკვეთილები", "ავტომატიკა", "მექანიკა", "ინსტრუქტორი თბილისში", "მართვის სწავლა"] 
    : [
        "driving instructor",
        "driving lessons",
        "Georgia driving school",
        "learn to drive",
        "driving test preparation",
        "automatic transmission",
        "manual transmission",
        "city driving lessons",
        "driving instructor Tbilisi",
        "driving instructor Batumi",
      ];

  return {
    title: {
      default: title,
      template: `%s | Instruktori.ge`,
    },
    description,
    keywords,
    openGraph: {
      title,
      description,
      locale: isKa ? "ka_GE" : "en_US",
      type: "website",
      siteName: "Instruktori.ge",
    },
    twitter: {
      title,
      description,
    }
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <ClerkProvider>
      <ClientProviders locale={locale}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </ClientProviders>
    </ClerkProvider>
  );
}
