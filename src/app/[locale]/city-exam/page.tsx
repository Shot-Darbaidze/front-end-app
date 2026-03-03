"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useExamMonitor, CITY_CENTERS } from "@/hooks/useExamMonitor";
import { Bell, MapPin, Play, Square, AlertCircle, CheckCircle } from "lucide-react";

const CityExamPage = () => {
  const { user: _user, isLoaded } = useUser();
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const {
    isMonitoring,
    availableSlots,
    newSlotsNotification,
    startMonitoring,
    stopMonitoring,
    clearNotification,
    isLoading,
    error,
  } = useExamMonitor();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#F03D3D] border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleStartMonitoring = () => {
    if (selectedCity) {
      startMonitoring(selectedCity);
    }
  };

  const cityOptions = Object.entries(CITY_CENTERS).map(([id, name]) => ({
    id: parseInt(id),
    name,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            City Exam Monitor
          </h1>
          <p className="text-gray-600">
            Monitor available exam slots and receive notifications when they open
          </p>
        </div>

        {/* Notification Alert */}
        {newSlotsNotification && (
          <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-pulse">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-green-900">
                  🎉 New Exam Slots Available!
                </h3>
                <p className="text-green-800 mt-1">
                  {newSlotsNotification.map((slot) => slot.bookingDate).join(", ")}
                </p>
                <button
                  onClick={clearNotification}
                  className="text-sm text-green-700 hover:text-green-900 mt-2 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">Error</h3>
                <p className="text-red-800 mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Control Panel */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* City Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-[#F03D3D]" />
                  Select City
                </div>
              </label>
              <select
                value={selectedCity ?? ""}
                onChange={(e) => setSelectedCity(parseInt(e.target.value) || null)}
                disabled={isMonitoring}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F03D3D] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Choose a city...</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {isMonitoring && selectedCity && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✓ Monitoring {CITY_CENTERS[selectedCity as keyof typeof CITY_CENTERS]}
                </p>
              )}
            </div>

            {/* Status Display */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-[#F03D3D]" />
                  Monitoring Status
                </div>
              </label>
              <div className={`w-full px-4 py-3 border-2 rounded-lg text-center font-medium ${
                isMonitoring
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 bg-gray-50 text-gray-600"
              }`}>
                {isMonitoring ? "🟢 Monitoring Active" : "🔴 Not Monitoring"}
              </div>
              {isLoading && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  Loading slots...
                </p>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleStartMonitoring}
              disabled={!selectedCity || isMonitoring}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#F03D3D] text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Monitoring
            </button>
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop Monitoring
            </button>
          </div>
        </div>

        {/* Available Slots Display */}
        {availableSlots.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Available Exam Dates ({availableSlots.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot) => (
                <div
                  key={slot.bookingDate}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center"
                >
                  <p className="text-sm text-blue-600 font-medium">Available</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(slot.bookingDate).toLocaleDateString("ka-GE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 How it works:
          </h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Select your preferred city</li>
            <li>• Click &quot;Start Monitoring&quot; to begin checking for available slots</li>
            <li>• You&apos;ll receive a notification when new exam dates open</li>
            <li>• Check the console (F12) for detailed monitoring logs</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default CityExamPage;
