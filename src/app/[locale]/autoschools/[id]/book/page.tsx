"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle, Calendar as CalendarIcon, CheckCircle,
  ChevronLeft, Clock, Loader2, MapPin, SquareParking, Timer,
} from "lucide-react";
import AvailableTimeSlotsCard, { type BookingSlot } from "@/components/autoschool-profile/AvailableTimeSlotsCard";
import BookingCalendarCard from "@/components/autoschool-profile/BookingCalendarCard";
import BookingPricingCard, { type BookingOption } from "@/components/autoschool-profile/BookingPricingCard";
import InstructorSelectionCard, { type InstructorOption } from "@/components/autoschool-profile/InstructorSelectionCard";
import Button from "@/components/ui/Button";
import {
  formatPackagePrice,
  formatPackageAdjustment,
  getPackagePriceBreakdown,
  isPackageTransmissionCompatible,
} from "@/utils/packages";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const TZ = "Asia/Tbilisi";
type LessonMode = "city" | "yard";

// ── helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

const toTbilisiDate = (utcIso: string) =>
  new Date(utcIso).toLocaleDateString("en-CA", { timeZone: TZ });

const toTbilisiTime = (utcIso: string) =>
  new Date(utcIso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

const formatTimeRange = (startTime: string, durationMinutes: number) => {
  const [h, m] = startTime.split(":").map(Number);
  const end = new Date(0, 0, 0, h, m + durationMinutes);
  return `${startTime} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
};

const getDaysInMonth = (date: Date) => {
  const y = date.getFullYear(), mo = date.getMonth();
  const days = new Date(y, mo + 1, 0).getDate();
  const fd = new Date(y, mo, 1).getDay();
  return { days, startDay: fd === 0 ? 6 : fd - 1 };
};

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// ── types ─────────────────────────────────────────────────────────────────────

interface RawPackage {
  id: string;
  name: string;
  lessons: number;
  percentage: number | null;
  popular: boolean;
  description: string | null;
  /** Lesson mode: "city" or "yard" */
  mode: string;
  /** Transmission scope: "manual", "automatic", or "both" */
  transmission: string;
}

interface RawInstructor {
  id: string;
  title: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  transmission: string | null;
  city_price: number | null;
  yard_price: number | null;
}

interface RawSlot {
  id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: string;
}

interface StoredReservationContext {
  instructorId: string;
  packageId: string | null;
  mode: LessonMode;
  reservedUntilUtc: string;
}

type SelectedSlotDetail = {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function AutoschoolBookingPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params);
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const reservationStorageKey = `autoschool-booking-reservation:${id}`;

  const initialLessonMode: LessonMode = searchParams.get("mode") === "yard" ? "yard" : "city";
  const initialPackageId = searchParams.get("package") ?? "";
  const initialInstructorId = searchParams.get("instructor") ?? "";

  // ── school data ──
  const [schoolName, setSchoolName] = useState("ავტოსკოლა");
  const [schoolCity, setSchoolCity] = useState<string | null>(null);
  const [packages, setPackages] = useState<BookingOption[]>([]);
  const [rawPackages, setRawPackages] = useState<RawPackage[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loadingSchool, setLoadingSchool] = useState(true);

  // ── selection ──
  const [lessonMode, setLessonMode] = useState<LessonMode>(initialLessonMode);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackageId);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [selectedSlotMeta, setSelectedSlotMeta] = useState<Record<string, Omit<SelectedSlotDetail, "id">>>({});

  // ── slots ──
  const [slotsByDate, setSlotsByDate] = useState<Record<string, BookingSlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfCurrentMonth());
  const [viewingDate, setViewingDate] = useState<string | null>(null);

  // ── flow ──
  const [step, setStep] = useState(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reservedUntilUtc, setReservedUntilUtc] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reservationExpired, setReservationExpired] = useState(false);
  const [confirmedSlotIds, setConfirmedSlotIds] = useState<string[]>([]);

  const hasMountedRef = useRef(false);
  const reservedSlotIdsRef = useRef<string[]>([]);
  const restoredReservationContextRef = useRef(false);

  const clearStoredReservation = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.removeItem(reservationStorageKey);
  }, [reservationStorageKey]);

  const readStoredReservation = useCallback((): StoredReservationContext | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const rawValue = window.sessionStorage.getItem(reservationStorageKey);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as StoredReservationContext;
      if (!parsed.instructorId || !parsed.mode || !parsed.reservedUntilUtc) {
        clearStoredReservation();
        return null;
      }

      if (new Date(parsed.reservedUntilUtc).getTime() <= Date.now()) {
        clearStoredReservation();
        return null;
      }

      return parsed;
    } catch {
      clearStoredReservation();
      return null;
    }
  }, [clearStoredReservation, reservationStorageKey]);

  const writeStoredReservation = useCallback((value: StoredReservationContext) => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(reservationStorageKey, JSON.stringify(value));
  }, [reservationStorageKey]);

  // ── fetch school ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/autoschools/${id}`)
      .then((r) => r.json())
      .then((school) => {
        setSchoolName(school.name ?? "ავტოსკოლა");
        setSchoolCity(school.city ?? null);

        const pkgs: RawPackage[] = school.packages ?? [];
        setRawPackages(pkgs);
        setPackages(
          pkgs.map((p) => ({
            id: p.id,
            name: p.name,
            lessons: p.lessons,
            percentage: p.percentage != null && Number(p.percentage) > 0 ? Number(p.percentage) : undefined,
            popular: p.popular,
            description: p.description ?? "",
            mode: p.mode,
            transmission: p.transmission,
          }))
        );

        const insts: RawInstructor[] = school.instructors ?? [];
        const opts: InstructorOption[] = insts.map((i) => ({
          id: i.id,
          name: [i.first_name, i.last_name].filter(Boolean).join(" ") || i.title,
          transmission: i.transmission ?? "Manual",
          imageUrl: i.image_url ?? undefined,
          cityPrice: i.city_price ?? undefined,
          yardPrice: i.yard_price ?? undefined,
        }));
        setInstructors(opts);

        // Auto-select instructor from URL param, falling back to first
        if (initialInstructorId && opts.find((i) => i.id === initialInstructorId)) {
          setSelectedInstructorId(initialInstructorId);
        } else if (opts.length > 0) {
          setSelectedInstructorId(opts[0].id);
        }

        if (initialPackageId) {
          const initialPackage = pkgs.find((pkg) => pkg.id === initialPackageId);
          if (initialPackage) {
            setSelectedPackageId(initialPackage.id);
            setLessonMode(initialPackage.mode === "yard" ? "yard" : "city");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSchool(false));
  }, [id, initialPackageId, initialInstructorId]);

  // ── fetch slots for selected instructor ───────────────────────────────────
  const fetchSlots = useCallback(async (postId: string) => {
    if (!postId) return;
    setLoadingSlots(true);
    setSlotsByDate({});
    setViewingDate(null);
    setSelectedSlotIds([]);
    setSelectedSlotMeta({});
    try {
      const res = await fetch(`${API_BASE}/api/bookings/by-post/${postId}?status=available&limit=500`);
      const rows: RawSlot[] = await res.json();
      const now = new Date();
      const futureRows = rows.filter((row) => new Date(row.start_time_utc) > now);
      const grouped: Record<string, BookingSlot[]> = {};
      for (const row of futureRows) {
        const date = toTbilisiDate(row.start_time_utc);
        const time = toTbilisiTime(row.start_time_utc);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({ id: row.id, time, durationMinutes: row.duration_minutes });
      }
      for (const date of Object.keys(grouped)) {
        grouped[date].sort((a, b) => a.time.localeCompare(b.time));
      }
      setSlotsByDate(grouped);
      const firstDate = Object.keys(grouped).sort()[0];
      if (firstDate) {
        setViewingDate(firstDate);
        const d = new Date(firstDate + "T00:00:00");
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      } else {
        setCurrentMonth(startOfCurrentMonth());
      }
    } catch {
      // silently fail
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInstructorId) fetchSlots(selectedInstructorId);
  }, [selectedInstructorId, fetchSlots]);

  useEffect(() => {
    if (loadingSchool || restoredReservationContextRef.current) {
      return;
    }

    restoredReservationContextRef.current = true;
    const storedReservation = readStoredReservation();
    if (!storedReservation) {
      return;
    }

    setLessonMode(storedReservation.mode);

    if (
      storedReservation.packageId &&
      rawPackages.some((pkg) => pkg.id === storedReservation.packageId)
    ) {
      setSelectedPackageId(storedReservation.packageId);
    }

    if (instructors.some((instructor) => instructor.id === storedReservation.instructorId)) {
      setSelectedInstructorId(storedReservation.instructorId);
    } else {
      clearStoredReservation();
    }
  }, [clearStoredReservation, instructors, loadingSchool, rawPackages, readStoredReservation]);

  useEffect(() => {
    if (loadingSchool || step !== 1 || !selectedInstructorId) {
      return;
    }

    const storedReservation = readStoredReservation();
    if (!storedReservation || storedReservation.instructorId !== selectedInstructorId) {
      return;
    }

    let cancelled = false;

    const resumeReservation = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/bookings/slots/reserved/mine?post_id=${selectedInstructorId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          clearStoredReservation();
          return;
        }

        const data = await response.json();
        if (!data.reserved || data.reserved.length === 0 || Number(data.ttl_seconds ?? 0) <= 0) {
          clearStoredReservation();
          return;
        }

        const restoredIds = data.reserved.map((slot: { id: string }) => slot.id);
        const restoredMeta = Object.fromEntries(
          data.reserved.map((slot: RawSlot & { id: string }) => {
            const date = toTbilisiDate(slot.start_time_utc);
            const time = toTbilisiTime(slot.start_time_utc);
            return [
              slot.id,
              {
                date,
                time,
                durationMinutes: slot.duration_minutes,
              },
            ];
          }),
        );

        if (cancelled) {
          return;
        }

        setLessonMode(storedReservation.mode);
        setSelectedPackageId(storedReservation.packageId ?? "");
        setSelectedSlotIds(restoredIds);
        setSelectedSlotMeta(restoredMeta);
        reservedSlotIdsRef.current = restoredIds;
        setReservedUntilUtc(data.reserved_until_utc ?? storedReservation.reservedUntilUtc);
        setSecondsLeft(Number(data.ttl_seconds ?? 0));
        setReservationExpired(false);
        setViewingDate(restoredMeta[restoredIds[0]]?.date ?? null);
        setStep(2);
      } catch {
        // Non-critical — user can start a fresh reservation.
      }
    };

    void resumeReservation();

    return () => {
      cancelled = true;
    };
  }, [clearStoredReservation, getToken, loadingSchool, readStoredReservation, selectedInstructorId, step]);

  // Scroll to top on step change
  useEffect(() => {
    if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (!reservedUntilUtc) {
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(reservedUntilUtc).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0) {
        clearStoredReservation();
        reservedSlotIdsRef.current = [];
        setReservedUntilUtc(null);
        setReservationExpired(true);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [clearStoredReservation, reservedUntilUtc]);

  // ── derived ───────────────────────────────────────────────────────────────
  const selectedPackage = useMemo(
    () => rawPackages.find((p) => p.id === selectedPackageId) ?? null,
    [rawPackages, selectedPackageId]
  );

  useEffect(() => {
    if (!selectedPackage) {
      return;
    }

    const packageMode = selectedPackage.mode === "yard" ? "yard" : "city";
    if (lessonMode !== packageMode) {
      setLessonMode(packageMode);
      setSelectedSlotIds([]);
      setSelectedSlotMeta({});
      setBookingError(null);
    }
  }, [selectedPackage, lessonMode]);

  const filteredInstructors = useMemo(
    () => instructors.filter((instructor) => {
      const modePrice = lessonMode === "city" ? instructor.cityPrice : instructor.yardPrice;
      if (modePrice == null) {
        return false;
      }
      if (!selectedPackage) {
        return true;
      }

      return isPackageTransmissionCompatible(selectedPackage.transmission, instructor.transmission);
    }),
    [instructors, lessonMode, selectedPackage]
  );

  const filteredPackages = useMemo(
    () => packages.filter((pkg) => {
      const rawPackage = rawPackages.find((item) => item.id === pkg.id);
      if (!rawPackage) {
        return false;
      }
      if (rawPackage.mode !== lessonMode) {
        return false;
      }
      if (!selectedInstructorId) {
        return true;
      }

      const selectedInstructor = instructors.find((item) => item.id === selectedInstructorId);
      if (!selectedInstructor) {
        return true;
      }

      return isPackageTransmissionCompatible(rawPackage.transmission, selectedInstructor.transmission);
    }),
    [packages, rawPackages, lessonMode, instructors, selectedInstructorId]
  );

  useEffect(() => {
    if (!selectedPackageId) {
      return;
    }
    if (!filteredPackages.some((pkg) => pkg.id === selectedPackageId)) {
      setSelectedPackageId("");
    }
  }, [filteredPackages, selectedPackageId]);

  // If selected instructor was filtered out, switch to first available
  useEffect(() => {
    if (filteredInstructors.length === 0) return;
    if (!filteredInstructors.find((i) => i.id === selectedInstructorId)) {
      setSelectedInstructorId(filteredInstructors[0].id);
      setSelectedSlotIds([]);
      setSelectedSlotMeta({});
      setBookingError(null);
    }
  }, [filteredInstructors]); // eslint-disable-line react-hooks/exhaustive-deps

  const requiredSlots = selectedPackage?.lessons ?? null;

  const selectedInstructor = useMemo(
    () => instructors.find((i) => i.id === selectedInstructorId) ?? instructors[0],
    [instructors, selectedInstructorId]
  );

  const selectedSlotDetails = useMemo(
    () => selectedSlotIds
      .map((slotId) => {
        const meta = selectedSlotMeta[slotId];
        if (!meta) {
          return null;
        }

        return {
          id: slotId,
          date: meta.date,
          time: meta.time,
          durationMinutes: meta.durationMinutes,
        };
      })
      .filter((slot): slot is SelectedSlotDetail => slot !== null)
      .sort((left, right) => {
        const leftKey = `${left.date}T${left.time}`;
        const rightKey = `${right.date}T${right.time}`;
        return leftKey.localeCompare(rightKey);
      }),
    [selectedSlotIds, selectedSlotMeta]
  );

  // Price computation
  const pricePerSlot = useMemo(() => {
    if (!selectedInstructor) return null;
    const p = lessonMode === "city" ? selectedInstructor.cityPrice : selectedInstructor.yardPrice;
    return p ?? null;
  }, [selectedInstructor, lessonMode]);

  const selectedPackagePricing = useMemo(() => {
    if (!selectedPackage || requiredSlots == null) {
      return null;
    }

    const lessonPrice = selectedInstructor
      ? (selectedPackage.mode === "yard" ? selectedInstructor.yardPrice : selectedInstructor.cityPrice)
      : null;

    return getPackagePriceBreakdown(lessonPrice, requiredSlots, selectedPackage.percentage);
  }, [requiredSlots, selectedInstructor, selectedPackage]);

  const pricedFilteredPackages = useMemo(
    () => filteredPackages.map((pkg) => {
      const lessonPrice = selectedInstructor
        ? (pkg.mode === "yard" ? selectedInstructor.yardPrice : selectedInstructor.cityPrice)
        : null;
      const pricing = getPackagePriceBreakdown(lessonPrice, pkg.lessons, pkg.percentage);

      return {
        ...pkg,
        baseLessonPrice: pricing?.baseLessonPrice,
        discountedLessonPrice: pricing?.discountedLessonPrice,
        baseTotalPrice: pricing?.baseTotalPrice,
        discountedTotalPrice: pricing?.discountedTotalPrice,
      };
    }),
    [filteredPackages, selectedInstructor],
  );

  const computedTotal = useMemo(() => {
    if (pricePerSlot == null || selectedSlotIds.length === 0) return null;
    const count = selectedSlotIds.length;
    if (selectedPackagePricing && requiredSlots && count >= requiredSlots) {
      return selectedPackagePricing.discountedTotalPrice;
    }
    return Math.round(pricePerSlot * count * 100) / 100;
  }, [pricePerSlot, requiredSlots, selectedPackagePricing, selectedSlotIds.length]);

  const selectedOptionOriginalPrice =
    selectedPackagePricing && requiredSlots != null && selectedSlotIds.length >= requiredSlots
      ? selectedPackagePricing.baseTotalPrice
      : undefined;

  const { days, startDay } = getDaysInMonth(currentMonth);
  const minimumMonth = useMemo(() => startOfCurrentMonth(), []);
  const isDateAvailable = (day: number) => {
    const ds = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    return Boolean(slotsByDate[ds]?.length);
  };
  const isDateSelected = (day: number) => {
    const ds = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    return viewingDate === ds;
  };

  // ── handlers ──────────────────────────────────────────────────────────────
  const handlePackageSelect = (packageId: string | null) => {
    const nextPackage = rawPackages.find((pkg) => pkg.id === packageId);
    if (nextPackage) {
      setLessonMode(nextPackage.mode === "yard" ? "yard" : "city");
      setSelectedPackageId(nextPackage.id);
    } else {
      setSelectedPackageId("");
    }
    setSelectedSlotIds([]);
    setSelectedSlotMeta({});
    setBookingError(null);
  };

  const handleInstructorSelect = (instId: string) => {
    setSelectedInstructorId(instId);
    setSelectedSlotIds([]);
    setSelectedSlotMeta({});
    setBookingError(null);
  };

  const handleDateClick = (day: number) => {
    const ds = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    if (!slotsByDate[ds]?.length) return;
    setViewingDate(ds);
    setBookingError(null);
  };

  const releaseReservation = useCallback(async () => {
    const reservedSlotIds = reservedSlotIdsRef.current;
    clearStoredReservation();

    if (reservedSlotIds.length > 0) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_BASE}/api/bookings/slots/release`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ slot_ids: reservedSlotIds }),
            keepalive: true,
          });
        }
      } catch {
        // Best effort only — server-side expiry will clean this up if release fails.
      }
    }

    reservedSlotIdsRef.current = [];
    setReservedUntilUtc(null);
    setSecondsLeft(0);
  }, [clearStoredReservation, getToken]);

  const reserveSelectedSlots = async () => {
    setReserving(true);
    setBookingError(null);
    setReservationExpired(false);

    try {
      const token = await getToken();
      if (!token) {
        setBookingError("გთხოვთ შეხვიდეთ სისტემაში.");
        return;
      }

      const reserveRes = await fetch(`${API_BASE}/api/bookings/slots/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slot_ids: selectedSlotIds }),
      });

      const reserveData = await reserveRes.json().catch(() => ({}));
      if (!reserveRes.ok) {
        setBookingError(reserveData.detail ?? "სლოტების რეზერვაცია ვერ მოხერხდა.");
        return;
      }

      const reservedRows = Array.isArray(reserveData.reserved) ? reserveData.reserved : [];
      const failedSlotIds = Array.isArray(reserveData.failed_slot_ids) ? reserveData.failed_slot_ids : [];

      if (failedSlotIds.length > 0) {
        const reservedIds = reservedRows.map((row: { id: string }) => row.id);
        if (reservedIds.length > 0) {
          await fetch(`${API_BASE}/api/bookings/slots/release`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ slot_ids: reservedIds }),
          }).catch(() => undefined);
        }

        const failedSet = new Set<string>(failedSlotIds);
        setSelectedSlotIds((prev) => prev.filter((slotId) => !failedSet.has(slotId)));
        setSelectedSlotMeta((prev) => {
          const next = { ...prev };
          for (const failedSlotId of failedSlotIds) {
            delete next[failedSlotId];
          }
          return next;
        });
        setBookingError(
          selectedPackage
            ? "არჩეული სლოტებიდან ნაწილი აღარ არის ხელმისაწვდომი. თავიდან აირჩიეთ პაკეტის დროები."
            : "არჩეული სლოტებიდან ნაწილი აღარ არის ხელმისაწვდომი. გადაამოწმეთ დროები და სცადეთ თავიდან.",
        );
        return;
      }

      const reservedIds = reservedRows.map((row: { id: string }) => row.id);
      reservedSlotIdsRef.current = reservedIds;
      setReservedUntilUtc(reserveData.reserved_until_utc ?? null);
      setSecondsLeft(Number(reserveData.ttl_seconds ?? 0));
      writeStoredReservation({
        instructorId: selectedInstructorId,
        packageId: selectedPackage?.id ?? null,
        mode: lessonMode,
        reservedUntilUtc: reserveData.reserved_until_utc ?? new Date(Date.now() + Number(reserveData.ttl_seconds ?? 0) * 1000).toISOString(),
      });
      setStep(2);
    } catch {
      setBookingError("რეზერვაცია ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setReserving(false);
    }
  };

  const handleContinueToConfirm = async () => {
    if (reserving) {
      return;
    }

    if (selectedSlotIds.length === 0) {
      setBookingError("აირჩიეთ მინიმუმ ერთი დრო.");
      return;
    }
    if (selectedPackage && requiredSlots && selectedSlotIds.length !== requiredSlots) {
      setBookingError(`ამ პაკეტისთვის საჭიროა ზუსტად ${requiredSlots} გაკვეთილის არჩევა.`);
      return;
    }
    setBookingError(null);
    await reserveSelectedSlots();
  };

  const handleBackToSelection = async () => {
    await releaseReservation();
    setBookingError(null);
    setReservationExpired(false);
    setSelectedSlotIds([]);
    setSelectedSlotMeta({});
    setStep(1);
    if (selectedInstructorId) {
      await fetchSlots(selectedInstructorId);
    }
  };

  const handleReservationExpired = async () => {
    clearStoredReservation();
    reservedSlotIdsRef.current = [];
    setReservedUntilUtc(null);
    setSecondsLeft(0);
    setReservationExpired(false);
    setBookingError(null);
    setSelectedSlotIds([]);
    setSelectedSlotMeta({});
    setStep(1);
    if (selectedInstructorId) {
      await fetchSlots(selectedInstructorId);
    }
  };

  const handleConfirm = async () => {
    if (secondsLeft <= 0 || !reservedUntilUtc) {
      clearStoredReservation();
      setReservationExpired(true);
      return;
    }

    setSubmitting(true);
    setBookingError(null);
    try {
      const token = await getToken();
      if (!token) { setBookingError("გთხოვთ შეხვიდეთ სისტემაში."); return; }

      const confirmBody: Record<string, unknown> = {
        slot_ids: selectedSlotIds,
        mode: lessonMode,
      };
      if (selectedPackage) {
        confirmBody.package_id = selectedPackage.id;
      }

      const confirmRes = await fetch(`${API_BASE}/api/bookings/slots/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(confirmBody),
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        const detail = typeof err.detail === "string" ? err.detail.toLowerCase() : "";
        if (detail.includes("expired") || detail.includes("reserved slot not found")) {
          clearStoredReservation();
          reservedSlotIdsRef.current = [];
          setReservedUntilUtc(null);
          setSecondsLeft(0);
          setReservationExpired(true);
          return;
        }
        setBookingError(err.detail ?? "ჯავშნის დადასტურება ვერ მოხერხდა.");
        return;
      }

      clearStoredReservation();
      reservedSlotIdsRef.current = [];
      setReservedUntilUtc(null);
      setSecondsLeft(0);
      setConfirmedSlotIds(selectedSlotIds);
      setStep(3);
    } catch {
      setBookingError("კავშირის შეცდომა. სცადეთ თავიდან.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── success ───────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ჯავშანი დადასტურებულია</h1>
            <p className="text-gray-500 mb-6">გაკვეთილები წარმატებით დაჯავშნა.</p>
            <div className="bg-gray-50 rounded-2xl p-5 text-left mb-6 space-y-3">
              <Row label="ავტოსკოლა" value={schoolName} />
              <Row label="ფორმატი" value={selectedPackage ? "პაკეტით" : "სათითაო გაკვეთილები"} />
              {selectedPackage && (
                <Row label="პაკეტი" value={selectedPackage.name} />
              )}
              <Row label="ინსტრუქტორი" value={selectedInstructor?.name ?? "-"} />
              <Row label="რეჟიმი" value={lessonMode === "city" ? "ქალაქი" : "მოედანი"} />
              <Row label="გაკვეთილები" value={`${confirmedSlotIds.length} გაკვ.`} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href={`/${locale}/dashboard`}>დაშბორდზე გადასვლა</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`/${locale}/autoschools/${id}`}>პროფილზე დაბრუნება</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F03D3D]" />
      </div>
    );
  }

  // ── label for slot footer ──────────────────────────────────────────────────
  const slotFooterLabel = (() => {
    const count = selectedSlotIds.length;
    if (selectedPackage && requiredSlots) {
      const adjustmentLabel = formatPackageAdjustment(selectedPackage.percentage);
      return (
        `${selectedPackage.name} · ${count}/${requiredSlots} გაკვ.` +
        (adjustmentLabel && count < requiredSlots ? `  (${requiredSlots} გაკვ-ზე ${adjustmentLabel})` : "")
      );
    }
    return `სათითაო · ${count} გაკვ.`;
  })();

  const showDiscountBadge =
    selectedPackage &&
    requiredSlots != null &&
    selectedSlotIds.length >= requiredSlots &&
    formatPackageAdjustment(selectedPackage.percentage) != null;

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href={`/${locale}/autoschools/${id}`}
            className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] font-medium mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            ავტოსკოლის პროფილზე დაბრუნება
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">გაკვეთილის დაჯავშნა</h1>
          <p className="text-gray-500 mt-1">
            {schoolName}{schoolCity && <span className="text-gray-400"> · {schoolCity}</span>}
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["არჩევა", "დადასტურება"].map((label, i) => {
            const n = i + 1;
            const active = step >= n;
            return (
              <div key={n} className="flex items-center gap-2">
                {i > 0 && <div className="w-12 h-px bg-gray-200" />}
                <div className={`flex items-center gap-2 ${active ? "text-[#F03D3D]" : "text-gray-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${active ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>
                    {n}
                  </div>
                  <span className="font-medium hidden sm:inline">{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Select ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* City / Yard selector */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3">გაკვეთილის ადგილი</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["city", "yard"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setLessonMode(m);
                        setSelectedSlotIds([]);
                        setSelectedSlotMeta({});
                        setBookingError(null);
                      }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
                        lessonMode === m
                          ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {m === "city" ? <MapPin className="w-4 h-4" /> : <SquareParking className="w-4 h-4" />}
                      {m === "city" ? "ქალაქი" : "მოედანი"}
                    </button>
                  ))}
                </div>
              </div>

              <BookingCalendarCard
                currentMonth={currentMonth}
                days={days}
                startDay={startDay}
                isDateAvailable={isDateAvailable}
                isDateSelected={isDateSelected}
                onDateClick={handleDateClick}
                onPrevMonth={() => setCurrentMonth((prev) => {
                  const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                  return next < minimumMonth ? minimumMonth : next;
                })}
                onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              />

              {filteredPackages.length > 0 && (
                <BookingPricingCard
                  selectedPackageId={selectedPackageId}
                  packages={pricedFilteredPackages}
                  onPackageSelect={handlePackageSelect}
                  language={locale === "ka" ? "ka" : "en"}
                />
              )}
            </div>

            {/* Right column */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {filteredInstructors.length > 0 && (
                <InstructorSelectionCard
                  instructors={filteredInstructors}
                  selectedInstructorId={selectedInstructorId}
                  lessonMode={lessonMode}
                  onSelect={handleInstructorSelect}
                />
              )}

              {loadingSlots ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#F03D3D]" />
                </div>
              ) : (
                <AvailableTimeSlotsCard
                  viewingDate={viewingDate}
                  slots={viewingDate ? (slotsByDate[viewingDate] ?? []) : []}
                  selectedSlotIds={selectedSlotIds}
                  bookingError={bookingError}
                  selectedOptionLabel={slotFooterLabel}
                  selectedOptionPrice={computedTotal ?? undefined}
                  selectedOptionOriginalPrice={selectedOptionOriginalPrice}
                  discountActive={showDiscountBadge ?? false}
                  continueDisabled={selectedSlotIds.length === 0 || reserving}
                  continueLoading={reserving}
                  continueLoadingLabel="რეზერვაცია..."
                  onSelectSlot={(slot) => {
                    if (!viewingDate) {
                      return;
                    }

                    setSelectedSlotIds((prev) => {
                      if (prev.includes(slot.id)) {
                        setSelectedSlotMeta((meta) => {
                          const next = { ...meta };
                          delete next[slot.id];
                          return next;
                        });
                        setBookingError(null);
                        return prev.filter((x) => x !== slot.id);
                      }
                      if (selectedPackage && requiredSlots && prev.length >= requiredSlots) {
                        setBookingError(`მაქსიმუმ ${requiredSlots} გაკვეთილის არჩევა შეიძლება.`);
                        return prev;
                      }
                      setSelectedSlotMeta((meta) => ({
                        ...meta,
                        [slot.id]: {
                          date: viewingDate,
                          time: slot.time,
                          durationMinutes: slot.durationMinutes,
                        },
                      }));
                      setBookingError(null);
                      return [...prev, slot.id];
                    });
                  }}
                  onContinue={handleContinueToConfirm}
                  formatTimeRange={formatTimeRange}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            {reservationExpired ? (
              <div className="bg-white rounded-3xl border border-red-200 p-8 shadow-sm text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">რეზერვაციის ვადა ამოიწურა</h2>
                <p className="text-gray-500 mb-6">
                  დროებითი რეზერვაცია ამოიწურა და სლოტები ხელახლა გახდა ხელმისაწვდომი. აირჩიეთ ახალი დროები.
                </p>
                <Button onClick={handleReservationExpired} className="px-8">
                  ახალი დროების არჩევა
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                {secondsLeft > 0 && (
                  <div className={`flex items-center justify-between rounded-2xl border p-4 ${
                    secondsLeft <= 60
                      ? "bg-red-50 border-red-200"
                      : secondsLeft <= 180
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Timer className={`w-5 h-5 ${
                        secondsLeft <= 60
                          ? "text-red-500 animate-pulse"
                          : secondsLeft <= 180
                            ? "text-amber-500"
                            : "text-blue-500"
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          secondsLeft <= 60
                            ? "text-red-800"
                            : secondsLeft <= 180
                              ? "text-amber-800"
                              : "text-blue-800"
                        }`}>
                          სლოტები დროებით დაჭერილია თქვენთვის
                        </p>
                        <p className={`text-xs ${
                          secondsLeft <= 60
                            ? "text-red-600"
                            : secondsLeft <= 180
                              ? "text-amber-600"
                              : "text-blue-600"
                        }`}>
                          დაასრულეთ დაჯავშნა დროის ამოწურვამდე.
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold tabular-nums ${
                      secondsLeft <= 60
                        ? "text-red-600"
                        : secondsLeft <= 180
                          ? "text-amber-600"
                          : "text-blue-600"
                    }`}>
                      {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
                    </div>
                  </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#F03D3D]" />
                  ჯავშნის დადასტურება
                </h2>

                <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                  <Row label="ავტოსკოლა" value={schoolName} />
                  <Row label="ინსტრუქტორი" value={`${selectedInstructor?.name ?? "-"} · ${selectedInstructor?.transmission ?? ""}`} />
                  <Row label="გაკვეთილის ადგილი" value={lessonMode === "city" ? "ქალაქი" : "მოედანი"} />
                  {selectedPackage && (
                    <Row
                      label="პაკეტი"
                      value={
                        selectedPackage.name +
                        (formatPackageAdjustment(selectedPackage.percentage)
                          ? ` · ${formatPackageAdjustment(selectedPackage.percentage)}`
                          : "")
                      }
                    />
                  )}
                  {computedTotal != null && (
                    <Row
                      label="სავარაუდო ღირებულება"
                      value={
                        selectedPackagePricing && selectedPackagePricing.baseTotalPrice > selectedPackagePricing.discountedTotalPrice
                          ? (
                            <span className="inline-flex items-baseline gap-2">
                              <span className="text-xs text-gray-400 line-through">
                                ₾{formatPackagePrice(selectedPackagePricing.baseTotalPrice)}
                              </span>
                              <span>₾{formatPackagePrice(computedTotal)}</span>
                            </span>
                          )
                          : `₾${formatPackagePrice(computedTotal)}`
                      }
                    />
                  )}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" /> არჩეული დროები ({selectedSlotDetails.length})
                    </p>
                    <div className="space-y-1">
                      {selectedSlotDetails.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {new Date(`${slot.date}T00:00:00`).toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                          <span className="text-gray-300">·</span>
                          {formatTimeRange(slot.time, slot.durationMinutes)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{bookingError}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => void handleBackToSelection()}
                    disabled={submitting}
                    className="text-gray-500 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    უკან
                  </button>
                  <Button onClick={handleConfirm} disabled={submitting || secondsLeft <= 0} className="px-8 relative">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> იჯავშნება...
                      </span>
                    ) : (
                      "დაჯავშნა"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}
