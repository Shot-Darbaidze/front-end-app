"use client";

import React, { useState, use, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, FileText, Info, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";

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
}

type SelectedSlot = {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
};

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  
  const [step, setStep] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notes, setNotes] = useState("");
  
  // API data state
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [instructor, setInstructor] = useState<InstructorPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Derived instructor info
  const instructorName = instructor 
    ? [instructor.applicant_first_name, instructor.applicant_last_name].filter(Boolean).join(" ") || "Instructor"
    : "Loading...";
  
  const price = instructor
    ? (instructor.automatic_city_price ?? instructor.manual_city_price ?? 0)
    : 0;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        // Fetch instructor post and available slots in parallel
        const [postRes, slotsRes] = await Promise.all([
          fetch(`${baseUrl}/api/posts/${id}`, { cache: "no-store" }),
          fetch(`${baseUrl}/api/bookings/by-post/${id}?status=available&limit=500`, { cache: "no-store" }),
        ]);

        if (!postRes.ok) {
          throw new Error("Failed to load instructor");
        }

        const postData = await postRes.json() as InstructorPost;
        setInstructor(postData);

        if (slotsRes.ok) {
          const slotsData = await slotsRes.json() as AvailableSlot[];
          setAvailableSlots(slotsData);
          
          // Set current month to earliest slot or today
          if (slotsData.length > 0) {
            const earliestSlot = slotsData.reduce((earliest, slot) => 
              new Date(slot.start_time_utc) < new Date(earliest.start_time_utc) ? slot : earliest
            );
            const earliestDate = new Date(earliestSlot.start_time_utc);
            setCurrentMonth(new Date(earliestDate.getFullYear(), earliestDate.getMonth()));
          }
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

    setBooking(true);
    setBookingError(null);

    try {
      const token = await getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Book each slot individually with city mode
      const bookingPromises = selectedSlots.map(slot =>
        fetch(`${baseUrl}/api/bookings/slots/${slot.id}/book?mode=city`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );
      
      const results = await Promise.all(bookingPromises);
      
      // Check if any failed
      const failedResults = results.filter(r => !r.ok);
      if (failedResults.length > 0) {
        const errorData = await failedResults[0].json().catch(() => ({ detail: "Booking failed" }));
        throw new Error(errorData.detail || "Some bookings failed");
      }
      
      // All bookings successful - redirect to lessons page
      router.push("/dashboard/lessons");
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
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
          <p className="text-gray-500">Loading booking details...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link
              href={`/instructors/${id}`}
              className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Profile
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
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Book a Lesson</h1>
          <p className="text-gray-500 mt-2">
            with {instructorName} <span className="text-gray-400">(₾{price}/lesson)</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
            <span className="font-medium hidden sm:inline">Time</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
            <span className="font-medium hidden sm:inline">Confirm</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-[#F03D3D]" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? "bg-[#F03D3D] text-white" : "bg-gray-200 text-gray-500"}`}>3</div>
            <span className="font-medium hidden sm:inline">Done</span>
          </div>
        </div>

        {/* Step 1: Select Time */}
        {step === 1 && availableSlots.length === 0 && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Available Slots</h2>
            <p className="text-gray-500 mb-6">
              This instructor hasn't set up any available time slots yet. <br />
              Please check back later or try another instructor.
            </p>
            <Link
              href={`/instructors/${id}`}
              className="inline-flex items-center text-sm text-[#F03D3D] hover:text-[#d62f2f] transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Profile
            </Link>
          </div>
        )}

        {step === 1 && availableSlots.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 items-stretch">
            {/* Calendar Column */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-900" />
                  <span>Viewing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F03D3D]" />
                  <span>Selected</span>
                </div>
              </div>
            </div>

            {/* Time Slots Column */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm min-h-[400px] flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F03D3D]" />
                Available Times
              </h2>

              {!viewingDate ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a date from the calendar to see available time slots</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Available slots for <span className="font-bold text-gray-900">{new Date(viewingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
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
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500 text-sm">{selectedSlots.length} slots selected ({totalDuration} min)</span>
                      <span className="font-bold text-gray-900">₾{selectedSlots.length * price}</span>
                    </div>
                    <Button 
                      disabled={selectedSlots.length === 0}
                      onClick={() => setStep(2)}
                      className="w-full"
                    >
                      Continue to Confirm
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#F03D3D]" />
              Confirm Booking
            </h2>

            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Booking failed</p>
                  <p className="text-sm text-red-600 mt-1">{bookingError}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{instructorName}</h3>
                  <p className="text-gray-500">{selectedSlots.length} Driving Lesson{selectedSlots.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">₾{price * selectedSlots.length}</p>
                  <p className="text-gray-500">{totalDuration} min total</p>
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
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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

            {/* Additional Details Form */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes for Instructor (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or things the instructor should know?"
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#F03D3D] focus:ring-1 focus:ring-[#F03D3D] outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl text-gray-600 text-sm">
                <Info className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                <p>Free cancellation up to 24 hours before the lesson start time. Late cancellations may be charged 50% of the lesson fee.</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button 
                onClick={() => setStep(1)}
                disabled={booking}
                className="text-gray-500 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <Button 
                onClick={handleConfirm}
                disabled={booking}
                className="px-8"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Redirecting to Payment...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-100 p-12 shadow-sm text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-8">
              Your {selectedSlots.length} {mode} lesson{selectedSlots.length > 1 ? 's' : ''} with {instructorName} have been scheduled. <br />
              You'll receive a confirmation email shortly.
            </p>
            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
