"use client";

import { CityExamNav } from "@/components/city-exam/CityExamNav";
import { Car, Clock } from "lucide-react";

export default function SimulationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <CityExamNav />
      <main className="pt-6 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-16 h-16 bg-[#F03D3D]/10 rounded-2xl flex items-center justify-center mb-6">
            <Car className="w-8 h-8 text-[#F03D3D]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">სიმულაციები</h1>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">მალე</span>
          </div>
          <p className="text-gray-500 max-w-sm">
            ინტერაქტიული სიმულაციები მალე დაემატება. გთხოვთ, მოგვიანებით შეამოწმოთ.
          </p>
        </div>
      </main>
    </div>
  );
}
