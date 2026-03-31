"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAutoschool,
  updateAutoschoolPricing,
  type AutoschoolDetail,
} from "@/services/autoschoolService";
import { DollarSign, Save, AlertCircle, CheckCircle, Info } from "lucide-react";

interface AutoschoolPricingProps {
  schoolId: string;
}

interface PricingForm {
  manual_city_price: string;
  manual_yard_price: string;
  automatic_city_price: string;
  automatic_yard_price: string;
}

const emptyForm = (): PricingForm => ({
  manual_city_price: "",
  manual_yard_price: "",
  automatic_city_price: "",
  automatic_yard_price: "",
});

function priceToStr(val: number | null | undefined): string {
  if (val == null) return "";
  return String(val);
}

function schoolToForm(school: AutoschoolDetail): PricingForm {
  return {
    manual_city_price: priceToStr(school.manual_city_price),
    manual_yard_price: priceToStr(school.manual_yard_price),
    automatic_city_price: priceToStr(school.automatic_city_price),
    automatic_yard_price: priceToStr(school.automatic_yard_price),
  };
}

/** Detect which transmissions are in use so we only show relevant fields */
function detectTransmissions(school: AutoschoolDetail): { hasManual: boolean; hasAutomatic: boolean } {
  const instructors = school.instructors ?? [];
  if (instructors.length === 0) return { hasManual: true, hasAutomatic: true };
  const transmissions = instructors.map((i) => (i.transmission ?? "manual").toLowerCase());
  return {
    hasManual: transmissions.some((t) => t !== "automatic"),
    hasAutomatic: transmissions.some((t) => t === "automatic"),
  };
}

export function AutoschoolPricing({ schoolId }: AutoschoolPricingProps) {
  const { getToken } = useClerkAuth();
  const { language } = useLanguage();

  const [school, setSchool] = useState<AutoschoolDetail | null>(null);
  const [form, setForm] = useState<PricingForm>(emptyForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const s = await getAutoschool(schoolId);
      if (s) {
        setSchool(s);
        setForm(schoolToForm(s));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pricing.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate
    const parsed: Record<string, number | null> = {};
    const fields: (keyof PricingForm)[] = [
      "manual_city_price",
      "manual_yard_price",
      "automatic_city_price",
      "automatic_yard_price",
    ];
    for (const field of fields) {
      const raw = form[field].trim();
      if (raw === "") {
        parsed[field] = null;
      } else {
        const val = parseFloat(raw);
        if (isNaN(val) || val < 0) {
          setError(
            language === "ka"
              ? "ფასი უნდა იყოს 0 ან მეტი."
              : "Price must be 0 or greater."
          );
          return;
        }
        parsed[field] = val;
      }
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const updated = await updateAutoschoolPricing(
        schoolId,
        {
          manual_city_price: parsed.manual_city_price as number | null,
          manual_yard_price: parsed.manual_yard_price as number | null,
          automatic_city_price: parsed.automatic_city_price as number | null,
          automatic_yard_price: parsed.automatic_yard_price as number | null,
        },
        token,
      );
      setSchool(updated);
      setForm(schoolToForm(updated));
      setSuccessMsg(
        language === "ka"
          ? "ფასები განახლდა და ინსტრუქტორებთან სინქრონიზდა."
          : "Prices updated and synced to all employee instructors."
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save pricing.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const { hasManual, hasAutomatic } = school ? detectTransmissions(school) : { hasManual: true, hasAutomatic: true };

  const PriceInput = ({
    label,
    sublabel,
    field,
  }: {
    label: string;
    sublabel?: string;
    field: keyof PricingForm;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        {sublabel && <span className="ml-1 text-slate-400 font-normal">{sublabel}</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₾</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={form[field]}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          placeholder="0.00"
          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D]"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#F03D3D]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#F03D3D]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {language === "ka" ? "სკოლის ფასები" : "School Pricing"}
            </h2>
            <p className="text-sm text-slate-500">
              {language === "ka"
                ? "ეს ფასები ვრცელდება ყველა დასაქმებულ ინსტრუქტორზე"
                : "Prices apply to all employee instructors in this school"}
            </p>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          {language === "ka"
            ? "ფასების შეცვლა ავტომატურად გადაიცემა ყველა \"employee\" ინსტრუქტორის პროფილში (გადაცემის ტიპის მიხედვით). ინსტრუქტორები ვერ ცვლიან ფასებს დამოუკიდებლად."
            : "Updating prices automatically syncs to all employee instructor profiles based on their transmission type. Instructors cannot set prices independently."}
        </p>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Manual transmission */}
        {hasManual && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold">
                {language === "ka" ? "მექანიკა" : "Manual"}
              </span>
              <span className="text-sm text-slate-500">
                {language === "ka" ? "ფასი / გაკვეთილი" : "Price per lesson"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceInput
                label={language === "ka" ? "ქალაქი" : "City"}
                sublabel={language === "ka" ? "(ქუჩა)" : "(street)"}
                field="manual_city_price"
              />
              <PriceInput
                label={language === "ka" ? "მოედანი" : "Yard"}
                sublabel={language === "ka" ? "(სასწავლო)" : "(training area)"}
                field="manual_yard_price"
              />
            </div>
          </div>
        )}

        {/* Automatic transmission */}
        {hasAutomatic && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                {language === "ka" ? "ავტომატი" : "Automatic"}
              </span>
              <span className="text-sm text-slate-500">
                {language === "ka" ? "ფასი / გაკვეთილი" : "Price per lesson"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceInput
                label={language === "ka" ? "ქალაქი" : "City"}
                sublabel={language === "ka" ? "(ქუჩა)" : "(street)"}
                field="automatic_city_price"
              />
              <PriceInput
                label={language === "ka" ? "მოედანი" : "Yard"}
                sublabel={language === "ka" ? "(სასწავლო)" : "(training area)"}
                field="automatic_yard_price"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white font-semibold shadow shadow-red-500/20 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isSaving ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving
            ? (language === "ka" ? "შენახვა..." : "Saving...")
            : (language === "ka" ? "ფასების შენახვა" : "Save Prices")}
        </button>
      </form>
    </div>
  );
}
