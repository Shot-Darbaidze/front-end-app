import type { Metadata } from "next";
import { CITIES } from "@/components/city-exam/routes/routeData";

export const metadata: Metadata = {
  title: {
    absolute: "ქალაქის გამოცდის მარშრუტები | Instruktori.ge",
  },
  description:
    "ქალაქის პრაქტიკული გამოცდის მარშრუტები ვიდეოებით. იცოდე შენი ქალაქის მარშრუტი გამოცდამდე.",
  alternates: {
    canonical: "/ka/city-exam/routes",
    languages: {
      ka: "https://instruktori.ge/ka/city-exam/routes",
      en: "https://instruktori.ge/en/city-exam/routes",
    },
  },
};

const allVideos = CITIES.flatMap((city) =>
  city.videos.map((v) => ({
    '@type': 'VideoObject' as const,
    name: v.title,
    description: `${city.name} — საგამოცდო მარშრუტი N${v.routeNumber}`,
    thumbnailUrl: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
    uploadDate: '2025-01-01',
    contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
  }))
);

const videoListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'საგამოცდო მარშრუტების ვიდეოები',
  itemListElement: allVideos.map((video, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: video,
  })),
};

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoListSchema) }}
      />
      {children}
    </>
  );
}
