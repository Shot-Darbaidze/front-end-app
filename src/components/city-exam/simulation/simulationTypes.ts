import type { CityExamSimulation, ExamPenalty } from "./simulationData";

export type SimulationMode = "practice" | "mock";

export type MockSummary = {
  outcome: "passed" | "failed";
  lightErrors: number;
  heavyErrors: number;
  disqualified: boolean;
  failureReason: string | null;
};

export type SimulationResult = {
  score: number;
  mistakes: number;
  mode: SimulationMode;
  mockSummary?: MockSummary;
};

export type FeedbackState = {
  type: "correct" | "wrong";
  message: string;
};

export type MockCounters = {
  lightErrors: number;
  heavyErrors: number;
  disqualified: boolean;
};

export const LIGHT_ERROR_LIMIT = 12;

export const calculateScore = (stepsCount: number, mistakes: number) =>
  Math.max(0, Math.round(((stepsCount - mistakes) / stepsCount) * 100));

export const getSimulationItemCount = (simulation: CityExamSimulation) =>
  simulation.type === "technical" ? simulation.questions.length : simulation.steps.length;

export const getSimulationItemLabel = (simulation: CityExamSimulation) =>
  simulation.type === "technical" ? "კითხვა" : "ნაბიჯი";

export const getSimulationFormatLabel = (simulation: CityExamSimulation) => {
  if (simulation.type === "hotspot") return "სალონის ინტერაქცია";
  if (simulation.type === "technical") return "ინსტრუქტორის კითხვა";
  return "საგზაო გადაწყვეტილებები";
};

export const getMockPenaltyLabel = (penalty: ExamPenalty) => {
  if (penalty === "heavy") return "მძიმე შეცდომა";
  if (penalty === "dq") return "დისკვალიფიკაცია";
  return "მსუბუქი შეცდომა";
};

export const getMockSummaryText = (mockSummary: MockSummary) => {
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

export const buildPracticeResult = (score: number, mistakes: number): SimulationResult => ({
  score,
  mistakes,
  mode: "practice",
});

export const buildMockResult = (
  score: number,
  mistakes: number,
  mockSummary: MockSummary
): SimulationResult => ({
  score,
  mistakes,
  mode: "mock",
  mockSummary,
});
