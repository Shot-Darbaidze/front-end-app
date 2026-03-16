"use client";

import { useEffect, useState } from "react";

export const CITY_EXAM_PROGRESS_STORAGE_KEY = "city-exam-progress:v2";
const LEGACY_STORAGE_KEY = "city-exam-mastery:v1";

export type MasteryLevel = "not_started" | "learning" | "solid" | "mastered";
export type MockOutcome = "passed" | "failed";

export type StoredSimulationProgress = {
  attempts: number;
  completions: number;
  bestScore: number | null;
  lastScore: number | null;
  bestMistakes: number | null;
  lastMistakes: number | null;
  totalMistakes: number;
  lastCompletedAt: string | null;
  mockAttempts: number;
  mockPasses: number;
  lastMockOutcome: MockOutcome | null;
  lastMockScore: number | null;
  lastMockLightErrors: number | null;
  lastMockHeavyErrors: number | null;
  lastMockDisqualified: boolean;
  lastMockFailureReason: string | null;
  lastMockCompletedAt: string | null;
};

export type StoredRouteProgress = {
  completedRouteNumbers: number[];
};

type CityExamProgressState = {
  version: 2;
  activeDays: string[];
  selectedCityId: string | null;
  simulations: Record<string, StoredSimulationProgress>;
  routes: Record<string, StoredRouteProgress>;
};

type SimulationResult = {
  score: number;
  mistakes: number;
};

type MockSimulationResult = {
  score: number;
  outcome: MockOutcome;
  lightErrors: number;
  heavyErrors: number;
  disqualified: boolean;
  failureReason: string | null;
};

const createEmptyProgress = (): StoredSimulationProgress => ({
  attempts: 0,
  completions: 0,
  bestScore: null,
  lastScore: null,
  bestMistakes: null,
  lastMistakes: null,
  totalMistakes: 0,
  lastCompletedAt: null,
  mockAttempts: 0,
  mockPasses: 0,
  lastMockOutcome: null,
  lastMockScore: null,
  lastMockLightErrors: null,
  lastMockHeavyErrors: null,
  lastMockDisqualified: false,
  lastMockFailureReason: null,
  lastMockCompletedAt: null,
});

const createEmptyState = (): CityExamProgressState => ({
  version: 2,
  activeDays: [],
  selectedCityId: null,
  simulations: {},
  routes: {},
});

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayKey = () => getDateKey(new Date());

const normalizeProgress = (value: unknown): StoredSimulationProgress => {
  if (!value || typeof value !== "object") {
    return createEmptyProgress();
  }

  const progress = value as Partial<StoredSimulationProgress>;

  return {
    attempts: typeof progress.attempts === "number" ? progress.attempts : 0,
    completions: typeof progress.completions === "number" ? progress.completions : 0,
    bestScore: typeof progress.bestScore === "number" ? progress.bestScore : null,
    lastScore: typeof progress.lastScore === "number" ? progress.lastScore : null,
    bestMistakes: typeof progress.bestMistakes === "number" ? progress.bestMistakes : null,
    lastMistakes: typeof progress.lastMistakes === "number" ? progress.lastMistakes : null,
    totalMistakes: typeof progress.totalMistakes === "number" ? progress.totalMistakes : 0,
    lastCompletedAt:
      typeof progress.lastCompletedAt === "string" ? progress.lastCompletedAt : null,
    mockAttempts: typeof progress.mockAttempts === "number" ? progress.mockAttempts : 0,
    mockPasses: typeof progress.mockPasses === "number" ? progress.mockPasses : 0,
    lastMockOutcome:
      progress.lastMockOutcome === "passed" || progress.lastMockOutcome === "failed"
        ? progress.lastMockOutcome
        : null,
    lastMockScore: typeof progress.lastMockScore === "number" ? progress.lastMockScore : null,
    lastMockLightErrors:
      typeof progress.lastMockLightErrors === "number" ? progress.lastMockLightErrors : null,
    lastMockHeavyErrors:
      typeof progress.lastMockHeavyErrors === "number" ? progress.lastMockHeavyErrors : null,
    lastMockDisqualified:
      typeof progress.lastMockDisqualified === "boolean"
        ? progress.lastMockDisqualified
        : false,
    lastMockFailureReason:
      typeof progress.lastMockFailureReason === "string"
        ? progress.lastMockFailureReason
        : null,
    lastMockCompletedAt:
      typeof progress.lastMockCompletedAt === "string"
        ? progress.lastMockCompletedAt
        : null,
  };
};

