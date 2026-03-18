"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CITIES, getCityRoutes, type City } from "./routeData";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MapPin,
  Play,
  Video,
} from "lucide-react";
import { useCityExamProgress } from "../mastery/useCityExamMastery";

export const RouteVideos = () => {
  const searchParams = useSearchParams();
  const routeParam = searchParams.get("route");
  const { progressState, setSelectedCityId, toggleRouteCompleted } =
    useCityExamProgress();
  const selectedCity =
    CITIES.find((city) => city.id === progressState.selectedCityId) ?? CITIES[0];
  const cityRoutes = getCityRoutes(selectedCity);
  const routeFromParam = routeParam
    ? cityRoutes.find((r) => r.routeNumber === Number(routeParam))
    : null;
  const [activeVideo, setActiveVideo] = useState<string | null>(
    routeFromParam?.video?.youtubeId ?? selectedCity.videos[0]?.youtubeId ?? null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const routeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (routeFromParam && routeRef.current) {
      routeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [routeFromParam]);
  const completedRouteNumbers = (
    progressState.routes[selectedCity.id]?.completedRouteNumbers ?? []
  ).filter((routeNumber) => selectedCity.routeNumbers.includes(routeNumber));
  const completedRoutesCount = completedRouteNumbers.length;
  const selectedCityRouteTotal = selectedCity.routeNumbers.length;
  const routeCompletionPercent = Math.round(
    (completedRoutesCount / selectedCityRouteTotal) * 100
  );

  useEffect(() => {
    if (!progressState.selectedCityId) {
      setSelectedCityId(CITIES[0].id);
    }
  }, [progressState.selectedCityId, setSelectedCityId]);

  useEffect(() => {
    if (
      activeVideo &&
      selectedCity.videos.some((video) => video.youtubeId === activeVideo)
    ) {
      return;
    }

    setActiveVideo(selectedCity.videos[0]?.youtubeId ?? null);
  }, [activeVideo, selectedCity]);

  const handleCitySelect = (city: City) => {
    setSelectedCityId(city.id);
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F03D3D]/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-[#F03D3D]" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">{selectedCity.name}</p>
              <p className="text-xs text-gray-500">
                {selectedCityRouteTotal} მარშრუტი • {completedRoutesCount} დასრულებული
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {CITIES.map((city) => {
              const cityCompletedRoutes = (
                progressState.routes[city.id]?.completedRouteNumbers ?? []
              ).filter((routeNumber) => city.routeNumbers.includes(routeNumber)).length;

              return (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedCity.id === city.id ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin
                      className={`w-4 h-4 ${
                        selectedCity.id === city.id
                          ? "text-[#F03D3D]"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        selectedCity.id === city.id
                          ? "text-[#F03D3D]"
                          : "text-gray-700"
                      }`}
                    >
                      {city.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {cityCompletedRoutes}/{city.routeNumbers.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F03D3D] mb-2">
              არჩეული ქალაქი
            </p>
            <h3 className="text-2xl font-bold text-gray-900">{selectedCity.name}</h3>
            <p className="text-gray-600 mt-2">
              100%-მდე მისასვლელად ამ ქალაქის ყველა მარშრუტი უნდა მონიშნოთ დასრულებულად.
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 min-w-[220px]">
            <p className="text-sm font-semibold text-green-800">მარშრუტების პროგრესი</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {completedRoutesCount}/{selectedCityRouteTotal}
            </p>
            <p className="text-sm text-green-700 mt-1">{routeCompletionPercent}% დასრულებული</p>
          </div>
        </div>

        <div className="mt-5 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F03D3D] to-green-500 transition-all duration-500"
            style={{ width: `${routeCompletionPercent}%` }}
          />
        </div>
      </div>

      {activeVideo ? (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
          <div className="relative w-full aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?rel=0`}
              title="Exam route video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">ვიდეო ჯერ არ არის დამატებული</h3>
          <p className="text-sm text-gray-500">
            მარშრუტები მაინც შეგიძლიათ მონიშნოთ დასრულებულად, თუ რუკით და ქუჩების სიით უკვე გაიარეთ.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          მარშრუტები — {selectedCity.name}
        </h3>

        {cityRoutes.map((route) => {
          const isCompleted = completedRouteNumbers.includes(route.routeNumber);
          const isActive = route.video?.youtubeId === activeVideo;

          return (
            <div
              key={`${selectedCity.id}-${route.routeNumber}`}
              ref={routeFromParam?.routeNumber === route.routeNumber ? routeRef : undefined}
              className={`rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-[#F03D3D] bg-red-50/40"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    მარშრუტი {route.routeNumber}
                  </p>
                  <p className="font-semibold text-gray-900 mt-2">
                    {route.video?.title ?? `${selectedCity.name} — მარშრუტი ${route.routeNumber}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {route.video
                      ? `${route.video.channel}${route.video.duration ? ` • ${route.video.duration}` : ""}`
                      : "ვიდეო არ არის დამატებული, გამოიყენეთ ოფიციალური რუკა"}
                  </p>
                </div>

                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    დასრულებულია
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {route.video ? (
                    <button
                      onClick={() => setActiveVideo(route.video!.youtubeId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#F03D3D]/40 hover:text-[#F03D3D]"
                    >
                      <Play className="w-4 h-4" />
                      ვიდეოს გახსნა
                    </button>
                  ) : null}

                  {route.video ? (
                    <a
                      href={`https://www.youtube.com/watch?v=${route.video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                    >
                      <ExternalLink className="w-4 h-4" />
                      YouTube
                    </a>
                  ) : null}
                </div>

                <button
                  onClick={() => toggleRouteCompleted(selectedCity.id, route.routeNumber)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-[#F03D3D] text-white hover:bg-red-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompleted ? "მონიშვნის მოხსნა" : "დასრულებულად მონიშვნა"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">
              ოფიციალური მარშრუტების რუკა
            </p>
            <p className="text-sm text-blue-800 mb-2">
              სერვისების სააგენტოს ვებგვერდზე ხელმისაწვდომია ყველა ქალაქის
              საგამოცდო მარშრუტის რუკა და ქუჩების სია.
            </p>
            <a
              href="https://www.sa.gov.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              sa.gov.ge — მარშრუტები
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
