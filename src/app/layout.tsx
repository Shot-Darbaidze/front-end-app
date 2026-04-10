import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { reportWebVitals as webVitalsReporter } from "./web-vitals";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://instruktori.ge'),
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
      {children}
    </ClerkProvider>
  );
}

export function reportWebVitals(metric: any) {
  webVitalsReporter(metric);
}
