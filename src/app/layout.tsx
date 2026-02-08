import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClientProviders from "@/components/providers/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Instruktori.ge - Find Driving Instructors in Georgia",
    template: "%s | Instruktori.ge",
  },
  description:
    "Connect with certified driving instructors across Georgia. Book lessons for city and yard driving, compare prices, and learn to drive safely with experienced professionals.",
  keywords: [
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
  ],
  authors: [
    {
      name: "Instruktori.ge Team",
    },
  ],
  creator: "Instruktori.ge",
  publisher: "Instruktori.ge",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: "Instruktori.ge - Find Driving Instructors in Georgia",
    description:
      "Connect with certified driving instructors across Georgia. Book lessons, compare prices, and learn to drive safely.",
    siteName: "Instruktori.ge",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instruktori.ge - Find Driving Instructors in Georgia",
    description:
      "Connect with certified driving instructors across Georgia. Book lessons, compare prices, and learn to drive safely.",
    creator: "@instruktori",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-sans font-medium antialiased`}>
          <ClientProviders>
            <Navbar />
            {children}
            <Footer />
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
