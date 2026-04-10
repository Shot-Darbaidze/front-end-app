import { Target } from "lucide-react";
import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { CityExamProgressDashboard } from "@/components/city-exam/progress/CityExamProgressDashboard";

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F03D3D]/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-[#F03D3D]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">პროგრესი</h1>
            </div>
            <p className="text-gray-600">
              100% მიიღება მხოლოდ ყველა სიმულაციის და არჩეული ქალაქის ყველა მარშრუტის დასრულებით
            </p>
          </div>

          <CityExamProgressDashboard />
        </div>
      </main>
    </div>
  );
}
