"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAutoschoolFinances,
  getSchoolInstructors,
  withdrawAutoschoolEarnings,
  type AutoschoolFinanceMetric,
  type AutoschoolFinancesData,
  type AutoschoolInstructorFinances,
} from "@/services/autoschoolService";
import { Wallet, TrendingUp, Clock, CheckCircle, User, Users, ChevronDown, ChevronUp, AlertCircle, CalendarDays, SlidersHorizontal } from "lucide-react";

const LIVE_REFRESH_MS = 15000;
const FINANCES_CACHE_TTL_MS = 2 * 60 * 1000;
const FINANCES_CACHE_PREFIX = "autoschool-finances-v1";
const MEMBER_CACHE_PREFIX = "autoschool-finances-members-v1";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "GEL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface AutoschoolFinancesProps {
  schoolId: string;
}

type DateRange = {
  fromDate: string;
  toDate: string;
};

type RangePreset = "default" | "today" | "7d" | "30d" | "custom";

function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

type FinancesCachePayload = {
  timestamp: number;
  data: AutoschoolFinancesData;
};

type MemberOptionsCachePayload = {
  timestamp: number;
  data: Array<{ postId: string; name: string }>;
};

function readFinancesCache(
  schoolId: string,
  scopeKey: string,
): AutoschoolFinancesData | null {
  if (typeof window === "undefined") return null;

  const key = `${FINANCES_CACHE_PREFIX}:${schoolId}:${scopeKey}`;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinancesCachePayload;
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > FINANCES_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writeFinancesCache(
  schoolId: string,
  scopeKey: string,
  data: AutoschoolFinancesData,
) {
  if (typeof window === "undefined") return;

  const key = `${FINANCES_CACHE_PREFIX}:${schoolId}:${scopeKey}`;
  try {
    const payload: FinancesCachePayload = { timestamp: Date.now(), data };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

function readMemberOptionsCache(
  schoolId: string,
  language: string,
): Array<{ postId: string; name: string }> | null {
  if (typeof window === "undefined") return null;

  const key = `${MEMBER_CACHE_PREFIX}:${schoolId}:${language}`;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MemberOptionsCachePayload;
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > FINANCES_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writeMemberOptionsCache(
  schoolId: string,
  language: string,
  data: Array<{ postId: string; name: string }>,
) {
  if (typeof window === "undefined") return;

  const key = `${MEMBER_CACHE_PREFIX}:${schoolId}:${language}`;
  try {
    const payload: MemberOptionsCachePayload = { timestamp: Date.now(), data };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

function MoneyCard({
  label,
  amount,
  icon: Icon,
  color,
  active,
}: {
  label: string;
  amount: number;
  icon: typeof Wallet;
  color: "green" | "blue" | "amber" | "red";
  active?: boolean;
}) {
  const colorMap = {
    green: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-700",
    blue:  "border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700",
    amber: "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-700",
    red:   "border-red-200 bg-gradient-to-br from-red-50 to-white text-[#F03D3D]",
  };
  const iconBg = {
    green: "bg-emerald-100/90",
    blue:  "bg-blue-100/90",
    amber: "bg-amber-100/90",
    red:   "bg-red-100/90",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${colorMap[color]} ${
        active ? "ring-2 ring-blue-200 shadow-md shadow-blue-100/50" : "hover:-translate-y-0.5 hover:shadow-sm"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/60 blur-2xl" />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">
        {amount.toFixed(2)}
        <span className="text-sm font-semibold ml-1 opacity-60">₾</span>
      </p>
    </div>
  );
}

function InstructorRow({
  instructor,
  selected,
  onToggle,
  language,
}: {
  instructor: AutoschoolInstructorFinances;
  selected: boolean;
  onToggle: () => void;
  language: string;
}) {
  const name = [instructor.first_name, instructor.last_name].filter(Boolean).join(" ") || (language === "ka" ? "ინსტრუქტორი" : "Instructor");
  const canWithdraw = instructor.available_to_withdraw > 0 && !instructor.has_booked_lessons;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        selected ? "border-[#F03D3D] bg-red-50/50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${
          selected ? "border-[#F03D3D]" : "border-slate-200"
        }`}
      >
        {instructor.image_url ? (
          <img src={instructor.image_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
        <div className="flex flex-wrap gap-3 mt-0.5">
          <span className="text-xs text-slate-500">
            {language === "ka" ? "სულ:" : "Total:"}{" "}
            <span className="font-medium text-slate-700">{instructor.total_earned.toFixed(2)}₾</span>
          </span>
          <span className={`text-xs font-medium ${canWithdraw ? "text-emerald-600" : "text-slate-400"}`}>
            {language === "ka" ? "გამოსატანი:" : "Available:"}{" "}
            {instructor.available_to_withdraw.toFixed(2)}₾
          </span>
          {instructor.pending_release > 0 && (
            <span className="text-xs text-amber-600">
              {language === "ka" ? "მოლოდინში:" : "Pending:"}{" "}
              {instructor.pending_release.toFixed(2)}₾
            </span>
          )}
          {instructor.has_booked_lessons && (
            <span className="text-xs text-amber-700">
              {language === "ka" ? "დაჯავშნილი გაკვეთილები ჯერ უნდა დასრულდეს." : "Booked lessons must complete before payout."}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={!canWithdraw}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          !canWithdraw
            ? "border-slate-200 cursor-not-allowed opacity-40"
            : selected
            ? "border-[#F03D3D] bg-[#F03D3D]"
            : "border-slate-300 hover:border-[#F03D3D]"
        }`}
      >
        {selected && <CheckCircle className="w-3 h-3 text-white fill-white" />}
      </button>
    </div>
  );
}

export function AutoschoolFinances({ schoolId }: AutoschoolFinancesProps) {
  const { getToken } = useClerkAuth();
  const { language } = useLanguage();

  const oldestAllowedDateString = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [data, setData] = useState<AutoschoolFinancesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [activeMetric, setActiveMetric] = useState<AutoschoolFinanceMetric>("available_to_withdraw");
  const [draftRange, setDraftRange] = useState<DateRange>({ fromDate: "", toDate: "" });
  const [appliedRange, setAppliedRange] = useState<DateRange>({ fromDate: "", toDate: "" });
  const [selectedPreset, setSelectedPreset] = useState<RangePreset>("default");
  const [selectedMemberPostId, setSelectedMemberPostId] = useState<string>("all");
  const [memberOptions, setMemberOptions] = useState<Array<{ postId: string; name: string }>>([]);
  const [showInstructors, setShowInstructors] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const hasLoadedDataRef = useRef(false);
  const hasLoadedMembersRef = useRef(false);

  useEffect(() => {
    hasLoadedDataRef.current = data !== null;
  }, [data]);

  const load = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const scopeKey = [
      selectedMemberPostId || "all",
      activeMetric,
      appliedRange.fromDate || "",
      appliedRange.toDate || "",
    ].join("|");

    let suppressLoading = silent;
    let hasVisibleData = hasLoadedDataRef.current;
    if (!silent) {
      const cachedFinances = readFinancesCache(schoolId, scopeKey);
      if (cachedFinances) {
        setData(cachedFinances);
        setIsLoading(false);
        setError(null);
        const withBalance = cachedFinances.instructors
          .filter((i) => i.available_to_withdraw > 0 && !i.has_booked_lessons)
          .map((i) => i.post_id);
        setSelectedPostIds(new Set(withBalance));
        hasVisibleData = true;
        hasLoadedDataRef.current = true;
        suppressLoading = true;
      }
    }

    try {
      if (!suppressLoading) {
        setIsLoading(true);
      }
      const token = await getToken();
      if (!token) {
        if (!suppressLoading || !hasVisibleData) {
          setError("Not authorized.");
        }
        return;
      }

      if (!hasLoadedMembersRef.current) {
        const cachedMembers = readMemberOptionsCache(schoolId, language);
        if (cachedMembers) {
          setMemberOptions(cachedMembers);
          hasLoadedMembersRef.current = true;
        } else {
          const members = await getSchoolInstructors(schoolId, token);
          const options = members.map((member) => {
            const name = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim()
              || member.title
              || (language === "ka" ? "ინსტრუქტორი" : "Instructor");
            return { postId: member.id, name };
          });
          setMemberOptions(options);
          writeMemberOptionsCache(schoolId, language, options);
          hasLoadedMembersRef.current = true;
        }
      }

      const result = await getAutoschoolFinances(schoolId, token, {
        fromDate: appliedRange.fromDate || undefined,
        toDate: appliedRange.toDate || undefined,
        instructorPostId: selectedMemberPostId !== "all" ? selectedMemberPostId : undefined,
        metric: activeMetric,
      });

      writeFinancesCache(schoolId, scopeKey, result);
      setData(result);
      setError(null);
      // Auto-select all instructors with available balance
      const withBalance = result.instructors
        .filter((i) => i.available_to_withdraw > 0 && !i.has_booked_lessons)
        .map((i) => i.post_id);
      setSelectedPostIds(new Set(withBalance));
    } catch (e) {
      if (!suppressLoading || !hasVisibleData) {
        setError(e instanceof Error ? e.message : "Failed to load finances.");
      }
    } finally {
      if (!suppressLoading) {
        setIsLoading(false);
      }
    }
  }, [
    activeMetric,
    appliedRange.fromDate,
    appliedRange.toDate,
    getToken,
    language,
    schoolId,
    selectedMemberPostId,
  ]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void load({ silent: true });
    }, LIVE_REFRESH_MS);

    const handleFocus = () => {
      void load({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void load({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [load]);

  const toggleInstructor = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    setSelectedPostIds(new Set(data.instructors.filter((i) => i.available_to_withdraw > 0 && !i.has_booked_lessons).map((i) => i.post_id)));
  };

  const deselectAll = () => setSelectedPostIds(new Set());

  const metricLabels: Record<AutoschoolFinanceMetric, string> = {
    total_earned: language === "ka" ? "სულ მოგება" : "Total Earned",
    total_withdrawn: language === "ka" ? "გამოტანილი" : "Withdrawn",
    available_to_withdraw: language === "ka" ? "გამოსატანი" : "Available",
    pending_release: language === "ka" ? "მოლოდინში" : "Pending",
  };

  const activeMetricLabel = metricLabels[activeMetric];
  const todayDateString = toDateInputValue(new Date());
  const selectedMemberLabel = selectedMemberPostId === "all"
    ? (language === "ka" ? "ყველა წევრი" : "All members")
    : memberOptions.find((member) => member.postId === selectedMemberPostId)?.name
      ?? (language === "ka" ? "ინსტრუქტორი" : "Instructor");

  const applyPreset = (preset: RangePreset) => {
    setError(null);
    setSelectedPreset(preset);

    if (preset === "default") {
      const emptyRange = { fromDate: "", toDate: "" };
      setDraftRange(emptyRange);
      setAppliedRange(emptyRange);
      return;
    }

    if (preset === "custom") {
      return;
    }

    const now = new Date();
    const toDate = toDateInputValue(now);
    let fromDate = toDate;

    if (preset === "7d") {
      fromDate = toDateInputValue(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    } else if (preset === "30d") {
      fromDate = toDateInputValue(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    }

    const boundedFromDate = fromDate < oldestAllowedDateString ? oldestAllowedDateString : fromDate;
    const nextRange = { fromDate: boundedFromDate, toDate };
    setDraftRange(nextRange);
    setAppliedRange(nextRange);
  };

  const applyRange = () => {
    if (!draftRange.fromDate && !draftRange.toDate) {
      setSelectedPreset("default");
      setError(null);
      setAppliedRange({ fromDate: "", toDate: "" });
      return;
    }
    if (draftRange.fromDate && draftRange.toDate && draftRange.fromDate > draftRange.toDate) {
      setError(language === "ka" ? "საწყისი თარიღი უნდა იყოს საბოლოოზე ადრე." : "From date must be before To date.");
      return;
    }
    if (draftRange.fromDate && draftRange.fromDate < oldestAllowedDateString) {
      setError(language === "ka" ? "საწყისი თარიღი არ შეიძლება იყოს 90 დღეზე ძველი." : "From date cannot be older than last 90 days.");
      return;
    }
    if (draftRange.toDate && draftRange.toDate < oldestAllowedDateString) {
      setError(language === "ka" ? "საბოლოო თარიღი არ შეიძლება იყოს 90 დღეზე ძველი." : "To date cannot be older than last 90 days.");
      return;
    }
    setError(null);
    setSelectedPreset("custom");
    setAppliedRange(draftRange);
  };

  const resetToDefaultRange = () => {
    applyPreset("default");
  };

  const selectedAmount = data
    ? data.instructors
        .filter((i) => selectedPostIds.has(i.post_id))
        .reduce((sum, i) => sum + i.available_to_withdraw, 0)
    : 0;

  const handleWithdraw = async () => {
    if (selectedPostIds.size === 0 || !data) return;
    try {
      setIsWithdrawing(true);
      setWithdrawError(null);
      setWithdrawSuccess(null);
      const token = await getToken();
      if (!token) return;
      const result = await withdrawAutoschoolEarnings(schoolId, [...selectedPostIds], token);
      if (result.status === "skipped") {
        const hasBlockedSelection = data.instructors.some(
          (instructor) => selectedPostIds.has(instructor.post_id) && instructor.has_booked_lessons,
        );
        setWithdrawSuccess(
          hasBlockedSelection
            ? language === "ka"
              ? "გამოტანა დაბლოკილია, სანამ დაჯავშნილი გაკვეთილები არ დასრულდება."
              : "Withdrawal is blocked until booked lessons are completed."
            : language === "ka"
              ? "გამოსატანი ბალანსი არ არსებობს."
              : "No balance available to withdraw."
        );
      } else {
        setWithdrawSuccess(
          language === "ka"
            ? `წარმატებით გამოიტანეთ ${result.withdrawn_amount.toFixed(2)}₾ (${result.withdrawn_bookings_count} ჯავშანი, ${result.instructors_processed} ინსტრუქტორი)`
            : `Successfully requested withdrawal of ${result.withdrawn_amount.toFixed(2)}₾ across ${result.withdrawn_bookings_count} bookings for ${result.instructors_processed} instructor(s).`
        );
        void load({ silent: true });
      }
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : "Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button onClick={() => void load()} className="mt-3 text-xs text-red-500 underline">
          {language === "ka" ? "თავიდან ცდა" : "Try again"}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const hasAnyAvailable = data.instructors.some((instructor) => instructor.available_to_withdraw > 0 && !instructor.has_booked_lessons);
  const bookingRows = data.bookings ?? [];
  const cards: Array<{
    key: AutoschoolFinanceMetric;
    amount: number;
    color: "green" | "blue" | "amber" | "red";
  }> = [
    { key: "total_earned", amount: data.total_earned, color: "blue" },
    { key: "total_withdrawn", amount: data.total_withdrawn, color: "green" },
    { key: "available_to_withdraw", amount: data.available_to_withdraw, color: "red" },
    { key: "pending_release", amount: data.pending_release, color: "amber" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid (first) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setActiveMetric(card.key)}
            className={`rounded-2xl text-left transition ${
              activeMetric === card.key
                ? "ring-2 ring-blue-200"
                : "hover:ring-1 hover:ring-slate-200"
            }`}
          >
            <MoneyCard
              label={metricLabels[card.key]}
              amount={card.amount}
              active={activeMetric === card.key}
              icon={
                card.key === "total_earned"
                  ? TrendingUp
                  : card.key === "total_withdrawn"
                    ? CheckCircle
                    : card.key === "available_to_withdraw"
                      ? Wallet
                      : Clock
              }
              color={card.color}
            />
          </button>
        ))}
      </div>

      {/* Financial overview (second, after price cards) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 lg:p-7 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900">
              {language === "ka" ? "ფინანსური მიმოხილვა" : "Financial Overview"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {language === "ka"
                ? "Desktop კალენდრის გამოცდილება განახლებულია: გამოიყენეთ სწრაფი დიაპაზონები და ინსტრუქტორის ფილტრი."
                : "Desktop calendar experience is upgraded with quick ranges and member-specific filtering."}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{language === "ka" ? `აქტიური ველი: ${activeMetricLabel}` : `Active metric: ${activeMetricLabel}`}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 lg:p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-800">
                {language === "ka" ? "კალენდრის ფანჯარა" : "Calendar Window"}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: "default", labelEn: "90d + Upcoming", labelKa: "90 დღე + მომავალი" },
                { id: "today", labelEn: "Today", labelKa: "დღეს" },
                { id: "7d", labelEn: "Last 7 Days", labelKa: "ბოლო 7 დღე" },
                { id: "30d", labelEn: "Last 30 Days", labelKa: "ბოლო 30 დღე" },
                { id: "custom", labelEn: "Custom", labelKa: "ხელით" },
              ].map((preset) => {
                const isActive = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id as RangePreset)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    {language === "ka" ? preset.labelKa : preset.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  {language === "ka" ? "დან" : "From"}
                </span>
                <input
                  type="date"
                  value={draftRange.fromDate}
                  onChange={(e) => {
                    setSelectedPreset("custom");
                    setDraftRange((prev) => ({ ...prev, fromDate: e.target.value }));
                  }}
                  max={draftRange.toDate || todayDateString}
                  min={oldestAllowedDateString}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  {language === "ka" ? "მდე" : "To"}
                </span>
                <input
                  type="date"
                  value={draftRange.toDate}
                  onChange={(e) => {
                    setSelectedPreset("custom");
                    setDraftRange((prev) => ({ ...prev, toDate: e.target.value }));
                  }}
                  min={draftRange.fromDate || oldestAllowedDateString}
                  max={todayDateString}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="xl:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                {language === "ka" ? "ინსტრუქტორი" : "Member"}
              </span>
              <select
                value={selectedMemberPostId}
                onChange={(e) => setSelectedMemberPostId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">{language === "ka" ? "ყველა წევრი" : "All members"}</option>
                {memberOptions.map((member) => (
                  <option key={member.postId} value={member.postId}>{member.name}</option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={applyRange}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {language === "ka" ? "გამოყენება" : "Apply"}
              </button>

              <button
                type="button"
                onClick={resetToDefaultRange}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {language === "ka" ? "ნაგულისხმევი" : "Default"}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 leading-relaxed">
              <p>
                {appliedRange.fromDate || appliedRange.toDate
                  ? (language === "ka"
                    ? `დიაპაზონი: ${appliedRange.fromDate || "..."} → ${appliedRange.toDate || "..."}`
                    : `Range: ${appliedRange.fromDate || "..."} to ${appliedRange.toDate || "..."}`)
                  : (language === "ka"
                    ? "ნაგულისხმევი დიაპაზონი: ბოლო 90 დღე + მომავალი დაჯავშნილი გაკვეთილები"
                    : "Default scope: last 90 days + upcoming booked lessons")}
              </p>
              <p className="mt-1">
                {language === "ka" ? `ინსტრუქტორი: ${selectedMemberLabel}` : `Member: ${selectedMemberLabel}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor breakdown */}
      {data.instructors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowInstructors((v) => !v)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {language === "ka" ? "ინსტრუქტორების განაწილება" : "Per-Instructor Breakdown"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {data.instructors.length}{" "}
                {language === "ka" ? "ინსტრუქტორი" : "instructor(s)"}
              </p>
            </div>
            {showInstructors ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showInstructors && (
            <div className="px-5 pb-5 space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={selectAll}
                  className="text-xs text-[#F03D3D] font-medium hover:underline"
                >
                  {language === "ka" ? "ყველა" : "Select all"}
                </button>
                <span className="text-slate-300 text-xs">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-slate-500 font-medium hover:underline"
                >
                  {language === "ka" ? "გაუქმება" : "Deselect all"}
                </button>
              </div>
              {data.instructors.map((instr) => (
                <InstructorRow
                  key={instr.post_id}
                  instructor={instr}
                  selected={selectedPostIds.has(instr.post_id)}
                  onToggle={() => toggleInstructor(instr.post_id)}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            {language === "ka" ? "ჯავშნების დეტალები" : "Booking Details"} · {activeMetricLabel}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {language === "ka"
              ? `ნაჩვენებია მხოლოდ "${activeMetricLabel}" კატეგორიის ჩანაწერები (${selectedMemberLabel}).`
              : `Showing only "${activeMetricLabel}" rows for ${selectedMemberLabel}.`}
          </p>
        </div>

        {bookingRows.length > 0 ? (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">{language === "ka" ? "ინსტრუქტორი" : "Instructor"}</th>
                  <th className="py-2 pr-4 font-medium">{language === "ka" ? "გაკვეთილის დასასრული" : "Lesson End"}</th>
                  <th className="py-2 pr-4 font-medium">{language === "ka" ? "ხანგრძლივობა" : "Duration"}</th>
                  <th className="py-2 pr-4 font-medium">{language === "ka" ? "სტატუსი" : "Status"}</th>
                  <th className="py-2 pr-4 font-medium">{language === "ka" ? "პაკეტი" : "Package"}</th>
                  <th className="py-2 pr-4 font-medium">{language === "ka" ? "თანხა" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                {bookingRows.map((booking) => {
                  const endDate = new Date(
                    new Date(booking.start_time_utc).getTime() + booking.duration_minutes * 60 * 1000,
                  ).toISOString();

                  return (
                    <tr key={booking.id} className="border-b border-slate-100 text-slate-800">
                      <td className="py-3 pr-4">{booking.instructor_name ?? (language === "ka" ? "ინსტრუქტორი" : "Instructor")}</td>
                      <td className="py-3 pr-4">{formatDateTime(endDate)}</td>
                      <td className="py-3 pr-4">{booking.duration_minutes} min</td>
                      <td className="py-3 pr-4 capitalize">{booking.status}</td>
                      <td className="py-3 pr-4">
                        {booking.package_name_snapshot ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {booking.package_name_snapshot}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {booking.package_percentage_snapshot && booking.pre_discount_price ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 line-through">{currencyFormatter.format(booking.pre_discount_price)}</span>
                              <span className="font-semibold text-emerald-700">{currencyFormatter.format(booking.price)}</span>
                              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700">
                                -{booking.package_percentage_snapshot.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-semibold">{currencyFormatter.format(booking.price)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            {language === "ka"
              ? `"${activeMetricLabel}" კატეგორიაში ჩანაწერები ვერ მოიძებნა.`
              : `No rows found for "${activeMetricLabel}".`}
          </div>
        )}
      </div>

      {/* Withdraw action */}
      {hasAnyAvailable && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {language === "ka" ? "თანხის გამოტანა" : "Request Withdrawal"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "ka"
                  ? "მხოლოდ ავტოსკოლის ადმინი ახდენს გამოტანას"
                  : "Only the autoschool admin can initiate payouts"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{language === "ka" ? "შერჩეული" : "Selected"}</p>
              <p className="text-lg font-bold text-[#F03D3D]">{selectedAmount.toFixed(2)}₾</p>
            </div>
          </div>

          {withdrawSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
              {withdrawSuccess}
            </div>
          )}
          {withdrawError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {withdrawError}
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={selectedPostIds.size === 0 || isWithdrawing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-sm font-semibold shadow-lg shadow-red-500/20 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isWithdrawing
              ? language === "ka" ? "მიმდინარეობს..." : "Processing..."
              : language === "ka"
              ? `გამოტანა — ${selectedAmount.toFixed(2)}₾`
              : `Withdraw — ${selectedAmount.toFixed(2)}₾`}
          </button>
        </div>
      )}

      {data.instructors.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {language === "ka"
              ? "ჯერ ინსტრუქტორები არ არიან დამატებული"
              : "No member instructors yet. Invite instructors to see their earnings here."}
          </p>
        </div>
      )}
    </div>
  );
}
