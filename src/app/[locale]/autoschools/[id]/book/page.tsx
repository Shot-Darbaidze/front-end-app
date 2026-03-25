"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  Info,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import AvailableTimeSlotsCard, {
  type BookingSlot,
} from "@/components/autoschool-profile/AvailableTimeSlotsCard";
import BookingCalendarCard from "@/components/autoschool-profile/BookingCalendarCard";
import BookingPricingCard, {
  type BookingOption,
} from "@/components/autoschool-profile/BookingPricingCard";
import InstructorSelectionCard, {
  type InstructorOption,
} from "@/components/autoschool-profile/InstructorSelectionCard";
import Button from "@/components/ui/Button";

type BookingMode = "package" | "single";

const AUTOSCHOOL_NAME = "ავტო სკოლა";
const LOCATION = "თბილისი";

const INSTRUCTOR_OPTIONS: InstructorOption[] = [
  { id: "i1", name: "გიორგი მ.", transmission: "Manual", imageUrl: "/images/404/profile.jpg" },
  { id: "i2", name: "ნინო კ.", transmission: "Automatic", imageUrl: "/images/404/instructor.png" },
  { id: "i3", name: "დავით ლ.", transmission: "Manual / Auto", imageUrl: "/images/404/instru.png" },
  { id: "i4", name: "მარიამ გ.", transmission: "Manual", imageUrl: "/uploads/vehicle/photo-1-1758707708701-instru.png" },
];

const PACKAGE_OPTIONS: BookingOption[] = [
  { id: "standard", name: "სტანდარტული", lessons: 8, price: 350, description: "დამწყებთათვის" },
  { id: "intensive", name: "ინტენსიური", lessons: 12, price: 450, originalPrice: 600, description: "ყველაზე პოპულარული" },
  { id: "vip", name: "VIP", lessons: 20, price: 620, description: "ინდივიდუალური გრაფიკი" },
];

const SINGLE_OPTION: BookingOption = {
  id: "single",
  name: "სათითაო გაკვეთილი",
  lessons: 1,
  price: 50,
  description: "1 სტანდარტული გაკვეთილი · 60 წთ",
};

