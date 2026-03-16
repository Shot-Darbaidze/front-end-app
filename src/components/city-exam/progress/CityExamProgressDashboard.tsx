"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, MapPin, Route, Target, Trophy } from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useCityExamProgress } from "../mastery/useCityExamMastery";
import { getCityRoutes, CITIES } from "../routes/routeData";
import { CITY_EXAM_SIMULATIONS } from "../simulation/simulationData";

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Target;
  tone: "red" | "green" | "blue" | "amber";
}) => {
  const toneClass =
    tone === "red"
      ? "bg-red-50 border-red-100 text-[#F03D3D]"
      : tone === "green"
        ? "bg-green-50 border-green-100 text-green-700"
        : tone === "blue"
          ? "bg-blue-50 border-blue-100 text-blue-700"
          : "bg-amber-50 border-amber-100 text-amber-700";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
};

export const CityExamProgressDashboard = () => {
  const localeHref = useLocaleHref();
  const { progressState, setSelectedCityId } = useCityExamProgress();
  const selectedCity =
    CITIES.find((city) => city.id === progressState.selectedCityId) ?? CITIES[0];
  const cityRoutes = getCityRoutes(selectedCity);
  const completedRouteNumbers = (
    progressState.routes[selectedCity.id]?.completedRouteNumbers ?? []
  ).filter((routeNumber) => selectedCity.routeNumbers.includes(routeNumber));
  const completedRoutesCount = completedRouteNumbers.length;
  const selectedCityRouteTotal = selectedCity.routeNumbers.length;
  const completedSimulationCount = CITY_EXAM_SIMULATIONS.filter(
    (simulation) => (progressState.simulations[simulation.id]?.completions ?? 0) > 0
  ).length;
  const masteredSimulationCount = CITY_EXAM_SIMULATIONS.filter((simulation) => {
    const progress = progressState.simulations[simulation.id];

    return progress && (progress.bestScore ?? 0) >= 95 && progress.completions >= 2;
  }).length;
  const totalChecklistItems = CITY_EXAM_SIMULATIONS.length + selectedCityRouteTotal;
  const completedChecklistItems = completedSimulationCount + completedRoutesCount;
  const overallProgressPercent = Math.round(
    (completedChecklistItems / totalChecklistItems) * 100
  );
  const remainingSimulations = CITY_EXAM_SIMULATIONS.filter(
    (simulation) => (progressState.simulations[simulation.id]?.completions ?? 0) === 0
  );
  const remainingRoutes = cityRoutes.filter(
    (route) => !completedRouteNumbers.includes(route.routeNumber)
  );

  useEffect(() => {
    if (!progressState.selectedCityId) {
      setSelectedCityId(CITIES[0].id);
    }
  }, [progressState.selectedCityId, setSelectedCityId]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F03D3D] mb-2">
              Completion Rule
            </p>
            <h2 className="text-3xl font-bold text-gray-900">პროგრესის გვერდი</h2>
            <p className="text-gray-600 mt-2 max-w-3xl">
              100% მიიღება მხოლოდ მაშინ, როცა სტუდენტი დაასრულებს ყველა
              სიმულაციას და არჩეული ქალაქის ყველა მარშრუტს.
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-5 min-w-[250px]">
            <p className="text-sm font-semibold text-green-800">საერთო პროგრესი</p>
            <p className="text-4xl font-bold text-green-700 mt-2">
              {overallProgressPercent}%
            </p>
            <p className="text-sm text-green-700 mt-2">
              {completedChecklistItems}/{totalChecklistItems} სავალდებულო ელემენტი
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F03D3D] via-amber-400 to-green-500 transition-all duration-500"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              არჩეული ქალაქი
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">
              {selectedCity.name}
            </h3>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700 block mb-2">
              რომელი ქალაქისთვის ემზადები?
            </span>
            <select
              value={selectedCity.id}
              onChange={(event) => setSelectedCityId(event.target.value)}
              className="w-full lg:w-[280px] rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#F03D3D] focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20"
            >
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 mt-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Target}
            label="საერთო პროგრესი"
            value={`${overallProgressPercent}%`}
            tone="red"
          />
          <StatCard
            icon={CheckCircle2}
            label="სიმულაციები"
            value={`${completedSimulationCount}/${CITY_EXAM_SIMULATIONS.length}`}
            tone="blue"
          />
          <StatCard
            icon={Route}
            label="მარშრუტები"
            value={`${completedRoutesCount}/${selectedCityRouteTotal}`}
            tone="amber"
          />
          <StatCard
            icon={Trophy}
            label="დამასტერდა"
            value={`${masteredSimulationCount}`}
            tone="green"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                დარჩენილი სიმულაციები
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                {remainingSimulations.length === 0
                  ? "ყველა სიმულაცია დასრულებულია"
                  : `${remainingSimulations.length} სიმულაცია დარჩა`}
              </h3>
            </div>

            <Link
              href={localeHref("/city-exam/simulations")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#F03D3D]/40 hover:text-[#F03D3D]"
            >
              სიმულაციებზე
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {remainingSimulations.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                სიმულაციების ნაწილი დასრულებულია.
              </div>
            ) : (
              remainingSimulations.map((simulation) => (
                <div
                  key={simulation.id}
                  className="rounded-xl border border-gray-200 px-4 py-3"
                >
                  <p className="font-semibold text-gray-900">{simulation.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{simulation.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                დარჩენილი მარშრუტები
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                {remainingRoutes.length === 0
                  ? `${selectedCity.name} სრულად დახურულია`
                  : `${selectedCity.name} — ${remainingRoutes.length} მარშრუტი დარჩა`}
              </h3>
            </div>

            <Link
              href={localeHref("/city-exam/routes")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#F03D3D]/40 hover:text-[#F03D3D]"
            >
              მარშრუტებზე
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {remainingRoutes.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                არჩეული ქალაქის ყველა მარშრუტი დასრულებულია.
              </div>
            ) : (
              remainingRoutes.map((route) => (
                <div
                  key={`${selectedCity.id}-${route.routeNumber}`}
                  className="rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      მარშრუტი {route.routeNumber}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {route.video ? "ვიდეო ხელმისაწვდომია" : "ვიდეო ჯერ არ არის დამატებული"}
                    </p>
                  </div>

                  <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
