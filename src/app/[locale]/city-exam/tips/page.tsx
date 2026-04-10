import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { BookOpen } from "lucide-react";
import TipsContent from "@/components/city-exam/tips/TipsContent";

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header — server-rendered for SEO */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F03D3D]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#F03D3D]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                რჩევები და ხრიკები
              </h1>
            </div>
            <p className="text-gray-600">
              მოემზადეთ გამოცდისთვის — შეცდომები, ტექნიკები, რეგისტრაცია და
              ყველაფერი, რაც უნდა იცოდეთ
            </p>
          </div>

          {/* Interactive filter + articles */}
          <TipsContent />
        </div>
      </main>
    </div>
  );
}
