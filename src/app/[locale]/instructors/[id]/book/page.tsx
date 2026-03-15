"use client";

import React, { useState, use, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, Info, Loader2, AlertCircle, Timer, PlusCircle, CreditCard, Lock, Shield, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@clerk/nextjs";
import { buildInstructorName, pickFirstValidPrice, extractCityName } from "@/utils/instructor";
import { useLanguage } from "@/contexts/LanguageContext";

// Types for backend data
interface AvailableSlot {
  id: string;
  post_id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: string;
  mode: string | null;
}

interface InstructorPost {
  id: string;
  title?: string | null;
  applicant_first_name?: string | null;
  applicant_last_name?: string | null;
  automatic_city_price?: number | null;
  manual_city_price?: number | null;
  located_at?: string | null;
  google_maps_url?: string | null;
}

type SelectedSlot = {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
};

// ── Module-level cache so data survives language-switch remounts ────
const bookingCache = new Map<string, { instructor: InstructorPost; slots: AvailableSlot[]; ts: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export default function BookingPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = use(params);
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const { t, language } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // API data state
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [instructor, setInstructor] = useState<InstructorPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Reservation (temporary hold) state
  const [reserving, setReserving] = useState(false);
  const [reservedUntilUtc, setReservedUntilUtc] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reservationExpired, setReservationExpired] = useState(false);
  const reservedSlotIdsRef = useRef<string[]>([]);

  // Derived instructor info
  const instructorName = instructor 
    ? buildInstructorName(instructor.applicant_first_name, instructor.applicant_last_name)
    : "...";
  
  const price = instructor
    ? pickFirstValidPrice([instructor.automatic_city_price, instructor.manual_city_price]) ?? 0
    : 0;

  // Fetch data on mount — with module-level cache to survive locale switches
  const initialMonthSet = useRef(false);
  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const cached = bookingCache.get(id);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setInstructor(cached.instructor);
        const now = new Date();
        const futureSlots = cached.slots.filter(slot => new Date(slot.start_time_utc) > now);
        setAvailableSlots(futureSlots);
        if (!initialMonthSet.current && futureSlots.length > 0) {
          const earliest = futureSlots.reduce((a, b) => new Date(a.start_time_utc) < new Date(b.start_time_utc) ? a : b);
          setCurrentMonth(new Date(new Date(earliest.start_time_utc).getFullYear(), new Date(earliest.start_time_utc).getMonth()));
          initialMonthSet.current = true;
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const [postRes, slotsRes] = await Promise.all([
          fetch(`${baseUrl}/api/posts/${id}`, { cache: "no-store" }),
          fetch(`${baseUrl}/api/bookings/by-post/${id}?status=available&limit=500`, { cache: "no-store" }),
        ]);

        if (!postRes.ok) {
          throw new Error("Failed to load instructor");
        }

        const postData = await postRes.json() as InstructorPost;
        setInstructor(postData);

        let allSlots: AvailableSlot[] = [];
        if (slotsRes.ok) {
          allSlots = await slotsRes.json() as AvailableSlot[];
        }

        // Persist raw data in cache
        bookingCache.set(id, { instructor: postData, slots: allSlots, ts: Date.now() });

        const now = new Date();
        const futureSlots = allSlots.filter(slot => new Date(slot.start_time_utc) > now);
        setAvailableSlots(futureSlots);
          
        if (!initialMonthSet.current && futureSlots.length > 0) {
          const earliest = futureSlots.reduce((a, b) => new Date(a.start_time_utc) < new Date(b.start_time_utc) ? a : b);
          setCurrentMonth(new Date(new Date(earliest.start_time_utc).getFullYear(), new Date(earliest.start_time_utc).getMonth()));
          initialMonthSet.current = true;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ── Resume active reservation if user accidentally left ───────────
  const resumeChecked = useRef(false);
  useEffect(() => {
    if (!isSignedIn || resumeChecked.current) return;
    // Only attempt resume once per mount, and only while on Step 1
    if (step !== 1) return;
    resumeChecked.current = true;

    const checkExistingReservation = async () => {
      try {
        const token = await getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(
          `${baseUrl}/api/bookings/slots/reserved/mine?post_id=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.reserved || data.reserved.length === 0 || data.ttl_seconds <= 0) return;

        // Restore reservation state — jump straight to Step 2
        const restoredSlots: SelectedSlot[] = data.reserved.map((r: AvailableSlot) => {
          const dt = new Date(r.start_time_utc);
          return {
            id: r.id,
            date: dt.toLocaleDateString("en-CA"), // YYYY-MM-DD
            time: dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            duration_minutes: r.duration_minutes,
          };
        });
        setSelectedSlots(restoredSlots);
        reservedSlotIdsRef.current = data.reserved.map((r: { id: string }) => r.id);
        setReservedUntilUtc(data.reserved_until_utc);
        setSecondsLeft(data.ttl_seconds);
        setReservationExpired(false);
        setStep(2);
      } catch {
        // Non-critical — user just starts fresh
      }
    };

    checkExistingReservation();
  }, [isSignedIn, id, getToken, step]);

  // ── Countdown timer for reservation hold ──────────────────────────
  useEffect(() => {
    if (!reservedUntilUtc) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(reservedUntilUtc).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        setReservationExpired(true);
        setReservedUntilUtc(null);
        reservedSlotIdsRef.current = [];
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [reservedUntilUtc]);

  // ── Release reservation (called explicitly by Back / Cancel buttons) ──
  const releaseReservation = useCallback(async () => {
    const ids = reservedSlotIdsRef.current;
    if (ids.length === 0) return;
    try {
      const token = await getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${baseUrl}/api/bookings/slots/release`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_ids: ids }),
        keepalive: true,
      });
    } catch {
      // best effort
    }
    reservedSlotIdsRef.current = [];
    setReservedUntilUtc(null);
    setSecondsLeft(0);
  }, [getToken]);

  // No auto-release on unmount — allows reservations to survive page
  // refresh / accidental navigation.  Server lazy cleanup expires them
  // after 10 minutes if never confirmed.

  // ── Reserve slots when moving to Step 2 ───────────────────────────
  const handleContinueToConfirm = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/instructors/${id}/book`);
      return;
    }

    setReserving(true);
    setBookingError(null);
    setReservationExpired(false);

    try {
      const token = await getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/bookings/slots/reserve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_ids: selectedSlots.map(s => s.id) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Reservation failed" }));
        throw new Error(data.detail || "Failed to reserve slots");
      }

      const data = await res.json();

      if (data.failed_slot_ids && data.failed_slot_ids.length > 0) {
        // Remove failed slots from selection
        const failedSet = new Set(data.failed_slot_ids as string[]);
        setSelectedSlots(prev => prev.filter(s => !failedSet.has(s.id)));
        if (data.reserved.length === 0) {
          throw new Error(t("booking.slotsAlreadyTaken"));
        }
      }

      reservedSlotIdsRef.current = data.reserved.map((r: { id: string }) => r.id);
      setReservedUntilUtc(data.reserved_until_utc);
      setSecondsLeft(data.ttl_seconds);
      setStep(2);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Reservation failed");
    } finally {
      setReserving(false);
    }
  };

  // ── Handle reservation expiry ─────────────────────────────────────
  const handleReservationExpired = () => {
    setReservationExpired(false);
    setBookingError(null);
    setStep(1);
  };

  // Group slots by date (local time)
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const localDate = new Date(slot.start_time_utc);
    const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(localDate.getHours()).padStart(2, '0')}:${String(localDate.getMinutes()).padStart(2, '0')}`;
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push({ 
      id: slot.id, 
      time: timeStr, 
      duration_minutes: slot.duration_minutes 
    });
    return acc;
  }, {} as Record<string, { id: string; time: string; duration_minutes: number }[]>);

  const handleSlotSelect = (date: string, slotId: string, time: string, duration: number) => {
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.id === slotId);
      if (exists) {
        return prev.filter(s => s.id !== slotId);
      }
      return [...prev, { id: slotId, date, time, duration_minutes: duration }];
    });
  };

  const handleConfirm = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/instructors/${id}/book`);
      return;
    }

    // Check if reservation has expired
    if (secondsLeft <= 0 && !reservedUntilUtc) {
      setReservationExpired(true);
      return;
    }

    setBooking(true);
    setBookingError(null);

    try {
      const token = await getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Confirm all reserved slots in one request
      const res = await fetch(`${baseUrl}/api/bookings/slots/confirm`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slot_ids: selectedSlots.map(s => s.id),
          mode: "city",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Booking failed" }));
        throw new Error(errorData.detail || "Booking failed");
      }

      const data = await res.json();
      if (data.failed_slot_ids && data.failed_slot_ids.length > 0) {
        throw new Error(t("booking.someSlotsFailed"));
      }

      // Clear reservation tracking (slots are now booked)
      reservedSlotIdsRef.current = [];
      setReservedUntilUtc(null);

      router.replace(`/${locale}/dashboard/lessons`);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed. Please try again.");
      setBooking(false);
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    
    return { days, startDay };
  };

  const { days, startDay } = getDaysInMonth(currentMonth);
  const weekDays = [
    t("booking.weekMon"), t("booking.weekTue"), t("booking.weekWed"),
    t("booking.weekThu"), t("booking.weekFri"), t("booking.weekSat"), t("booking.weekSun"),
  ];

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const isDateAvailable = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return !!slotsByDate[dateStr];
  };

  const isDateSelected = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return viewingDate === dateStr;
  };

  const isDateHasSelection = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedSlots.some(s => s.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (slotsByDate[dateStr]) {
      setViewingDate(dateStr);
    }
  };

  const formatTimeRange = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    
    const endDate = new Date(date.getTime() + durationMinutes * 60000);
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    
    return `${startTime} - ${endHours}:${endMinutes}`;
  };

  // Calculate total duration from selected slots
  const totalDuration = selectedSlots.reduce((sum, slot) => sum + slot.duration_minutes, 0);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#F03D3D]" />
          <p className="text-gray-500">{t("booking.loadingDetails")}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("booking.somethingWentWrong")}</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link
              href={`/instructors/${id}`}
              className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("booking.backToProfile")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link 
            href={`/instructors/${id}`}
            className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("booking.backToProfile")}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t("booking.bookALesson")}</h1>
          <p className="text-gray-500 mt-2">
            {t("booking.with")} {instructorName} <span className="text-gray-400">(₾{price}{t("booking.perLesson")})</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
            <span className="font-medium hidden sm:inline">{t("booking.stepTime")}</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
            <span className="font-medium hidden sm:inline">{t("booking.stepConfirm")}</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>3</div>
            <span className="font-medium hidden sm:inline">{t("booking.stepPayment")}</span>
          </div>
        </div>

        {/* Step 1: Select Time */}
        {step === 1 && availableSlots.length === 0 && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("booking.noAvailableSlots")}</h2>
            <p className="text-gray-500 mb-6">
              {t("booking.noSlotsDescription")} <br />
              {t("booking.checkBackLater")}
            </p>
            <Link
              href={`/instructors/${id}`}
              className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("booking.backToProfile")}
            </Link>
          </div>
        )}

        {step === 1 && availableSlots.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 items-stretch">
            {/* Calendar Column */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {currentMonth.toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1;
                  const available = isDateAvailable(day);
                  const selected = isDateSelected(day);
                  const hasSelection = isDateHasSelection(day);
                  
                  return (
                    <button
                      key={day}
                      disabled={!available}
                      onClick={() => handleDateClick(day)}
                      className={`
                        aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all relative
                        ${selected 
                          ? "bg-gray-900 text-white shadow-lg" 
                          : available 
                            ? "bg-red-50 text-red-600 hover:bg-red-100 font-bold" 
                            : "text-gray-300 cursor-not-allowed"
                        }
                      `}
                    >
                      {day}
                      {hasSelection && (
                        <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${selected ? "bg-red-500" : "bg-[#F03D3D]"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 flex items-center gap-4 text-xs text-gray-500 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-50 border border-red-100" />
                  <span>{t("booking.legendAvailable")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-900" />
                  <span>{t("booking.legendViewing")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F03D3D]" />
                  <span>{t("booking.legendSelected")}</span>
                </div>
              </div>
            </div>

            {/* Time Slots Column */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm min-h-[400px] flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F03D3D]" />
                {t("booking.availableTimes")}
              </h2>

              {!viewingDate ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>{t("booking.selectDatePrompt")}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    {t("booking.availableSlotsFor")} <span className="font-bold text-gray-900">{new Date(viewingDate).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
                    {slotsByDate[viewingDate]?.map((slotInfo) => {
                      const isSelected = selectedSlots.some(s => s.id === slotInfo.id);
                      return (
                        <button
                          key={slotInfo.id}
                          onClick={() => handleSlotSelect(viewingDate, slotInfo.id, slotInfo.time, slotInfo.duration_minutes)}
                          className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                            isSelected
                              ? "bg-[#F03D3D] text-white border-[#F03D3D] shadow-lg shadow-red-500/20 scale-105"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100"
                          }`}
                        >
                          {formatTimeRange(slotInfo.time, slotInfo.duration_minutes)}
                          {isSelected && <CheckCircle className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-100">
                    {bookingError && step === 1 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{bookingError}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500 text-sm">{selectedSlots.length} {t("booking.slotsSelected")} ({totalDuration} {t("booking.min")})</span>
                      <span className="font-bold text-gray-900">₾{selectedSlots.length * price}</span>
                    </div>

                    {viewingDate && selectedSlots.some(s => s.date === viewingDate) ? (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 mb-3">{t("booking.wantAnotherDay")}</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setViewingDate(null)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all"
                          >
                            <PlusCircle className="w-4 h-4" />
                            {t("booking.addAnotherDay")}
                          </button>
                          <Button
                            disabled={reserving}
                            onClick={handleContinueToConfirm}
                            className="flex-1 relative"
                          >
                            <span className={reserving ? "invisible" : ""}>{t("booking.doneSelectingDays")}</span>
                            {reserving && (
                              <span className="absolute inset-0 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("booking.reserving")}
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        disabled={selectedSlots.length === 0 || reserving}
                        onClick={handleContinueToConfirm}
                        className="w-full relative"
                      >
                        <span className={reserving ? "invisible" : ""}>{t("booking.continueToConfirm")}</span>
                        {reserving && (
                          <span className="absolute inset-0 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("booking.reserving")}
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Reservation Expired Overlay ──────────────────────── */}
            {reservationExpired && (
              <div className="bg-white rounded-3xl border border-red-200 p-8 shadow-sm text-center mb-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t("booking.reservationExpiredTitle")}</h2>
                <p className="text-gray-500 mb-6">{t("booking.reservationExpiredDesc")}</p>
                <Button onClick={handleReservationExpired} className="px-8">
                  {t("booking.selectNewSlots")}
                </Button>
              </div>
            )}

            {!reservationExpired && (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            {/* ── Countdown Timer Banner ──────────────────────────── */}
            {secondsLeft > 0 && (
              <div className={`flex items-center justify-between rounded-2xl p-4 mb-6 border transition-colors ${
                secondsLeft <= 60 
                  ? "bg-red-50 border-red-200" 
                  : secondsLeft <= 180 
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex items-center gap-3">
                  <Timer className={`w-5 h-5 ${
                    secondsLeft <= 60 ? "text-red-500 animate-pulse" : secondsLeft <= 180 ? "text-amber-500" : "text-blue-500"
                  }`} />
                  <div>
                    <p className={`font-medium text-sm ${
                      secondsLeft <= 60 ? "text-red-800" : secondsLeft <= 180 ? "text-amber-800" : "text-blue-800"
                    }`}>
                      {t("booking.slotsReservedFor")}
                    </p>
                    <p className={`text-xs ${
                      secondsLeft <= 60 ? "text-red-600" : secondsLeft <= 180 ? "text-amber-600" : "text-blue-600"
                    }`}>
                      {t("booking.completeBeforeExpiry")}
                    </p>
                  </div>
                </div>
                <div className={`text-2xl font-mono font-bold tabular-nums ${
                  secondsLeft <= 60 ? "text-red-600" : secondsLeft <= 180 ? "text-amber-600" : "text-blue-600"
                }`}>
                  {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#F03D3D]" />
              {t("booking.confirmBooking")}
            </h2>

            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">{t("booking.bookingFailed")}</p>
                  <p className="text-sm text-red-600 mt-1">{bookingError}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{instructorName}</h3>
                  <p className="text-gray-500">{selectedSlots.length} {selectedSlots.length > 1 ? t("booking.drivingLessons") : t("booking.drivingLesson")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">₾{price * selectedSlots.length}</p>
                  <p className="text-gray-500">{totalDuration} {t("booking.min")} {t("booking.total")}</p>
                </div>
              </div>
              
              <div className="h-px bg-gray-200 my-4" />
              
              <div className="space-y-4">
                {Object.entries(
                  selectedSlots.reduce((acc, slot) => {
                    if (!acc[slot.date]) acc[slot.date] = [];
                    acc[slot.date].push(slot);
                    return acc;
                  }, {} as Record<string, typeof selectedSlots>)
                )
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .map(([date, slots]) => (
                  <div key={date} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-center gap-2 mb-3 text-gray-900 font-medium border-b border-gray-100 pb-2">
                      <CalendarIcon className="w-4 h-4 text-[#F03D3D]" />
                      {new Date(date).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.sort((a, b) => a.time.localeCompare(b.time)).map((slot) => (
                        <div key={slot.id} className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatTimeRange(slot.time, slot.duration_minutes)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-8">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl text-gray-600 text-sm">
                <Info className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                <p>{t("booking.cancellationPolicy")}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button
                onClick={async () => {
                  await releaseReservation();
                  setBookingError(null);
                  setStep(1);
                }}
                className="text-gray-500 font-medium hover:text-gray-900 transition-colors ml-4"
              >
                {t("booking.back")}
              </button>
              <Button
                onClick={() => setStep(3)}
                disabled={secondsLeft <= 0}
                className="px-8"
              >
                {t("booking.confirm")}
              </Button>
            </div>
            </div>
            )}
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Payment Form */}
              <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F03D3D]" />
                  {t("booking.paymentTitle")}
                </h2>
                <p className="text-sm text-gray-500 mb-6">{t("booking.paymentSubtitle")}</p>

                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{bookingError}</p>
                  </div>
                )}

                {/* BOG redirect notice */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">{t("booking.bogRedirectNote")}</p>
                </div>

                {/* Mock card form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("booking.cardNumber")}</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t("booking.cardNumberPlaceholder")}
                        maxLength={19}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors pr-12"
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                          e.target.value = v.replace(/(.{4})/g, "$1 ").trim();
                        }}
                      />
                      <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("booking.cardHolder")}</label>
                    <input
                      type="text"
                      placeholder={t("booking.cardHolderPlaceholder")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("booking.expiryDate")}</label>
                      <input
                        type="text"
                        placeholder={t("booking.expiryPlaceholder")}
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          e.target.value = v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("booking.cvv")}</label>
                      <input
                        type="text"
                        placeholder={t("booking.cvvPlaceholder")}
                        maxLength={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                        onChange={e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3); }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("booking.billingAddress")}</label>
                    <input
                      type="text"
                      placeholder={t("booking.billingAddressPlaceholder")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => { setBookingError(null); setStep(2); }}
                    disabled={booking}
                    className="text-gray-500 font-medium hover:text-gray-900 transition-colors disabled:opacity-50 ml-4"
                  >
                    {t("booking.back")}
                  </button>
                  <Button
                    onClick={handleConfirm}
                    disabled={booking || secondsLeft <= 0}
                    className="px-8 relative"
                  >
                    <span className={booking ? "invisible" : ""}>{t("booking.payNow")}{price * selectedSlots.length}</span>
                    {booking && (
                      <span className="absolute inset-0 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("booking.paying")}
                      </span>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                  <Lock className="w-3 h-3" />
                  <span>{t("booking.securePayment")}</span>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
                  <h3 className="font-bold text-gray-900 mb-4">{t("booking.orderSummary")}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{instructorName}</span>
                    </div>
                    {instructor?.located_at && (
                      <div className="flex items-start gap-1.5 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                        {instructor.google_maps_url ? (
                          <a
                            href={instructor.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#F03D3D] transition-colors underline underline-offset-2"
                          >
                            {extractCityName(instructor.located_at)}
                          </a>
                        ) : (
                          <span>{extractCityName(instructor.located_at)}</span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{selectedSlots.length} {selectedSlots.length > 1 ? t("booking.drivingLessons") : t("booking.drivingLesson")}</span>
                      <span className="text-gray-700 font-medium">₾{price * selectedSlots.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{totalDuration} {t("booking.min")} {t("booking.total")}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span>₾{price * selectedSlots.length}</span>
                    </div>
                  </div>
                  {secondsLeft > 0 && (
                    <div className={`mt-4 flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${
                      secondsLeft <= 60 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      <Timer className="w-3.5 h-3.5 shrink-0" />
                      <span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")} {t("booking.completeBeforeExpiry")}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