const normalizeRouteProgress = (value: unknown): StoredRouteProgress => {
  if (!value || typeof value !== "object") {
    return { completedRouteNumbers: [] };
  }

  const progress = value as Partial<StoredRouteProgress>;

  return {
    completedRouteNumbers: Array.isArray(progress.completedRouteNumbers)
      ? progress.completedRouteNumbers.filter(
          (routeNumber): routeNumber is number => typeof routeNumber === "number"
        )
      : [],
  };
};

const normalizeState = (value: unknown): CityExamProgressState => {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const state = value as Partial<CityExamProgressState>;
  const simulations: Record<string, StoredSimulationProgress> = {};
  const routes: Record<string, StoredRouteProgress> = {};

  if (state.simulations && typeof state.simulations === "object") {
    Object.entries(state.simulations).forEach(([simulationId, progress]) => {
      simulations[simulationId] = normalizeProgress(progress);
    });
  }

  if (state.routes && typeof state.routes === "object") {
    Object.entries(state.routes).forEach(([cityId, progress]) => {
      routes[cityId] = normalizeRouteProgress(progress);
    });
  }

  const activeDays = Array.isArray(state.activeDays)
    ? state.activeDays.filter((day): day is string => typeof day === "string").slice(-90)
    : [];

  return {
    version: 2,
    activeDays,
    selectedCityId: typeof state.selectedCityId === "string" ? state.selectedCityId : null,
    simulations,
    routes,
  };
};

const migrateLegacyState = (value: unknown): CityExamProgressState => {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const legacyState = value as {
    activeDays?: unknown;
    simulations?: unknown;
  };

  return normalizeState({
    version: 2,
    activeDays: legacyState.activeDays,
    simulations: legacyState.simulations,
    routes: {},
    selectedCityId: null,
  });
};

const persistState = (state: CityExamProgressState) => {
  window.localStorage.setItem(CITY_EXAM_PROGRESS_STORAGE_KEY, JSON.stringify(state));
};

const markTodayActive = (activeDays: string[]) =>
  [...activeDays.filter(Boolean), getTodayKey()]
    .filter((day, index, days) => days.indexOf(day) === index)
    .slice(-90);

export const getMasteryLevel = (
  progress?: StoredSimulationProgress
): MasteryLevel => {
  if (!progress || progress.attempts === 0) {
    return "not_started";
  }

  const bestScore = progress.bestScore ?? 0;
  const lastScore = progress.lastScore ?? 0;

  if (bestScore >= 95 && progress.completions >= 2 && lastScore >= 90) {
    return "mastered";
  }

  if (bestScore >= 85) {
    return "solid";
  }

  return "learning";
};

export const getMasteryWeight = (level: MasteryLevel) => {
  if (level === "mastered") return 1;
  if (level === "solid") return 0.75;
  if (level === "learning") return 0.45;
  return 0;
};

