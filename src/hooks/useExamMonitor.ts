import { useState, useEffect, useCallback, useRef } from "react";

const BASE_URL = "https://api-bookings.sa.gov.ge/api/v1/DrivingLicensePracticalExams2";
const DATES_URL = `${BASE_URL}/DrivingLicenseExamsDates2`;

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

export interface UseExamMonitorReturn {
  isMonitoring: boolean;
  availableSlots: ExamSlot[];
  newSlotsNotification: ExamSlot[] | null;
  startMonitoring: (centerId: number, categoryCode?: number) => void;
  stopMonitoring: () => void;
  clearNotification: () => void;
  isLoading: boolean;
  error: string | null;
}

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

          // Log to console for testing
          console.log(
            `🎉 New exam slots found for ${CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || centerId}:`,
            newDates
          );

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
        console.error("Error fetching exam slots:", message);
      } finally {
        setIsLoading(false);
      }
    },
    [categoryCode]
  );

  const startMonitoring = useCallback(
    (centerId: number, catCode: number = categoryCode) => {
      currentCenterRef.current = centerId;
      setIsMonitoring(true);
      previousSlotsRef.current.clear();
      setNewSlotsNotification(null);

      console.log(
        `🚗 Started monitoring ${CITY_CENTERS[centerId as keyof typeof CITY_CENTERS] || centerId} for exam slots...`
      );

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
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    previousSlotsRef.current.clear();
    console.log("🛑 Stopped monitoring exam slots");
  }, []);

  const clearNotification = useCallback(() => {
    setNewSlotsNotification(null);
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
  };
};
