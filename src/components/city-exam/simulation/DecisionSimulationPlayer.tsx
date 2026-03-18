"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DecisionOption, DecisionSimulation } from "./simulationData";
import type { FeedbackState, MockCounters, SimulationMode, SimulationResult } from "./simulationTypes";
import {
  LIGHT_ERROR_LIMIT,
  buildMockResult,
  buildPracticeResult,
  calculateScore,
  getMockPenaltyLabel,
} from "./simulationTypes";
import { FeedbackBanner, HintToggle, ProgressCard, ResultsCard } from "./SimulationShared";

export const DecisionSimulationPlayer = ({
  simulation,
  mode,
  onComplete,
}: {
  simulation: DecisionSimulation;
  mode: SimulationMode;
  onComplete: (result: SimulationResult) => void;
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [mockCounters, setMockCounters] = useState<MockCounters>({
    lightErrors: 0,
    heavyErrors: 0,
    disqualified: false,
  });
  const [completedResult, setCompletedResult] = useState<SimulationResult | null>(null);
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
    setMistakes(0);
    setShowHint(false);
    setFeedback(null);
    setSelectedOptionId(null);
    setIsLocked(false);
    setMockCounters({
      lightErrors: 0,
      heavyErrors: 0,
      disqualified: false,
    });
    setCompletedResult(null);
  };

  const finishWithResult = (result: SimulationResult) => {
    setCompletedResult(result);
    onComplete(result);
  };

  const handleOptionClick = (selectedOption: DecisionOption) => {
    if (completedResult || isLocked) return;

    setSelectedOptionId(selectedOption.id);
    setShowHint(false);

    if (selectedOption.isCorrect) {
      setFeedback({
        type: "correct",
        message: selectedOption.feedback,
      });

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

        finishWithResult(result);
        return;
      }

      setIsLocked(true);
      clearPendingTransition();
      timeoutRef.current = window.setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
        setFeedback(null);
        setSelectedOptionId(null);
        setIsLocked(false);
      }, 1200);
      return;
    }

    const nextMistakes = mistakes + 1;
    const penalty = selectedOption.mockPenalty ?? "light";
    const nextLightErrors =
      penalty === "light" ? mockCounters.lightErrors + 1 : mockCounters.lightErrors;
    const nextHeavyErrors =
      penalty === "heavy" ? mockCounters.heavyErrors + 1 : mockCounters.heavyErrors;
    const nextCounters = {
      lightErrors: nextLightErrors,
      heavyErrors: nextHeavyErrors,
      disqualified: penalty === "dq",
    };

    setMistakes(nextMistakes);
    setFeedback({
      type: "wrong",
      message:
        mode === "mock"
          ? `${selectedOption.feedback} ${getMockPenaltyLabel(penalty)}.`
          : selectedOption.feedback,
    });

    if (mode === "mock") {
      setMockCounters(nextCounters);

      if (penalty === "dq") {
        finishWithResult(
          buildMockResult(calculateScore(totalSteps, nextMistakes), nextMistakes, {
            outcome: "failed",
            lightErrors: nextLightErrors,
            heavyErrors: nextHeavyErrors,
            disqualified: true,
            failureReason: "მოკი დასრულდა დისკვალიფიკაციით.",
          })
        );
        return;
      }

      if (penalty === "heavy") {
        finishWithResult(
          buildMockResult(calculateScore(totalSteps, nextMistakes), nextMistakes, {
            outcome: "failed",
            lightErrors: nextLightErrors,
            heavyErrors: nextHeavyErrors,
            disqualified: false,
            failureReason: "დაფიქსირდა მძიმე შეცდომა.",
          })
        );
        return;
      }

      if (nextLightErrors >= LIGHT_ERROR_LIMIT) {
        finishWithResult(
          buildMockResult(calculateScore(totalSteps, nextMistakes), nextMistakes, {
            outcome: "failed",
            lightErrors: nextLightErrors,
            heavyErrors: nextHeavyErrors,
            disqualified: false,
            failureReason: "დაგროვდა 12 მსუბუქი შეცდომა.",
          })
        );
        return;
      }
    }

    setIsLocked(true);
    clearPendingTransition();
    timeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
      setSelectedOptionId(null);
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F03D3D] mb-2">
              {currentStep.title}
            </p>
            <p className="text-gray-900 font-semibold leading-6">{currentStep.description}</p>
            <p className="text-gray-600 mt-3">{currentStep.question}</p>
            <HintToggle
              showHint={showHint}
              onToggle={() => setShowHint((prev) => !prev)}
              hint={currentStep.hint}
            />
          </div>
        </div>
      </div>

      <FeedbackBanner feedback={feedback} />

      <div className="grid gap-3">
        {currentStep.options.map((simulationOption) => {
          const isSelected = selectedOptionId === simulationOption.id;
          const optionStyle = isSelected
            ? simulationOption.isCorrect
              ? "border-green-400 bg-green-50 text-green-900"
              : "border-red-400 bg-red-50 text-red-900"
            : "border-gray-200 bg-white text-gray-800 hover:border-[#F03D3D]/40 hover:bg-red-50/40";

          return (
            <button
              key={simulationOption.id}
              onClick={() => handleOptionClick(simulationOption)}
              disabled={isLocked}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${optionStyle} ${
                isLocked ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="block font-medium leading-6">{simulationOption.label}</span>
            </button>
          );
        })}
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