const MOCK_SLOTS_BY_DATE: Record<string, BookingSlot[]> = {
  "2026-03-26": [
    { id: "s0", time: "09:00", durationMinutes: 60 },
    { id: "s1", time: "10:00", durationMinutes: 60 },
    { id: "s2", time: "12:00", durationMinutes: 60 },
    { id: "s2b", time: "14:00", durationMinutes: 60 },
    { id: "s3", time: "16:00", durationMinutes: 60 },
  ],
  "2026-03-27": [
    { id: "s3b", time: "09:00", durationMinutes: 60 },
    { id: "s4", time: "11:00", durationMinutes: 60 },
    { id: "s5", time: "14:00", durationMinutes: 60 },
    { id: "s5b", time: "16:00", durationMinutes: 60 },
    { id: "s6", time: "18:00", durationMinutes: 60 },
  ],
  "2026-03-28": [
    { id: "s6b", time: "09:00", durationMinutes: 60 },
    { id: "s7", time: "10:00", durationMinutes: 60 },
    { id: "s7b", time: "12:00", durationMinutes: 60 },
    { id: "s8", time: "13:00", durationMinutes: 60 },
    { id: "s8b", time: "15:00", durationMinutes: 60 },
    { id: "s8c", time: "17:00", durationMinutes: 60 },
  ],
  "2026-03-31": [
    { id: "s9", time: "09:00", durationMinutes: 60 },
    { id: "s9b", time: "11:00", durationMinutes: 60 },
    { id: "s9c", time: "13:00", durationMinutes: 60 },
    { id: "s10", time: "15:00", durationMinutes: 60 },
    { id: "s10b", time: "17:00", durationMinutes: 60 },
  ],
  "2026-04-02": [
    { id: "s10c", time: "09:00", durationMinutes: 60 },
    { id: "s10d", time: "10:30", durationMinutes: 60 },
    { id: "s11", time: "12:00", durationMinutes: 60 },
    { id: "s11b", time: "14:30", durationMinutes: 60 },
    { id: "s12", time: "17:00", durationMinutes: 60 },
  ],
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatTimeRange = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  const endDate = new Date(date.getTime() + durationMinutes * 60000);
  return `${startTime} - ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
};

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  return { days, startDay };
};

export default function AutoschoolBookingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const searchParams = useSearchParams();
  const initialMode: BookingMode = searchParams.get("mode") === "single" ? "single" : "package";
  const initialPackageId = searchParams.get("package") ?? PACKAGE_OPTIONS[1].id;

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<BookingMode>(initialMode);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackageId);
  const [selectedInstructorId, setSelectedInstructorId] = useState(INSTRUCTOR_OPTIONS[0].id);
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-03-01T00:00:00"));
  const [viewingDate, setViewingDate] = useState<string | null>(Object.keys(MOCK_SLOTS_BY_DATE)[0] ?? null);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const hasMountedRef = useRef(false);
  const timeSlotsRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => {
    if (mode === "single") return SINGLE_OPTION;
    return PACKAGE_OPTIONS.find((item) => item.id === selectedPackageId) ?? PACKAGE_OPTIONS[0];
  }, [mode, selectedPackageId]);

  const selectedSlots = useMemo(() => {
    const allSlots = Object.values(MOCK_SLOTS_BY_DATE).flat();
    return allSlots.filter((slot) => selectedSlotIds.includes(slot.id));
  }, [selectedSlotIds]);

  const selectedInstructor = useMemo(
    () => INSTRUCTOR_OPTIONS.find((item) => item.id === selectedInstructorId) ?? INSTRUCTOR_OPTIONS[0],
    [selectedInstructorId]
  );
  const requiredSlotCount = selectedOption.lessons;

  const { days, startDay } = getDaysInMonth(currentMonth);

  const handleModeChange = (nextMode: BookingMode) => {
    setMode(nextMode);
    setSelectedSlotIds([]);
    setBookingError(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const isDateAvailable = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    return Boolean(MOCK_SLOTS_BY_DATE[dateStr]?.length);
  };

  const isDateSelected = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    return viewingDate === dateStr;
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-${pad(day)}`;
    if (!MOCK_SLOTS_BY_DATE[dateStr]?.length) return;
    setViewingDate(dateStr);
    setBookingError(null);
  };

  const handleContinueToConfirm = () => {
    if (selectedSlotIds.length === 0) {
      setBookingError("აირჩიე მინიმუმ ერთი დრო, რომ შემდეგ ეტაპზე გადავიდეთ.");
      return;
    }

    if (selectedSlotIds.length < requiredSlotCount) {
      setBookingError(`ამ არჩევანისთვის საჭიროა ზუსტად ${requiredSlotCount} გაკვეთილის მონიშვნა.`);
      return;
    }

    setBookingError(null);
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setBooking(true);
    setBookingError(null);

    await new Promise((resolve) => setTimeout(resolve, 900));

    setBooking(false);
    setSubmitted(true);
  };

  const scrollToTimeSlots = () => {
    timeSlotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, submitted]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ჯავშანი მიღებულია</h1>
            <p className="text-gray-500 mb-6">
              თქვენი მოთხოვნა წარმატებით გაიგზავნა. დეტალების დასადასტურებლად ავტოსკოლა დაგიკავშირდებათ.
            </p>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-left max-w-xl mx-auto mb-6">
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-500">ფორმატი</span>
                <span className="font-semibold text-gray-900">
                  {mode === "single" ? "სათითაო გაკვეთილი" : "კურსის პაკეტი"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-500">არჩევანი</span>
                <span className="font-semibold text-gray-900">{selectedOption.name}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-500">ინსტრუქტორი</span>
                <span className="font-semibold text-gray-900">{selectedInstructor.name}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-500">თარიღი და დრო</span>
                <span className="font-semibold text-gray-900 text-right">
                  {selectedSlots.length > 0
                    ? selectedSlots
                        .map((slot) => formatTimeRange(slot.time, slot.durationMinutes))
                        .join(", ")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500">ფასი</span>
                <span className="font-semibold text-gray-900">₾{selectedOption.price}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href={`/${locale}/autoschools/${id}`}>პროფილზე დაბრუნება</Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => {
                setSubmitted(false);
                setStep(1);
                setSelectedSlotIds([]);
              }}>
                ახალი ჯავშანი
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center">
          <Link
            href={`/${locale}/autoschools/${id}`}
            className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            ავტოსკოლის პროფილზე დაბრუნება
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">გაკვეთილის დაჯავშნა</h1>
          <p className="text-gray-500 mt-2">
            {AUTOSCHOOL_NAME} <span className="text-gray-400">({LOCATION})</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
            <span className="font-medium hidden sm:inline">არჩევა</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
            <span className="font-medium hidden sm:inline">დადასტურება</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>3</div>
            <span className="font-medium hidden sm:inline">გადახდა</span>
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <BookingPricingCard
                mode={mode}
                selectedPackageId={selectedPackageId}
                packages={PACKAGE_OPTIONS}
                singleOption={SINGLE_OPTION}
                onModeChange={handleModeChange}
                onPackageSelect={(packageId) => {
                  setSelectedPackageId(packageId);
                  setSelectedSlotIds([]);
                  setBookingError(null);
                }}
              />

              <BookingCalendarCard
                currentMonth={currentMonth}
                days={days}
                startDay={startDay}
                isDateAvailable={isDateAvailable}
                isDateSelected={isDateSelected}
                onDateClick={handleDateClick}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
              />
            </div>

            <div ref={timeSlotsRef} className="lg:col-span-8">
              <InstructorSelectionCard
                instructors={INSTRUCTOR_OPTIONS}
                selectedInstructorId={selectedInstructorId}
                onSelect={setSelectedInstructorId}
              />

              <AvailableTimeSlotsCard
                viewingDate={viewingDate}
                slots={viewingDate ? (MOCK_SLOTS_BY_DATE[viewingDate] ?? []) : []}
                selectedSlotIds={selectedSlotIds}
                bookingError={bookingError}
                selectedOptionLabel={`${selectedOption.name} · არჩეული დროები: ${selectedSlotIds.length}/${requiredSlotCount}`}
                selectedOptionPrice={selectedOption.price}
                onSelectSlot={(slotId) => {
                  setSelectedSlotIds((currentSlotIds) => {
                    if (currentSlotIds.includes(slotId)) {
                      setBookingError(null);
                      return currentSlotIds.filter((id) => id !== slotId);
                    }

                    if (currentSlotIds.length >= requiredSlotCount) {
                      setBookingError(`ამ არჩევანისთვის მაქსიმუმ ${requiredSlotCount} გაკვეთილის მონიშვნაა შესაძლებელი.`);
                      return currentSlotIds;
                    }

                    setBookingError(null);
                    return [...currentSlotIds, slotId];
                  });
                }}
                onContinue={handleContinueToConfirm}
                formatTimeRange={formatTimeRange}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#F03D3D]" />
                ჯავშნის დადასტურება
              </h2>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{AUTOSCHOOL_NAME}</h3>
                    <p className="text-gray-500">
                      {mode === "single" ? "სათითაო გაკვეთილი" : "კურსის პაკეტი"} · {selectedOption.name}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      ინსტრუქტორი: {selectedInstructor.name} · {selectedInstructor.transmission}
                    </p>
                  </div>
                  <div className="text-right">
                    <div>
                      {selectedOption.originalPrice && selectedOption.originalPrice > selectedOption.price && (
                        <p className="text-sm text-gray-400 line-through">₾{selectedOption.originalPrice}</p>
                      )}
                      <p className="font-bold text-gray-900 text-lg">₾{selectedOption.price}</p>
                    </div>
                    <p className="text-gray-500">{selectedSlotIds.length} არჩეული დრო</p>
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-4" />

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-center gap-2 mb-3 text-gray-900 font-medium border-b border-gray-100 pb-2">
                    <CalendarIcon className="w-4 h-4 text-[#F03D3D]" />
                    {viewingDate}
                  </div>
                  <div className="space-y-2">
                    {selectedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2"
                      >
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatTimeRange(slot.time, slot.durationMinutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl text-gray-600 text-sm">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                  <p>
                    მოთხოვნის დადასტურების შემდეგ ავტოსკოლა დაგიკავშირდებათ და საჭიროების შემთხვევაში
                    შეგითანხმებთ ზუსტ ინსტრუქტორს, ავტომობილს და დაწყების პირობებს.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(scrollToTimeSlots);
                    });
                  }}
                  className="text-gray-500 font-medium hover:text-gray-900 transition-colors ml-4"
                >
                  უკან
                </button>
                <Button onClick={() => setStep(3)} className="px-8">
                  დადასტურება
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F03D3D]" />
                  გადახდა
                </h2>
                <p className="text-sm text-gray-500 mb-6">გადახდის დასასრულებლად შეავსე ბარათის დეტალები.</p>

                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{bookingError}</p>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    გადახდის დასრულების შემდეგ ჯავშანი გადავა დამუშავებაზე და მიიღებთ დადასტურებას.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ბარათის ნომერი</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors pr-12"
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 16);
                          event.target.value = value.replace(/(.{4})/g, "$1 ").trim();
                        }}
                      />
                      <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ბარათის მფლობელი</label>
                    <input
                      type="text"
                      placeholder="NIKA GIORGADZE"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">ვადა</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 4);
                          event.target.value = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                        onChange={(event) => {
                          event.target.value = event.target.value.replace(/\D/g, "").slice(0, 3);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">გადამხდელის მისამართი</label>
                    <input
                      type="text"
                      placeholder="თბილისი, საქართველო"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={booking}
                    className="text-gray-500 font-medium hover:text-gray-900 transition-colors disabled:opacity-50 ml-4"
                  >
                    უკან
                  </button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={booking}
                    className="px-8 relative"
                  >
                    <span className={booking ? "invisible" : ""}>გადახდა ₾{selectedOption.price}</span>
                    {booking && (
                      <span className="absolute inset-0 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        მუშავდება
                      </span>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                  <Lock className="w-3 h-3" />
                  <span>დაცული გადახდა</span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
                  <h3 className="font-bold text-gray-900 mb-4">შეკვეთის შეჯამება</h3>
                  <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-500">{AUTOSCHOOL_NAME}</div>
                  <div className="text-sm text-gray-500">{LOCATION}</div>
                  <div className="text-sm text-gray-500">
                    {selectedInstructor.name} · {selectedInstructor.transmission}
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{selectedOption.name}</span>
                      <div className="text-right">
                        {selectedOption.originalPrice && selectedOption.originalPrice > selectedOption.price && (
                          <div className="text-[11px] text-gray-400 line-through">₾{selectedOption.originalPrice}</div>
                        )}
                        <span className="text-gray-700 font-medium">₾{selectedOption.price}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{selectedSlotIds.length} არჩეული დრო</span>
                      <span>{selectedSlots.length > 0 ? selectedSlots.map((slot) => slot.time).join(", ") : "-"}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>ჯამი</span>
                      <span>₾{selectedOption.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
