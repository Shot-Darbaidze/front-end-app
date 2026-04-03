"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle, Calendar as CalendarIcon, CheckCircle,
  ChevronLeft, Clock, Loader2, MapPin, SquareParking,
} from "lucide-react";
import AvailableTimeSlotsCard, { type BookingSlot } from "@/components/autoschool-profile/AvailableTimeSlotsCard";
import BookingCalendarCard from "@/components/autoschool-profile/BookingCalendarCard";
import BookingPricingCard, { type BookingOption } from "@/components/autoschool-profile/BookingPricingCard";
import InstructorSelectionCard, { type InstructorOption } from "@/components/autoschool-profile/InstructorSelectionCard";
import Button from "@/components/ui/Button";
import {
  applyPackagePercentage,
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

// ── page ──────────────────────────────────────────────────────────────────────

export default function AutoschoolBookingPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params);
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

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

  // ── slots ──
  const [slotsByDate, setSlotsByDate] = useState<Record<string, BookingSlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [viewingDate, setViewingDate] = useState<string | null>(null);

  // ── flow ──
  const [step, setStep] = useState(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedSlotIds, setConfirmedSlotIds] = useState<string[]>([]);

  const hasMountedRef = useRef(false);

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
    try {
      const res = await fetch(`${API_BASE}/api/bookings/by-post/${postId}?status=available&limit=500`);
      const rows: RawSlot[] = await res.json();
      const grouped: Record<string, BookingSlot[]> = {};
      for (const row of rows) {
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

  // Scroll to top on step change
  useEffect(() => {
    if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

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
      setBookingError(null);
    }
  }, [filteredInstructors]); // eslint-disable-line react-hooks/exhaustive-deps

  const requiredSlots = selectedPackage?.lessons ?? null;

  const selectedInstructor = useMemo(
    () => instructors.find((i) => i.id === selectedInstructorId) ?? instructors[0],
    [instructors, selectedInstructorId]
  );

  const selectedSlotDetails = useMemo(
    () => Object.values(slotsByDate).flat().filter((s) => selectedSlotIds.includes(s.id)),
    [slotsByDate, selectedSlotIds]
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
    setBookingError(null);
  };

  const handleInstructorSelect = (instId: string) => {
    setSelectedInstructorId(instId);
    setSelectedSlotIds([]);
    setBookingError(null);
  };

  const handleDateClick = (day: number) => {
    const ds = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    if (!slotsByDate[ds]?.length) return;
    setViewingDate(ds);
    setBookingError(null);
  };

  const handleContinueToConfirm = () => {
    if (selectedSlotIds.length === 0) {
      setBookingError("აირჩიეთ მინიმუმ ერთი დრო.");
      return;
    }
    if (selectedPackage && requiredSlots && selectedSlotIds.length !== requiredSlots) {
      setBookingError(`ამ პაკეტისთვის საჭიროა ზუსტად ${requiredSlots} გაკვეთილის არჩევა.`);
      return;
    }
    setBookingError(null);
    setStep(2);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setBookingError(null);
    try {
      const token = await getToken();
      if (!token) { setBookingError("გთხოვთ შეხვიდეთ სისტემაში."); return; }

      // 1. Reserve
      const reserveRes = await fetch(`${API_BASE}/api/bookings/slots/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slot_ids: selectedSlotIds }),
      });
      if (!reserveRes.ok) {
        const err = await reserveRes.json().catch(() => ({}));
        setBookingError(err.detail ?? "სლოტების დარეზერვება ვერ მოხერხდა.");
        return;
      }

      // 2. Confirm
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
        setBookingError(err.detail ?? "ჯავშნის დადასტურება ვერ მოხერხდა.");
        return;
      }

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
                      onClick={() => { setLessonMode(m); setSelectedSlotIds([]); setBookingError(null); }}
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
                onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
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
                  onSelectSlot={(slotId) => {
                    setSelectedSlotIds((prev) => {
                      if (prev.includes(slotId)) {
                        setBookingError(null);
                        return prev.filter((x) => x !== slotId);
                      }
                      if (selectedPackage && requiredSlots && prev.length >= requiredSlots) {
                        setBookingError(`მაქსიმუმ ${requiredSlots} გაკვეთილის არჩევა შეიძლება.`);
                        return prev;
                      }
                      setBookingError(null);
                      return [...prev, slotId];
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
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#F03D3D]" />
                ჯავშნის დადასტურება
              </h2>

              {/* Summary */}
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
                    {selectedSlotDetails.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatTimeRange(s.time, s.durationMinutes)}
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
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="text-gray-500 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  უკან
                </button>
                <Button onClick={handleConfirm} disabled={submitting} className="px-8 relative">
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
