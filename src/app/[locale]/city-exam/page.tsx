import { permanentRedirect } from "next/navigation";

export default async function CityExamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/city-exam/monitor`);
}
