import { CityExamNav } from "@/components/city-exam/CityExamNav";
import CityExamMonitorClient from "@/components/city-exam/monitor/CityExamMonitorClient";

export default function CityExamMonitorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6">
        <div className="max-w-4xl mx-auto px-6">
          {/* SSR-visible header for crawlers */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ქალაქის გამოცდის მონიტორი
            </h1>
            <p className="text-gray-600">
              აკონტროლე თავისუფალი საგამოცდო სლოტები და მიიღე შეტყობინება მათი გახსნისთანავე
            </p>
          </div>

          {/* Interactive client content */}
          <CityExamMonitorClient />
        </div>
      </main>
    </div>
  );
}
