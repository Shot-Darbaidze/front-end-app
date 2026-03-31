"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAutoschoolFinances,
  withdrawAutoschoolEarnings,
  type AutoschoolFinancesData,
  type AutoschoolInstructorFinances,
} from "@/services/autoschoolService";
import { Wallet, TrendingUp, Clock, CheckCircle, User, Users, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

const FINANCES_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function financesCacheKey(schoolId: string) {
  return `autoschool-finances-v1:${schoolId}`;
}

function readFinancesCache(schoolId: string): AutoschoolFinancesData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(financesCacheKey(schoolId));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: AutoschoolFinancesData; ts: number };
    if (Date.now() - ts > FINANCES_CACHE_TTL_MS) { sessionStorage.removeItem(financesCacheKey(schoolId)); return null; }
    return data;
  } catch { return null; }
}

function writeFinancesCache(schoolId: string, data: AutoschoolFinancesData) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(financesCacheKey(schoolId), JSON.stringify({ data, ts: Date.now() })); } catch { /* storage full */ }
}

function bustFinancesCache(schoolId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(financesCacheKey(schoolId));
}

interface AutoschoolFinancesProps {
  schoolId: string;
}

function MoneyCard({
  label,
  amount,
  icon: Icon,
  color,
}: {
  label: string;
  amount: number;
  icon: typeof Wallet;
  color: "green" | "blue" | "amber" | "red";
}) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue:  "bg-blue-50   text-blue-600   border-blue-100",
    amber: "bg-amber-50  text-amber-600  border-amber-100",
    red:   "bg-red-50    text-[#F03D3D]  border-red-100",
  };
  const iconBg = {
    green: "bg-emerald-100",
    blue:  "bg-blue-100",
    amber: "bg-amber-100",
    red:   "bg-red-100",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
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
  const hasEarnings = instructor.available_to_withdraw > 0;

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
          <span className={`text-xs font-medium ${hasEarnings ? "text-emerald-600" : "text-slate-400"}`}>
            {language === "ka" ? "გამოსატანი:" : "Available:"}{" "}
            {instructor.available_to_withdraw.toFixed(2)}₾
          </span>
          {instructor.pending_release > 0 && (
            <span className="text-xs text-amber-600">
              {language === "ka" ? "მოლოდინში:" : "Pending:"}{" "}
              {instructor.pending_release.toFixed(2)}₾
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={!hasEarnings}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          !hasEarnings
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

  const [data, setData] = useState<AutoschoolFinancesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [showInstructors, setShowInstructors] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const load = useCallback(async (isRevalidation = false) => {
    // Apply cache immediately (stale-while-revalidate)
    if (!isRevalidation) {
      const cached = readFinancesCache(schoolId);
      if (cached) {
        setData(cached);
        const withBalance = cached.instructors
          .filter((i) => i.available_to_withdraw > 0)
          .map((i) => i.post_id);
        setSelectedPostIds(new Set(withBalance));
        setIsLoading(false);
      }
    }
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;
      const result = await getAutoschoolFinances(schoolId, token);
      setData(result);
      writeFinancesCache(schoolId, result);
      // Auto-select all instructors with available balance
      const withBalance = result.instructors
        .filter((i) => i.available_to_withdraw > 0)
        .map((i) => i.post_id);
      setSelectedPostIds(new Set(withBalance));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load finances.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, schoolId]);

  useEffect(() => { void load(); }, [load]);

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
    setSelectedPostIds(new Set(data.instructors.filter((i) => i.available_to_withdraw > 0).map((i) => i.post_id)));
  };

  const deselectAll = () => setSelectedPostIds(new Set());

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
        setWithdrawSuccess(language === "ka" ? "გამოსატანი ბალანსი არ არსებობს." : "No balance available to withdraw.");
      } else {
        setWithdrawSuccess(
          language === "ka"
            ? `წარმატებით გამოიტანეთ ${result.withdrawn_amount.toFixed(2)}₾ (${result.withdrawn_bookings_count} ჯავშანი, ${result.instructors_processed} ინსტრუქტორი)`
            : `Successfully requested withdrawal of ${result.withdrawn_amount.toFixed(2)}₾ across ${result.withdrawn_bookings_count} bookings for ${result.instructors_processed} instructor(s).`
        );
        bustFinancesCache(schoolId); // balances changed — force fresh fetch
        void load(true);
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

  if (error) {
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

  const hasAnyAvailable = data.available_to_withdraw > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          {language === "ka" ? "ფინანსური მიმოხილვა" : "Financial Overview"}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {language === "ka"
            ? "ყველა წევრი ინსტრუქტორის შემოსავლის ჯამი"
            : "Aggregated earnings across all member instructors"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MoneyCard
          label={language === "ka" ? "სულ მოგება" : "Total Earned"}
          amount={data.total_earned}
          icon={TrendingUp}
          color="blue"
        />
        <MoneyCard
          label={language === "ka" ? "გამოტანილი" : "Withdrawn"}
          amount={data.total_withdrawn}
          icon={CheckCircle}
          color="green"
        />
        <MoneyCard
          label={language === "ka" ? "გამოსატანი" : "Available"}
          amount={data.available_to_withdraw}
          icon={Wallet}
          color="red"
        />
        <MoneyCard
          label={language === "ka" ? "მოლოდინში" : "Pending"}
          amount={data.pending_release}
          icon={Clock}
          color="amber"
        />
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
