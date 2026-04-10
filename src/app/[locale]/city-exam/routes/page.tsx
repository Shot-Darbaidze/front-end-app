import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { RouteVideos } from "@/components/city-exam/routes/RouteVideos";
import { MapPin } from "lucide-react";

export default function RoutesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F03D3D]/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#F03D3D]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">მარშრუტები</h1>
            </div>
            <p className="text-gray-600">
              საგამოცდო მარშრუტების ვიდეოები ქალაქების მიხედვით — ნახეთ რეალური
              მარშრუტები გამოცდამდე
            </p>
          </div>

          {/* Route Videos */}
          <RouteVideos />
        </div>
      </main>
    </div>
  );
}
