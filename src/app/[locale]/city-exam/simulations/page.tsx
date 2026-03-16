"use client";

import React from "react";
import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { SimulationQuiz } from "@/components/city-exam/simulation/SimulationQuiz";
import { CITY_EXAM_SIMULATIONS } from "@/components/city-exam/simulation/simulationData";
import { Car } from "lucide-react";

export default function SimulationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F03D3D]/10 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-[#F03D3D]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">სიმულაციები</h1>
            </div>
            <p className="text-gray-600">
              {CITY_EXAM_SIMULATIONS.length} ინტერაქტიული სიმულაცია მხოლოდ ქალაქის გამოცდისთვის, მათ შორის ოფიციალური 2-კითხვიანი ტექნიკური ვარჯიში
            </p>
          </div>

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <h3 className="font-semibold text-blue-900 text-sm mb-1">როგორ მუშაობს:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• ქალაქის გამოცდა იწყება 2 ტექნიკური კითხვით და ეს ვარჯიშიც უკვე დამატებულია</li>
              <li>• აირჩიეთ ქალაქის გამოცდის რეალური სცენარი ბარათებიდან</li>
              <li>• ზოგი სიმულაცია სალონის ინტერაქციაა, ზოგი კი საგზაო გადაწყვეტილებების ვარჯიში</li>
              <li>• დასრულებული სიმულაციები ინახება პროგრესში და 100%-შიც ითვლება</li>
              <li>• სურვილის შემთხვევაში ჩართეთ mock რეჟიმი: 1 მძიმე ან 12 მსუბუქი = ჩაჭრა</li>
              <li>• თუ გაგიჭირდათ, გამოიყენეთ მინიშნება და სცადეთ თავიდან</li>
            </ul>
          </div>

          {/* Quiz */}
          <SimulationQuiz />
        </div>
      </main>
    </div>
  );
}
