"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_CONFIG } from "@/config/constants";

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

// ---------------------------------------------------------------------------
// Merge logic — combines local + server states, keeping the best values
// ---------------------------------------------------------------------------

const mergeSimulationProgress = (
  local: StoredSimulationProgress,
  remote: StoredSimulationProgress
): StoredSimulationProgress => {
  const pickLatest = (a: string | null, b: string | null) => {
    if (!a) return b;
    if (!b) return a;
    return a > b ? a : b;
  };

  return {
    attempts: Math.max(local.attempts, remote.attempts),
    completions: Math.max(local.completions, remote.completions),
    bestScore:
      local.bestScore === null && remote.bestScore === null
        ? null
        : Math.max(local.bestScore ?? 0, remote.bestScore ?? 0),
    lastScore: local.lastScore ?? remote.lastScore,
    bestMistakes:
      local.bestMistakes === null && remote.bestMistakes === null
        ? null
        : Math.min(local.bestMistakes ?? Infinity, remote.bestMistakes ?? Infinity),
    lastMistakes: local.lastMistakes ?? remote.lastMistakes,
    totalMistakes: Math.max(local.totalMistakes, remote.totalMistakes),
    lastCompletedAt: pickLatest(local.lastCompletedAt, remote.lastCompletedAt),
    mockAttempts: Math.max(local.mockAttempts, remote.mockAttempts),
    mockPasses: Math.max(local.mockPasses, remote.mockPasses),
    lastMockOutcome: local.lastMockOutcome ?? remote.lastMockOutcome,
    lastMockScore: local.lastMockScore ?? remote.lastMockScore,
    lastMockLightErrors: local.lastMockLightErrors ?? remote.lastMockLightErrors,
    lastMockHeavyErrors: local.lastMockHeavyErrors ?? remote.lastMockHeavyErrors,
    lastMockDisqualified: local.lastMockDisqualified || remote.lastMockDisqualified,
    lastMockFailureReason: local.lastMockFailureReason ?? remote.lastMockFailureReason,
    lastMockCompletedAt: pickLatest(local.lastMockCompletedAt, remote.lastMockCompletedAt),
  };
};

const mergeStates = (
  local: CityExamProgressState,
  remote: CityExamProgressState
): CityExamProgressState => {
  const allSimIds = new Set([
    ...Object.keys(local.simulations),
    ...Object.keys(remote.simulations),
  ]);

  const mergedSimulations: Record<string, StoredSimulationProgress> = {};
  for (const id of allSimIds) {
    const localSim = local.simulations[id] ?? createEmptyProgress();
    const remoteSim = remote.simulations[id] ?? createEmptyProgress();
    mergedSimulations[id] = mergeSimulationProgress(localSim, remoteSim);
  }

  // Merge routes — union of completed route numbers
  const allRouteKeys = new Set([
    ...Object.keys(local.routes),
    ...Object.keys(remote.routes),
  ]);
  const mergedRoutes: Record<string, StoredRouteProgress> = {};
  for (const key of allRouteKeys) {
    const localRoutes = local.routes[key]?.completedRouteNumbers ?? [];
    const remoteRoutes = remote.routes[key]?.completedRouteNumbers ?? [];
    mergedRoutes[key] = {
      completedRouteNumbers: [...new Set([...localRoutes, ...remoteRoutes])].sort(
        (a, b) => a - b
      ),
    };
  }

  // Merge active days — union, keep last 90
  const mergedDays = [...new Set([...local.activeDays, ...remote.activeDays])]
    .sort()
    .slice(-90);

  return {
    version: 2,
    activeDays: mergedDays,
    selectedCityId: local.selectedCityId ?? remote.selectedCityId,
    simulations: mergedSimulations,
    routes: mergedRoutes,
  };
};

// ---------------------------------------------------------------------------
// Backend sync helpers
// ---------------------------------------------------------------------------

const PROGRESS_API_URL = `${API_CONFIG.BASE_URL}/api/progress/city-exam`;
const SYNC_DEBOUNCE_MS = 800;

const fetchServerProgress = async (
  token: string
): Promise<CityExamProgressState | null> => {
  try {
    const response = await fetch(PROGRESS_API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.progress) return null;
    return normalizeState(data.progress);
  } catch {
    return null;
  }
};

const saveServerProgress = async (
  token: string,
  state: CityExamProgressState
): Promise<void> => {
  try {
    await fetch(PROGRESS_API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ progress: state }),
    });
  } catch {
    // fire-and-forget — localStorage is the immediate source
  }
};

