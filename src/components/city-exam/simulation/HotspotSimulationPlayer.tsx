"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { HotspotSimulation } from "./simulationData";
import type { FeedbackState, MockCounters, SimulationMode, SimulationResult } from "./simulationTypes";
import {
  LIGHT_ERROR_LIMIT,
  buildMockResult,
  buildPracticeResult,
  calculateScore,
  getMockPenaltyLabel,
} from "./simulationTypes";
import { FeedbackBanner, HintToggle, ProgressCard, ResultsCard } from "./SimulationShared";
import { FabiaInterior } from "./FabiaInterior";

export const HotspotSimulationPlayer = ({
  simulation,
  mode,
  onComplete,
}: {
  simulation: HotspotSimulation;
  mode: SimulationMode;
  onComplete: (result: SimulationResult) => void;
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedHotspots, setCompletedHotspots] = useState<string[]>([]);
  const [wrongHotspot, setWrongHotspot] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [mockCounters, setMockCounters] = useState<MockCounters>({
    lightErrors: 0,
    heavyErrors: 0,
    disqualified: false,
  });
  const [completedResult, setCompletedResult] = useState<SimulationResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const currentStep = simulation.steps[currentStepIndex];
  const totalSteps = simulation.steps.length;

  const clearPendingTransition = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => () => clearPendingTransition(), []);

  const handleReset = () => {
    clearPendingTransition();
    setCurrentStepIndex(0);
    setCompletedHotspots([]);
    setWrongHotspot(null);
    setShowHint(false);
    setMistakes(0);
    setMockCounters({
      lightErrors: 0,
      heavyErrors: 0,
      disqualified: false,
    });
    setCompletedResult(null);
    setFeedback(null);
    setIsLocked(false);
  };

  const handleHotspotClick = (hotspotId: string) => {
    if (completedResult || isLocked) return;

    if (hotspotId === currentStep.hotspotId) {
      setCompletedHotspots((prev) => [...prev, hotspotId]);
      setWrongHotspot(null);
      setShowHint(false);
      setFeedback({ type: "correct", message: `სწორია! ${currentStep.title}` });

      if (currentStepIndex + 1 >= totalSteps) {
        const score = calculateScore(totalSteps, mistakes);
        const result =
          mode === "mock"
            ? buildMockResult(score, mistakes, {
                outcome: "passed",
                lightErrors: mockCounters.lightErrors,
                heavyErrors: mockCounters.heavyErrors,
                disqualified: false,
                failureReason: null,
              })
            : buildPracticeResult(score, mistakes);

        setCompletedResult(result);
        onComplete(result);
        return;
      }

      setIsLocked(true);
      clearPendingTransition();
      timeoutRef.current = window.setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
        setFeedback(null);
        setIsLocked(false);
      }, 1200);
      return;
    }

    const nextMistakes = mistakes + 1;

    setWrongHotspot(hotspotId);
    setMistakes(nextMistakes);

    if (mode === "mock") {
      const nextLightErrors = mockCounters.lightErrors + 1;
      const nextCounters = {
        lightErrors: nextLightErrors,
        heavyErrors: mockCounters.heavyErrors,
        disqualified: false,
      };

      setMockCounters(nextCounters);
      setFeedback({
        type: "wrong",
        message: `არასწორია. ${getMockPenaltyLabel("light")} დაგიგროვდათ.`,
      });

      if (nextLightErrors >= LIGHT_ERROR_LIMIT) {
        const result = buildMockResult(calculateScore(totalSteps, nextMistakes), nextMistakes, {
          outcome: "failed",
          lightErrors: nextLightErrors,
          heavyErrors: mockCounters.heavyErrors,
          disqualified: false,
          failureReason: "დაგროვდა 12 მსუბუქი შეცდომა.",
        });

        setCompletedResult(result);
        onComplete(result);
        return;
      }
    } else {
      setFeedback({ type: "wrong", message: "არასწორია. სცადეთ თავიდან." });
    }

    setIsLocked(true);
    clearPendingTransition();
    timeoutRef.current = window.setTimeout(() => {
      setWrongHotspot(null);
      setFeedback(null);
      setIsLocked(false);
    }, 1500);
  };

  if (completedResult) {
    return (
      <ResultsCard
        result={completedResult}
        mistakeLabel="შეცდომა"
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProgressCard
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        mistakes={mistakes}
        mode={mode}
        mockCounters={mode === "mock" ? mockCounters : undefined}
      />

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#F03D3D] text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
            {currentStepIndex + 1}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{currentStep.title}</h3>
            <p className="text-gray-600 mt-1">{currentStep.description}</p>
            <HintToggle
              showHint={showHint}
              onToggle={() => setShowHint((prev) => !prev)}
              hint={currentStep.hint}
            />
          </div>
        </div>
      </div>

      <FeedbackBanner feedback={feedback} />

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500 mb-4 text-center">დააწკაპუნეთ სწორ ადგილას სურათზე</p>
        <FabiaInterior
          activeHotspot={currentStep.hotspotId}
          completedHotspots={completedHotspots}
          onHotspotClick={handleHotspotClick}
          wrongHotspot={wrongHotspot}
        />
      </div>

      <div className="text-center">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          თავიდან დაწყება
        </button>
      </div>
    </div>
  );
};