export const getActiveStreakDays = (activeDays: string[]) => {
  if (activeDays.length === 0) {
    return 0;
  }

  const uniqueDays = [...new Set(activeDays)].sort();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let index = uniqueDays.length - 1; index >= 0; index -= 1) {
    const expectedDay = getDateKey(cursor);

    if (uniqueDays[index] !== expectedDay) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const useCityExamProgress = () => {
  const [progressState, setProgressState] = useState<CityExamProgressState>(createEmptyState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(CITY_EXAM_PROGRESS_STORAGE_KEY);

      if (storedValue) {
        setProgressState(normalizeState(JSON.parse(storedValue)));
        setIsHydrated(true);
        return;
      }

      const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEY);

      if (legacyValue) {
        const migratedState = migrateLegacyState(JSON.parse(legacyValue));
        setProgressState(migratedState);
        persistState(migratedState);
        setIsHydrated(true);
        return;
      }

      setProgressState(createEmptyState());
    } catch {
      setProgressState(createEmptyState());
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const updateProgressState = (
    updater: (currentState: CityExamProgressState) => CityExamProgressState
  ) => {
    setProgressState((currentState) => {
      const nextState = updater(currentState);
      persistState(nextState);
      return nextState;
    });
  };

  const recordSimulationResult = (simulationId: string, result: SimulationResult) => {
    updateProgressState((currentState) => {
      const currentProgress = currentState.simulations[simulationId] ?? createEmptyProgress();
      const bestScore =
        currentProgress.bestScore === null
          ? result.score
          : Math.max(currentProgress.bestScore, result.score);
      const bestMistakes =
        currentProgress.bestMistakes === null
          ? result.mistakes
          : Math.min(currentProgress.bestMistakes, result.mistakes);

      return {
        ...currentState,
        activeDays: markTodayActive(currentState.activeDays),
        simulations: {
          ...currentState.simulations,
          [simulationId]: {
            ...currentProgress,
            attempts: currentProgress.attempts + 1,
            completions: currentProgress.completions + 1,
            bestScore,
            lastScore: result.score,
            bestMistakes,
            lastMistakes: result.mistakes,
            totalMistakes: currentProgress.totalMistakes + result.mistakes,
            lastCompletedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const recordMockSimulationResult = (
    simulationId: string,
    result: MockSimulationResult
  ) => {
    updateProgressState((currentState) => {
      const currentProgress = currentState.simulations[simulationId] ?? createEmptyProgress();

      return {
        ...currentState,
        activeDays: markTodayActive(currentState.activeDays),
        simulations: {
          ...currentState.simulations,
          [simulationId]: {
            ...currentProgress,
            mockAttempts: currentProgress.mockAttempts + 1,
            mockPasses:
              currentProgress.mockPasses + (result.outcome === "passed" ? 1 : 0),
            lastMockOutcome: result.outcome,
            lastMockScore: result.score,
            lastMockLightErrors: result.lightErrors,
            lastMockHeavyErrors: result.heavyErrors,
            lastMockDisqualified: result.disqualified,
            lastMockFailureReason: result.failureReason,
            lastMockCompletedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const setSelectedCityId = (cityId: string) => {
    updateProgressState((currentState) => ({
      ...currentState,
      selectedCityId: cityId,
    }));
  };

  const toggleRouteCompleted = (cityId: string, routeNumber: number) => {
    updateProgressState((currentState) => {
      const currentRouteProgress = currentState.routes[cityId]?.completedRouteNumbers ?? [];
      const isCompleted = currentRouteProgress.includes(routeNumber);
      const completedRouteNumbers = isCompleted
        ? currentRouteProgress.filter((currentRouteNumber) => currentRouteNumber !== routeNumber)
        : [...currentRouteProgress, routeNumber].sort((left, right) => left - right);

      return {
        ...currentState,
        activeDays: markTodayActive(currentState.activeDays),
        routes: {
          ...currentState.routes,
          [cityId]: {
            completedRouteNumbers,
          },
        },
      };
    });
  };

  const resetProgress = () => {
    const nextState = createEmptyState();
    setProgressState(nextState);
    window.localStorage.removeItem(CITY_EXAM_PROGRESS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  return {
    isHydrated,
    progressState,
    recordSimulationResult,
    recordMockSimulationResult,
    setSelectedCityId,
    toggleRouteCompleted,
    resetProgress,
  };
};

export const useCityExamMastery = useCityExamProgress;
