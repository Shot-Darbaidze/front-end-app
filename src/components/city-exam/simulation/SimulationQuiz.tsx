"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Lightbulb, RotateCcw, Trash2, Trophy, XCircle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCityExamProgress } from "../mastery/useCityExamMastery";
import { FabiaInterior } from "./FabiaInterior";
import { TechnicalQuestionsSimulation } from "./TechnicalQuestionsSimulation";
import {
  CITY_EXAM_SIMULATIONS,
  type CityExamSimulation,
  type DecisionOption,
  type DecisionSimulation,
  type ExamPenalty,
  type HotspotSimulation,
} from "./simulationData";

const LIGHT_ERROR_LIMIT = 12;

type SimulationMode = "practice" | "mock";

type MockSummary = {
  outcome: "passed" | "failed";
  lightErrors: number;
  heavyErrors: number;
  disqualified: boolean;
  failureReason: string | null;
};

type SimulationResult = {
  score: number;
  mistakes: number;
  mode: SimulationMode;
  mockSummary?: MockSummary;
};

type FeedbackState = {
  type: "correct" | "wrong";
  message: string;
};

type MockCounters = {
  lightErrors: number;
  heavyErrors: number;
  disqualified: boolean;
};

const calculateScore = (stepsCount: number, mistakes: number) =>
  Math.max(0, Math.round(((stepsCount - mistakes) / stepsCount) * 100));

const getSimulationItemCount = (simulation: CityExamSimulation) =>
  simulation.type === "technical" ? simulation.questions.length : simulation.steps.length;

const getSimulationItemLabel = (simulation: CityExamSimulation) =>
  simulation.type === "technical" ? "კითხვა" : "ნაბიჯი";

const getSimulationFormatLabel = (simulation: CityExamSimulation) => {
  if (simulation.type === "hotspot") return "სალონის ინტერაქცია";
  if (simulation.type === "technical") return "ინსტრუქტორის კითხვა";
  return "საგზაო გადაწყვეტილებები";
};

const getMockPenaltyLabel = (penalty: ExamPenalty) => {
  if (penalty === "heavy") return "მძიმე შეცდომა";
  if (penalty === "dq") return "დისკვალიფიკაცია";
  return "მსუბუქი შეცდომა";
};

const getMockSummaryText = (mockSummary: MockSummary) => {
  if (mockSummary.outcome === "passed") {
    return "სცენარი საგამოცდო წესით გაიარეთ.";
  }

  if (mockSummary.failureReason) {
    return mockSummary.failureReason;
  }

  if (mockSummary.disqualified) {
    return "მოკი დასრულდა დისკვალიფიკაციით.";
  }

  if (mockSummary.heavyErrors > 0) {
    return "ერთი მძიმე შეცდომა საკმარისი აღმოჩნდა mock-ის ჩასაჭრელად.";
  }

  return "დაგროვდა 12 მსუბუქი შეცდომა და mock დასრულდა ჩაჭრით.";
};

const buildPracticeResult = (score: number, mistakes: number): SimulationResult => ({
  score,
  mistakes,
  mode: "practice",
});

const buildMockResult = (
  score: number,
  mistakes: number,
  mockSummary: MockSummary
): SimulationResult => ({
  score,
  mistakes,
  mode: "mock",
  mockSummary,
});

const DifficultyBadge = ({ difficulty }: { difficulty: CityExamSimulation["difficulty"] }) => {
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

const ResultsCard = ({
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

const ProgressCard = ({
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

const FeedbackBanner = ({ feedback }: { feedback: FeedbackState | null }) => {
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

const HintToggle = ({
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

const HotspotSimulationPlayer = ({
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

const DecisionSimulationPlayer = ({
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
  const [selectedSimulationId, setSelectedSimulationId] = useState(CITY_EXAM_SIMULATIONS[0].id);
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
    // Small delay to let React re-render the player before scrolling
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

        {/* Clear progress + sync indicator */}
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

      {/* Selected scenario + Player — shown first so users don't have to scroll past all cards */}
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

      {/* Simulation selection grid — below the player */}
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
