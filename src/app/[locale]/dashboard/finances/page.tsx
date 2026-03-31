"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { useInstructorApproval } from "@/hooks/useInstructorApproval";
import { API_CONFIG } from "@/config/constants";

type EligibleBooking = {
  id: string;
  start_time_utc: string;
  duration_minutes: number;
  price: number;
};

type FinancesResponse = {
  total_earned: number;
  total_withdrawn: number;
  available_to_withdraw: number;
  pending_release: number;
  eligible_bookings_count: number;
  eligible_bookings: EligibleBooking[];
};

type MetricKey = "total_earned" | "total_withdrawn" | "available_to_withdraw" | "pending_release";

type MetricBooking = {
  id: string;
  start_time_utc: string;
  duration_minutes: number;
  status: string;
  withdrawn: boolean;
  price: number;
};

type MetricResponse = {
  metric: MetricKey;
  count: number;
  total_amount: number;
  bookings: MetricBooking[];
};

type DateRange = {
  fromDate: string;
  toDate: string;
};

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

export default function FinancesPage() {
  const { getToken } = useClerkAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] ?? "en";
  const { isInstructor, isEmployee, isLoading } = useInstructorApproval();
  const [financeData, setFinanceData] = useState<FinancesResponse | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isMetricLoading, setIsMetricLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("available_to_withdraw");
  const [metricData, setMetricData] = useState<MetricResponse | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRange, setDraftRange] = useState<DateRange>({ fromDate: "", toDate: "" });
  const [appliedRange, setAppliedRange] = useState<DateRange>({ fromDate: "", toDate: "" });

  const todayDateString = new Date().toISOString().slice(0, 10);
  const oldestAllowedDateString = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const buildRangeParams = useCallback((range: DateRange) => {
    const params = new URLSearchParams();
    if (range.fromDate) params.set("from_date", range.fromDate);
    if (range.toDate) params.set("to_date", range.toDate);
    return params.toString();
  }, []);

  const loadMetric = useCallback(async (metric: MetricKey, range: DateRange) => {
    setIsMetricLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authorized");
      }

      const rangeParams = buildRangeParams(range);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/dashboard/finances/details?metric=${metric}${rangeParams ? `&${rangeParams}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail || "Failed to load metric details");
      }

      const data = (await response.json()) as MetricResponse;
      setMetricData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metric details");
    } finally {
      setIsMetricLoading(false);
    }
  }, [buildRangeParams, getToken]);

  const loadFinances = useCallback(async (range: DateRange) => {
    setIsFetching(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Not authorized");
        setIsFetching(false);
        return;
      }

      const rangeParams = buildRangeParams(range);
      const url = `${API_CONFIG.BASE_URL}/api/dashboard/finances${rangeParams ? `?${rangeParams}` : ""}`;
      const rangedResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!rangedResponse.ok) {
        const body = await rangedResponse.json().catch(() => ({}));
        throw new Error(body?.detail || "Failed to load finances");
      }

      const data = (await rangedResponse.json()) as FinancesResponse;
      setFinanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finances");
    } finally {
      setIsFetching(false);
    }
  }, [buildRangeParams, getToken]);

  useEffect(() => {
    if (!isLoading && !isInstructor) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [isLoading, isInstructor, locale, router]);

  useEffect(() => {
    if (!isLoading && isInstructor) {
      void loadFinances(appliedRange);
    }
  }, [isLoading, isInstructor, loadFinances, appliedRange]);

  useEffect(() => {
    if (!isLoading && isInstructor) {
      void loadMetric(activeMetric, appliedRange);
    }
  }, [isLoading, isInstructor, activeMetric, loadMetric, appliedRange]);

  const canWithdraw = useMemo(
    () => Boolean(!isEmployee && financeData && financeData.eligible_bookings_count > 0 && !isWithdrawing),
    [isEmployee, financeData, isWithdrawing]
  );

  const withdrawAll = async () => {
    if (!canWithdraw) return;
    setIsWithdrawing(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authorized");
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/finances/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail?.message || body?.detail || "Withdraw failed");
      }

      await loadFinances(appliedRange);
      await loadMetric(activeMetric, appliedRange);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading || !isInstructor) {
    return <div className="min-h-screen bg-gray-50 pt-20" />;
  }

  const stats = financeData ?? {
    total_earned: 0,
    total_withdrawn: 0,
    available_to_withdraw: 0,
    pending_release: 0,
    eligible_bookings_count: 0,
    eligible_bookings: [],
  };

  const metricTitles: Record<MetricKey, string> = {
    total_earned: "Total Earned Lessons",
    total_withdrawn: "Already Withdrawn Lessons",
    available_to_withdraw: "Available To Withdraw Lessons",
    pending_release: "Pending Release Lessons",
  };

  const cards: Array<{ key: MetricKey; label: string; value: number; valueClass: string }> = [
    { key: "total_earned", label: "Total Earned", value: stats.total_earned, valueClass: "text-gray-900" },
    { key: "total_withdrawn", label: "Already Withdrawn", value: stats.total_withdrawn, valueClass: "text-gray-900" },
    { key: "available_to_withdraw", label: "Available To Withdraw", value: stats.available_to_withdraw, valueClass: "text-emerald-700" },
    { key: "pending_release", label: "Pending Release", value: stats.pending_release, valueClass: "text-amber-700" },
  ];

  const displayedBookings = metricData?.bookings ?? [];

  const applyRange = () => {
    if (draftRange.fromDate && draftRange.toDate && draftRange.fromDate > draftRange.toDate) {
      setError("From date must be before To date");
      return;
    }
    if (draftRange.fromDate && draftRange.fromDate < oldestAllowedDateString) {
      setError("From date cannot be older than last 90 days");
      return;
    }
    if (draftRange.toDate && draftRange.toDate < oldestAllowedDateString) {
      setError("To date cannot be older than last 90 days");
      return;
    }
    setError(null);
    setAppliedRange(draftRange);
  };

  const resetToDefaultRange = () => {
    setError(null);
    setDraftRange({ fromDate: "", toDate: "" });
    setAppliedRange({ fromDate: "", toDate: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <MobileDashboardNav isInstructor />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Finances</h1>
                <p className="mt-2 text-gray-600">
                  Use calendar controls below (max lookback is last 90 days). Withdraw earnings from lessons completed after the 24h grace.
                </p>
              </div>

              {isEmployee ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Your autoschool admin manages withdrawals on your behalf.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={withdrawAll}
                  disabled={!canWithdraw || isFetching}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw Available"}
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">From</span>
                <input
                  type="date"
                  value={draftRange.fromDate}
                  onChange={(e) => setDraftRange((prev) => ({ ...prev, fromDate: e.target.value }))}
                  min={oldestAllowedDateString}
                  max={todayDateString}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">To</span>
                <input
                  type="date"
                  value={draftRange.toDate}
                  onChange={(e) => setDraftRange((prev) => ({ ...prev, toDate: e.target.value }))}
                  min={oldestAllowedDateString}
                  max={todayDateString}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <button
                type="button"
                onClick={applyRange}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Range
              </button>

              <button
                type="button"
                onClick={resetToDefaultRange}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Last 3 Months
              </button>

              <p className="text-xs text-gray-500 lg:text-right">
                {appliedRange.fromDate || appliedRange.toDate
                  ? `Using ${appliedRange.fromDate || "..."} to ${appliedRange.toDate || "..."}`
                  : "Using default last-90-days window"}
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  setActiveMetric(card.key);
                }}
                className={`rounded-2xl border bg-white p-5 text-left transition ${
                  activeMetric === card.key
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`mt-1 text-2xl font-bold ${card.valueClass}`}>
                  {currencyFormatter.format(card.value)}
                </p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">{metricTitles[activeMetric]}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {metricData?.count ?? 0} slots. Total: {currencyFormatter.format(metricData?.total_amount ?? 0)}
            </p>

            {isMetricLoading ? (
              <p className="mt-6 text-sm text-gray-500">Loading metric details...</p>
            ) : displayedBookings.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">No slots for this metric yet.</p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Lesson End</th>
                      <th className="py-2 pr-4 font-medium">Duration</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBookings.map((booking) => {
                      const endDate = new Date(
                        new Date(booking.start_time_utc).getTime() + booking.duration_minutes * 60 * 1000
                      ).toISOString();

                      return (
                        <tr key={booking.id} className="border-b border-gray-100 text-gray-800">
                          <td className="py-3 pr-4">{formatDateTime(endDate)}</td>
                          <td className="py-3 pr-4">{booking.duration_minutes} min</td>
                          <td className="py-3 pr-4 capitalize">{booking.status}</td>
                          <td className="py-3 pr-4 font-semibold">{currencyFormatter.format(booking.price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
