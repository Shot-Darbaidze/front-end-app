"use client";

import React, { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCityExamProgress } from "../mastery/useCityExamMastery";
import { TechnicalQuestionsSimulation } from "./TechnicalQuestionsSimulation";
import { HotspotSimulationPlayer } from "./HotspotSimulationPlayer";
import { DecisionSimulationPlayer } from "./DecisionSimulationPlayer";
import { DifficultyBadge } from "./SimulationShared";
import {
  CITY_EXAM_SIMULATIONS,
  type CityExamSimulation,
} from "./simulationData";
import type { SimulationMode, SimulationResult } from "./simulationTypes";
import { getSimulationFormatLabel, getSimulationItemCount, getSimulationItemLabel } from "./simulationTypes";

const SimulationPlayer = ({
  simulation,
  mode,
  onComplete,
}: {
  simulation: CityExamSimulation;
  mode: SimulationMode;
  onComplete: (result: SimulationResult) => void;
}) => {
  if (simulation.type === "hotspot") {
    return (
      <HotspotSimulationPlayer
        simulation={simulation}
        mode={mode}
        onComplete={onComplete}
      />
    );
  }

  if (simulation.type === "technical") {
    return (
      <TechnicalQuestionsSimulation
        questions={simulation.questions}
        sourceUrl={simulation.sourceUrl ?? ""}
        onComplete={(result) =>
          onComplete({
            ...result,
            mode: "practice",
          })
        }
      />
    );
  }

  return (
    <DecisionSimulationPlayer
      simulation={simulation}
      mode={mode}
      onComplete={onComplete}
    />
  );
};

