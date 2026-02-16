"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const EarningsCalculator = () => {
  const { t } = useLanguage();
  const [hourlyRate, setHourlyRate] = useState(40);
  const [hoursPerWeek, setHoursPerWeek] = useState(25);

  const weeklyEarnings = hourlyRate * hoursPerWeek;
  const monthlyEarnings = weeklyEarnings * 4;
  const yearlyEarnings = weeklyEarnings * 52;

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 text-left">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[#F03D3D]" />
        {t("calculator.title")}
      </h3>

      <div className="space-y-6 mb-8">
        {/* Hourly Rate Input */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-600">{t("calculator.hourlyRate")}</label>
            <span className="text-sm font-bold text-gray-900">₾{hourlyRate}/hr</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#F03D3D] [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F03D3D] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#F03D3D] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>₾20</span>
            <span>₾100</span>
          </div>
        </div>

        {/* Hours Per Week Input */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-600">{t("calculator.hoursPerWeek")}</label>
            <span className="text-sm font-bold text-gray-900">{hoursPerWeek} hrs</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#F03D3D] [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F03D3D] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#F03D3D] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>5 hrs</span>
            <span>60 hrs</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-gray-600 text-sm">{t("calculator.weeklyIncome")}</span>
          <span className="font-bold text-gray-900 text-lg">₾{weeklyEarnings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-gray-600 text-sm">{t("calculator.monthlyIncome")}</span>
          <span className="font-bold text-gray-900 text-lg">₾{monthlyEarnings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-gray-900 font-medium">{t("calculator.yearlyPotential")}</span>
          <span className="font-bold text-[#F03D3D] text-2xl">₾{yearlyEarnings.toLocaleString()}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mt-4 text-center">
        {t("calculator.disclaimer")}
      </p>
    </div>
  );
};

export default EarningsCalculator;
