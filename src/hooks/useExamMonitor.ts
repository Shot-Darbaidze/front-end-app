import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/utils/secureLogger";

const BASE_URL = "https://api-bookings.sa.gov.ge/api/v1/DrivingLicensePracticalExams2";
const DATES_URL = `${BASE_URL}/DrivingLicenseExamsDates2`;
const EXAM_LOG_STORAGE_KEY = "exam-monitor-log";

export const CITY_CENTERS = {
  2: "ქუთაისი",
  3: "ბათუმი",
  4: "თელავი",
  5: "ახალციხე",
  6: "ზუგდიდი",
  7: "გორი",
  8: "ფოთი",
  9: "ოზურგეთი",
  10: "საჩხერე",
  15: "რუსთავი",
};

export interface ExamSlot {
  bookingDate: string;
  bookingDateStatus: number;
  centerId?: number;
}

export interface ExamLogEntry {
  timestamp: string;
  centerId: number;
  centerName: string;
  categoryCode: number;
  type: "new_slots" | "check" | "start" | "stop";
  slots?: ExamSlot[];
  message?: string;
}

export interface UseExamMonitorReturn {
  isMonitoring: boolean;
  availableSlots: ExamSlot[];
  newSlotsNotification: ExamSlot[] | null;
  startMonitoring: (centerId: number, categoryCode?: number) => void;
  stopMonitoring: () => void;
  clearNotification: () => void;
  isLoading: boolean;
  error: string | null;
  // Log functions
  exportLogsAsJSON: () => void;
  exportLogsAsText: () => void;
  clearLogs: () => void;
  getLogCount: () => number;
}

// Helper to get logs from localStorage
const getStoredLogs = (): ExamLogEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(EXAM_LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to append log entry
const appendLog = (entry: ExamLogEntry): void => {
  if (typeof window === "undefined") return;
  try {
    const logs = getStoredLogs();
    logs.push(entry);
    localStorage.setItem(EXAM_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Storage full or other error - ignore
  }
};

// Helper to download file
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const useExamMonitor = (
  initialCenterId?: number | null,
  categoryCode: number = 4
): UseExamMonitorReturn => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<ExamSlot[]>([]);
  const [newSlotsNotification, setNewSlotsNotification] = useState<ExamSlot[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const previousSlotsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCenterRef = useRef<number | null>(initialCenterId ?? null);
  const currentCategoryRef = useRef<number>(categoryCode);

  const fetchExamSlots = useCallback(
    async (centerId: number) => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams({
          CategoryCode: categoryCode.toString(),
          CenterId: centerId.toString(),
        });

        // Use our API route instead of calling external API directly
        const response = await fetch(`/api/exam-slots?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.details || `API error: ${response.status}`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        // Filter for available slots
        const slots = data.filter((d) => d.bookingDateStatus === 1);
        setAvailableSlots(slots);

        // Check for new slots
        const currentDates = new Set(slots.map((s) => s.bookingDate));
        const previousDates = previousSlotsRef.current;
        const newDates = Array.from(currentDates).filter(
          (date) => !previousDates.has(date)
        );

        if (newDates.length > 0) {
          const newSlots = slots.filter((s) => newDates.includes(s.bookingDate));
          setNewSlotsNotification(newSlots);

          // Log for monitoring
          logger.info('New exam slots found', {
            center: CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || centerId,
            dates: newDates,
            count: newDates.length,
          });

          // Append to persistent log
          appendLog({
            timestamp: new Date().toISOString(),
            centerId,
            centerName: CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || `Center ${centerId}`,
            categoryCode: currentCategoryRef.current,
            type: "new_slots",
            slots: newSlots,
            message: `Found ${newSlots.length} new slot(s): ${newDates.join(", ")}`,
          });

          // Play sound if available
          if (typeof window !== "undefined" && "AudioContext" in window) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = "sine";

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.5
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          }
        }

        previousSlotsRef.current = currentDates;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        logger.error('Error fetching exam slots', err instanceof Error ? err : new Error(message));
      } finally {
        setIsLoading(false);
      }
    },
    [categoryCode]
  );

  const startMonitoring = useCallback(
    (centerId: number, catCode: number = categoryCode) => {
      currentCenterRef.current = centerId;
      currentCategoryRef.current = catCode;
      setIsMonitoring(true);
      previousSlotsRef.current.clear();
      setNewSlotsNotification(null);

      logger.debug('Started monitoring exam slots', {
        center: CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || centerId,
        categoryCode: catCode,
      });

      // Log start event
      appendLog({
        timestamp: new Date().toISOString(),
        centerId,
        centerName: CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || `Center ${centerId}`,
        categoryCode: catCode,
        type: "start",
        message: "Started monitoring",
      });

      // Initial fetch
      fetchExamSlots(centerId);

      // Set up interval for polling every 30 seconds
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        fetchExamSlots(centerId);
      }, 30000); // 30 seconds
    },
    [categoryCode, fetchExamSlots]
  );

  const stopMonitoring = useCallback(() => {
    const centerId = currentCenterRef.current;
    
    // Log stop event
    if (centerId) {
      appendLog({
        timestamp: new Date().toISOString(),
        centerId,
        centerName: CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || `Center ${centerId}`,
        categoryCode: currentCategoryRef.current,
        type: "stop",
        message: "Stopped monitoring",
      });
    }

    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    previousSlotsRef.current.clear();
    logger.debug('Stopped monitoring exam slots');
  }, []);

  const clearNotification = useCallback(() => {
    setNewSlotsNotification(null);
  }, []);

  // Export logs as JSON file
  const exportLogsAsJSON = useCallback(() => {
    const logs = getStoredLogs();
    const filename = `exam-monitor-log-${new Date().toISOString().split("T")[0]}.json`;
    downloadFile(JSON.stringify(logs, null, 2), filename, "application/json");
  }, []);

  // Export logs as text file
  const exportLogsAsText = useCallback(() => {
    const logs = getStoredLogs();
    const textContent = logs
      .map((entry) => {
        const line = `[${entry.timestamp}] [${entry.type.toUpperCase()}] ${entry.centerName} (Cat: ${entry.categoryCode})`;
        if (entry.message) {
          return `${line} - ${entry.message}`;
        }
        if (entry.slots && entry.slots.length > 0) {
          return `${line} - Slots: ${entry.slots.map((s) => s.bookingDate).join(", ")}`;
        }
        return line;
      })
      .join("\n");
    const filename = `exam-monitor-log-${new Date().toISOString().split("T")[0]}.txt`;
    downloadFile(textContent, filename, "text/plain");
  }, []);

  // Clear all logs
  const clearLogs = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(EXAM_LOG_STORAGE_KEY);
    }
  }, []);

  // Get log count
  const getLogCount = useCallback(() => {
    return getStoredLogs().length;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isMonitoring,
    availableSlots,
    newSlotsNotification,
    startMonitoring,
    stopMonitoring,
    clearNotification,
    isLoading,
    error,
    exportLogsAsJSON,
    exportLogsAsText,
    clearLogs,
    getLogCount,
  };
};