export const SimulationQuiz = () => {
  const searchParams = useSearchParams();
  const simParam = searchParams.get("sim");
  const initialSimId =
    (simParam && CITY_EXAM_SIMULATIONS.find((s) => s.id === simParam)?.id) ||
    CITY_EXAM_SIMULATIONS[0].id;
  const [selectedSimulationId, setSelectedSimulationId] = useState(initialSimId);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("practice");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const { getToken, isSignedIn } = useAuth();
  const {
    progressState,
    isSyncing,
    recordSimulationResult,
    recordMockSimulationResult,
    resetProgress,
  } = useCityExamProgress(getToken);

  const selectedSimulation =
    CITY_EXAM_SIMULATIONS.find((simulation) => simulation.id === selectedSimulationId) ??
    CITY_EXAM_SIMULATIONS[0];
  const firstMockReadySimulation =
    CITY_EXAM_SIMULATIONS.find((simulation) => simulation.type !== "technical") ??
    CITY_EXAM_SIMULATIONS[0];
  const selectedProgress = progressState.simulations[selectedSimulation.id];
  const effectiveMode =
    selectedSimulation.type === "technical" ? "practice" : simulationMode;
  const completedCount = CITY_EXAM_SIMULATIONS.filter(
    (simulation) => (progressState.simulations[simulation.id]?.completions ?? 0) > 0
  ).length;
  const mockPassedCount = CITY_EXAM_SIMULATIONS.filter(
    (simulation) =>
      progressState.simulations[simulation.id]?.lastMockOutcome === "passed"
  ).length;

  const handleSimulationComplete = (result: SimulationResult) => {
    const shouldCountAsCompletedSimulation =
      result.mode === "practice" || result.mockSummary?.outcome === "passed";

    if (shouldCountAsCompletedSimulation) {
      recordSimulationResult(selectedSimulation.id, {
        score: result.score,
        mistakes: result.mistakes,
      });
    }

    if (result.mode === "mock" && result.mockSummary) {
      recordMockSimulationResult(selectedSimulation.id, {
        score: result.score,
        outcome: result.mockSummary.outcome,
        lightErrors: result.mockSummary.lightErrors,
        heavyErrors: result.mockSummary.heavyErrors,
        disqualified: result.mockSummary.disqualified,
        failureReason: result.mockSummary.failureReason,
      });
    }
  };

  const handleSelectSimulation = useCallback((simulationId: string) => {
    setSelectedSimulationId(simulationId);
    requestAnimationFrame(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleActivateMockMode = () => {
    setSimulationMode("mock");

    if (selectedSimulation.type === "technical") {
      handleSelectSimulation(firstMockReadySimulation.id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F03D3D] mb-2">
              ეტაპი II მხოლოდ
            </p>
            <h2 className="text-2xl font-bold text-gray-900">აირჩიეთ ქალაქის გამოცდის სიმულაცია</h2>
            <p className="text-gray-600 mt-2 max-w-3xl">
              ტექნიკური კითხვების ბლოკი და ქალაქის სცენარები ერთ სივრცეშია.
              სიმულაციების დასრულება ინახება პროგრესში, ხოლო mock რეჟიმი ამატებს
              მსუბუქი და მძიმე შეცდომების ჩაჭრის ლოგიკას.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-xl bg-red-50 px-4 py-3 border border-red-100">
              <p className="text-2xl font-bold text-[#F03D3D]">{CITY_EXAM_SIMULATIONS.length}</p>
              <p className="text-xs text-gray-600">სიმულაცია</p>
            </div>
            <div className="rounded-xl bg-green-50 px-4 py-3 border border-green-100">
              <p className="text-2xl font-bold text-green-700">{completedCount}</p>
              <p className="text-xs text-gray-600">დასრულებული</p>
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-3 border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{mockPassedCount}</p>
              <p className="text-xs text-gray-600">mock passed</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">II</p>
              <p className="text-xs text-gray-600">ეტაპი</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {isSignedIn && (
              <span className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                {isSyncing ? 'სინქრონიზაცია...' : 'სერვერზე შენახული'}
              </span>
            )}
          </div>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              პროგრესის წაშლა
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">დარწმუნებული ხართ?</span>
              <button
                onClick={async () => {
                  await resetProgress();
                  setShowClearConfirm(false);
                }}
                className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                წაშლა
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F03D3D] mb-2">
              შეფასების რეჟიმი
            </p>
            <h3 className="text-xl font-bold text-gray-900">სწავლა ან mock გამოცდა</h3>
            <p className="text-gray-600 mt-2">
              სასწავლო რეჟიმში შეგიძლია თავისუფლად ივარჯიშო. Mock რეჟიმი იმავე
              სცენარს აფასებს როგორც გამოცდას: `1` მძიმე, `12` მსუბუქი ან
              დისკვალიფიკაცია ნიშნავს ჩაჭრას.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => setSimulationMode("practice")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  effectiveMode === "practice"
                    ? "bg-[#F03D3D] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                სასწავლო რეჟიმი
              </button>
              <button
                onClick={handleActivateMockMode}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  effectiveMode === "mock"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                mock გამოცდა
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 min-w-[280px]">
            <p className="text-sm font-semibold text-amber-900">აქტიური წესი</p>
            <p className="text-sm text-amber-800 mt-2">
              {selectedSimulation.type === "technical"
                ? "ტექნიკური კითხვები რჩება სასწავლო რეჟიმში, რადგან აქ mock ჩაჭრის ლოგიკა არ გამოიყენება."
                : effectiveMode === "mock"
                  ? "ახლა ჩართულია mock შეფასება: მსუბუქი/მძიმე შეცდომები ითვლება და შეიძლება სცენარი მყისიერად დასრულდეს."
                  : "ახლა ჩართულია სასწავლო რეჟიმი: შეგიძლია სცადო, ნახო მინიშნება და თავიდან გაიარო."}
            </p>
          </div>
        </div>
      </div>

      <div ref={playerSectionRef} className="scroll-mt-24 space-y-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F03D3D] mb-2">
                არჩეული სცენარი
              </p>
              <h3 className="text-2xl font-bold text-gray-900">{selectedSimulation.title}</h3>
              <p className="text-gray-600 mt-2">{selectedSimulation.summary}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                <DifficultyBadge difficulty={selectedSimulation.difficulty} />
                <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {getSimulationFormatLabel(selectedSimulation)}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {getSimulationItemCount(selectedSimulation)} {getSimulationItemLabel(selectedSimulation)}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  რეჟიმი: {effectiveMode === "mock" ? "mock" : "სწავლა"}
                </span>
              </div>

              {selectedSimulation.sourceUrl ? (
                <a
                  href={selectedSimulation.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 mt-4"
                >
                  {selectedSimulation.sourceLabel ?? "ოფიციალური წყარო"}
                </a>
              ) : null}
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 min-w-[280px]">
              <p className="text-sm font-semibold text-gray-800">
                {selectedProgress ? "ბოლო შენახული შედეგები" : "რას ავარჯიშებთ"}
              </p>

              {selectedProgress?.lastScore != null ? (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{selectedProgress.lastScore}%</p>
                    <p className="text-xs text-gray-500">ბოლო ქულა</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{selectedProgress.lastMistakes ?? 0}</p>
                    <p className="text-xs text-gray-500">
                      {selectedSimulation.type === "technical" ? "გასამეორებელი" : "შეცდომა"}
                    </p>
                  </div>
                </div>
              ) : null}

              {selectedProgress?.lastMockOutcome ? (
                <div
                  className={`rounded-xl border mt-4 p-4 ${
                    selectedProgress.lastMockOutcome === "passed"
                      ? "border-blue-200 bg-blue-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      selectedProgress.lastMockOutcome === "passed"
                        ? "text-blue-900"
                        : "text-red-900"
                    }`}
                  >
                    ბოლო mock:{" "}
                    {selectedProgress.lastMockOutcome === "passed"
                      ? "ჩაბარებული"
                      : "ჩაჭრილი"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      selectedProgress.lastMockOutcome === "passed"
                        ? "text-blue-800"
                        : "text-red-800"
                    }`}
                  >
                    მსუბუქი: {selectedProgress.lastMockLightErrors ?? 0} • მძიმე:{" "}
                    {selectedProgress.lastMockHeavyErrors ?? 0}
                    {selectedProgress.lastMockDisqualified ? " • DQ" : ""}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSimulation.focusPoints.map((focusPoint) => (
                  <span
                    key={focusPoint}
                    className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600"
                  >
                    {focusPoint}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SimulationPlayer
          key={`${selectedSimulation.id}-${effectiveMode}`}
          simulation={selectedSimulation}
          mode={effectiveMode}
          onComplete={handleSimulationComplete}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CITY_EXAM_SIMULATIONS.map((simulation) => {
          const isActive = simulation.id === selectedSimulation.id;
          const simulationProgress = progressState.simulations[simulation.id];

          return (
            <button
              key={simulation.id}
              onClick={() => handleSelectSimulation(simulation.id)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                isActive
                  ? "border-[#F03D3D] bg-red-50 shadow-sm shadow-red-100"
                  : "border-gray-200 bg-white hover:border-[#F03D3D]/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    {simulation.category}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 leading-6">{simulation.title}</h3>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {simulationProgress?.lastScore != null ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {simulationProgress.lastScore}%
                    </span>
                  ) : null}
                  {simulationProgress?.lastMockOutcome ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        simulationProgress.lastMockOutcome === "passed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {simulationProgress.lastMockOutcome === "passed"
                        ? "mock pass"
                        : "mock fail"}
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-3 leading-6">{simulation.summary}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                <DifficultyBadge difficulty={simulation.difficulty} />
                <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {getSimulationItemCount(simulation)} {getSimulationItemLabel(simulation)}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {simulation.estimatedMinutes} წთ
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
