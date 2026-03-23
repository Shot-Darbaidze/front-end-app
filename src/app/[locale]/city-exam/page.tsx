import { redirect } from "next/navigation";

export default async function CityExamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/city-exam/monitor`);
}
