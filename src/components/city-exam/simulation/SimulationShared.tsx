"use client";

import React from "react";
import { CheckCircle, Lightbulb, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { CityExamSimulation } from "./simulationData";
import type { FeedbackState, MockCounters, SimulationMode, SimulationResult } from "./simulationTypes";
import { LIGHT_ERROR_LIMIT, getMockSummaryText } from "./simulationTypes";

export const DifficultyBadge = ({ difficulty }: { difficulty: CityExamSimulation["difficulty"] }) => {
  const badgeClass =
    difficulty === "დამწყები"
      ? "bg-green-50 text-green-700 border-green-200"
      : difficulty === "საშუალო"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
      {difficulty}
    </span>
  );
};

export const ResultsCard = ({
  result,
  mistakeLabel,
  onReset,
}: {
  result: SimulationResult;
  mistakeLabel: string;
  onReset: () => void;
}) => {
  const mockSummary = result.mode === "mock" ? result.mockSummary ?? null : null;
  const isMock = mockSummary !== null;
  const isPassed = isMock ? mockSummary.outcome === "passed" : true;
  const accentClass = isPassed
    ? "bg-green-100 text-green-600"
    : "bg-red-100 text-red-600";
  const title = isMock
    ? isPassed
      ? "Mock გამოცდა ჩაბარებულია"
      : "Mock გამოცდა ჩაჭრილია"
    : "სიმულაცია დასრულებულია!";
  const subtitle = isMock
    ? getMockSummaryText(mockSummary)
    : "თქვენ წარმატებით დაასრულეთ სცენარი";

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${accentClass}`}>
        {isPassed ? (
          <Trophy className="w-10 h-10" />
        ) : (
          <XCircle className="w-10 h-10" />
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{subtitle}</p>

      {isMock ? (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{result.score}%</p>
            <p className="text-sm text-gray-500">ქულა</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-700">{mockSummary.lightErrors}</p>
            <p className="text-sm text-amber-700">მსუბუქი</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-700">{mockSummary.heavyErrors}</p>
            <p className="text-sm text-red-700">მძიმე</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-bold text-blue-700">
              {mockSummary.disqualified
                ? "დისკვალიფიკაცია"
                : isPassed
                  ? "ჩაბარებულია"
                  : "ჩაჭრილია"}
            </p>
            <p className="text-sm text-blue-700 mt-1">სტატუსი</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{result.score}%</p>
            <p className="text-sm text-green-600">ქულა</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-700">{result.mistakes}</p>
            <p className="text-sm text-red-600">{mistakeLabel}</p>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#F03D3D] text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
      >
        <RotateCcw className="w-5 h-5" />
        თავიდან დაწყება
      </button>
    </div>
  );
};

export const ProgressCard = ({
  currentStepIndex,
  totalSteps,
  mistakes,
  mode,
  mockCounters,
}: {
  currentStepIndex: number;
  totalSteps: number;
  mistakes: number;
  mode: SimulationMode;
  mockCounters?: MockCounters;
}) => {
  const progress = (currentStepIndex / totalSteps) * 100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-sm font-semibold text-gray-700">
          ნაბიჯი {currentStepIndex + 1} / {totalSteps}
        </span>
        {mode === "mock" && mockCounters ? (
          <span className="text-sm text-gray-500">
            მსუბუქი: {mockCounters.lightErrors}/{LIGHT_ERROR_LIMIT} • მძიმე:{" "}
            {mockCounters.heavyErrors}
            {mockCounters.disqualified ? " • DQ" : ""}
          </span>
        ) : (
          <span className="text-sm text-gray-500">შეცდომები: {mistakes}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-[#F03D3D] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const FeedbackBanner = ({ feedback }: { feedback: FeedbackState | null }) => {
  if (!feedback) return null;

  return (
    <div
      className={`rounded-xl p-4 flex items-center gap-3 transition-all duration-300 ${
        feedback.type === "correct"
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      {feedback.type === "correct" ? (
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <p
        className={`font-medium text-sm ${
          feedback.type === "correct" ? "text-green-800" : "text-red-800"
        }`}
      >
        {feedback.message}
      </p>
    </div>
  );
};

export const HintToggle = ({
  showHint,
  onToggle,
  hint,
}: {
  showHint: boolean;
  onToggle: () => void;
  hint: string;
}) => (
  <>
    <button
      onClick={onToggle}
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
    >
      <Lightbulb className="w-4 h-4" />
      {showHint ? "მინიშნების დამალვა" : "მინიშნება"}
    </button>

    {showHint && (
      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-200">
        {hint}
      </div>
    )}
  </>
);
