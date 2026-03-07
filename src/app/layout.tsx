import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import VercelAnalytics from "./analytics";
import { reportWebVitals } from "./web-vitals";

const inter = localFont({
  src: [
    {
      path: "./fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
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
    locale: "ka_GE",
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
      <html>
        <body className={`${inter.variable} font-sans font-medium antialiased`}>
          {children}
          <VercelAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

export function reportWebVitals(metric: any) {
  reportWebVitals(metric);
}