const deleteServerProgress = async (token: string): Promise<void> => {
  try {
    await fetch(PROGRESS_API_URL, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // best-effort
  }
};

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

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

/**
 * City-exam progress hook with optional backend sync.
 *
 * @param getToken - Optional Clerk getToken function. When provided and
 *   returns a valid token, progress is synced to the backend database.
 *   When absent or when the token is null (not logged in), only
 *   localStorage is used.
 */
export const useCityExamProgress = (
  getToken?: () => Promise<string | null>
) => {
  const [progressState, setProgressState] = useState<CityExamProgressState>(createEmptyState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref keeps the latest state for the debounced sync without stale closures
  const latestStateRef = useRef<CityExamProgressState>(createEmptyState());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Debounced backend save
  const scheduleSyncToServer = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const tokenFn = getTokenRef.current;
      if (!tokenFn) return;
      const token = await tokenFn();
      if (!token) return;
      await saveServerProgress(token, latestStateRef.current);
    }, SYNC_DEBOUNCE_MS);
  }, []);

  // Hydrate: read localStorage, then optionally fetch + merge server data
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      // 1. Read localStorage (instant)
      let localState = createEmptyState();
      try {
        const stored = window.localStorage.getItem(CITY_EXAM_PROGRESS_STORAGE_KEY);
        if (stored) {
          localState = normalizeState(JSON.parse(stored));
        } else {
          const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            localState = migrateLegacyState(JSON.parse(legacy));
            persistState(localState);
          }
        }
      } catch {
        localState = createEmptyState();
      }

      if (cancelled) return;
      setProgressState(localState);
      latestStateRef.current = localState;
      setIsHydrated(true);

      // 2. If logged in, fetch server state and merge
      if (getToken) {
        try {
          const token = await getToken();
          if (token && !cancelled) {
            setIsSyncing(true);
            const serverState = await fetchServerProgress(token);
            if (serverState && !cancelled) {
              const merged = mergeStates(localState, serverState);
              setProgressState(merged);
              latestStateRef.current = merged;
              persistState(merged);
              // Push merged state back to server
              await saveServerProgress(token, merged);
            } else if (!serverState && !cancelled) {
              // No server data yet — push local to server
              const hasAnyLocal = Object.keys(localState.simulations).length > 0
                || Object.keys(localState.routes).length > 0;
              if (hasAnyLocal) {
                await saveServerProgress(token, localState);
              }
            }
            setIsSyncing(false);
          }
        } catch {
          if (!cancelled) setIsSyncing(false);
        }
      }
    };

    hydrate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProgressState = useCallback(
    (updater: (currentState: CityExamProgressState) => CityExamProgressState) => {
      setProgressState((currentState) => {
        const nextState = updater(currentState);
        persistState(nextState);
        latestStateRef.current = nextState;
        return nextState;
      });
      // Schedule debounced backend sync if logged in
      scheduleSyncToServer();
    },
    [scheduleSyncToServer]
  );

  const recordSimulationResult = useCallback(
    (simulationId: string, result: SimulationResult) => {
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
    },
    [updateProgressState]
  );

  const recordMockSimulationResult = useCallback(
    (simulationId: string, result: MockSimulationResult) => {
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
    },
    [updateProgressState]
  );

  const setSelectedCityId = useCallback(
    (cityId: string) => {
      updateProgressState((currentState) => ({
        ...currentState,
        selectedCityId: cityId,
      }));
    },
    [updateProgressState]
  );

  const toggleRouteCompleted = useCallback(
    (cityId: string, routeNumber: number) => {
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
    },
    [updateProgressState]
  );

  const resetProgress = useCallback(async () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    const nextState = createEmptyState();
    setProgressState(nextState);
    latestStateRef.current = nextState;
    window.localStorage.removeItem(CITY_EXAM_PROGRESS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);

    // Also clear on server
    if (getTokenRef.current) {
      try {
        const token = await getTokenRef.current();
        if (token) await deleteServerProgress(token);
      } catch {
        // best-effort
      }
    }
  }, []);

  return {
    isHydrated,
    isSyncing,
    progressState,
    recordSimulationResult,
    recordMockSimulationResult,
    setSelectedCityId,
    toggleRouteCompleted,
    resetProgress,
  };
};

export const useCityExamMastery = useCityExamProgress;
