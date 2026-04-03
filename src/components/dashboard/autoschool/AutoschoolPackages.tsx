"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createPackage,
  updatePackage,
  deletePackage,
  getAutoschoolPackagesForAdmin,
  getAutoschool,
  type CoursePackage,
  type CoursePackageCreateInput,
  type AutoschoolDetail,
} from "@/services/autoschoolService";
import {
  Plus, Pencil, Trash2, Star, X, AlertCircle, CheckCircle,
  Package, Percent, MapPin, SquareParking, Car, Power,
} from "lucide-react";
import {
  applyPackagePercentage,
  clampPackageDiscountPercentage,
  DEFAULT_PACKAGE_DISCOUNT_PERCENTAGE,
  formatPackageAdjustment,
  MAX_PACKAGE_DISCOUNT_PERCENTAGE,
  MIN_PACKAGE_DISCOUNT_PERCENTAGE,
} from "@/utils/packages";

interface AutoschoolPackagesProps {
  schoolId: string;
}

export interface PackagePricingSource {
  manual_city_price?: number | null;
  manual_yard_price?: number | null;
  automatic_city_price?: number | null;
  automatic_yard_price?: number | null;
}

// ─── Form state ───────────────────────────────────────────────────────────────

export interface PackageFormState {
  name: string;
  lessons: string;
  percentage: string;
  popular: boolean;
  description: string;
  mode: "city" | "yard";
  transmission: "manual" | "automatic" | "both";
}

const emptyForm = (): PackageFormState => ({
  name: "",
  lessons: "",
  percentage: String(DEFAULT_PACKAGE_DISCOUNT_PERCENTAGE),
  popular: false,
  description: "",
  mode: "city",
  transmission: "manual",
});

const DISCOUNT_PRESET_VALUES = [5, 10, 15, 20, 25] as const;
const DEFAULT_PACKAGE_TRANSMISSIONS = ["manual", "automatic", "both"] as const;

function getSelectableTransmissions(
  availableTransmissions: readonly PackageFormState["transmission"][] | undefined,
  canSelectBoth: boolean,
): PackageFormState["transmission"][] {
  const source = availableTransmissions && availableTransmissions.length > 0
    ? [...availableTransmissions]
    : [...DEFAULT_PACKAGE_TRANSMISSIONS];

  return source.filter(
    (value, index) => source.indexOf(value) === index && (value !== "both" || canSelectBoth),
  );
}

// ─── Helper: derive computed price from school prices ─────────────────────────

function computePrice(
  pricing: PackagePricingSource | null,
  form: PackageFormState,
): number | null {
  if (!pricing) return null;
  const lessons = parseInt(form.lessons, 10);
  const pct = parseFloat(form.percentage);
  if (isNaN(lessons) || lessons < 1) return null;
  if (isNaN(pct) || pct < MIN_PACKAGE_DISCOUNT_PERCENTAGE || pct >= 100) return null;

  let unitPrice: number | null | undefined;
  if (form.mode === "city") {
    if (form.transmission === "manual") unitPrice = pricing.manual_city_price != null ? Number(pricing.manual_city_price) : null;
    else if (form.transmission === "automatic") unitPrice = pricing.automatic_city_price != null ? Number(pricing.automatic_city_price) : null;
    else {
      // "both" — only valid when both prices match
      const m = pricing.manual_city_price != null ? Number(pricing.manual_city_price) : null;
      const a = pricing.automatic_city_price != null ? Number(pricing.automatic_city_price) : null;
      unitPrice = (m != null && a != null && m === a) ? m : null;
    }
  } else {
    if (form.transmission === "manual") unitPrice = pricing.manual_yard_price != null ? Number(pricing.manual_yard_price) : null;
    else if (form.transmission === "automatic") unitPrice = pricing.automatic_yard_price != null ? Number(pricing.automatic_yard_price) : null;
    else {
      const m = pricing.manual_yard_price != null ? Number(pricing.manual_yard_price) : null;
      const a = pricing.automatic_yard_price != null ? Number(pricing.automatic_yard_price) : null;
      unitPrice = (m != null && a != null && m === a) ? m : null;
    }
  }
  if (unitPrice == null) return null;
  return applyPackagePercentage(unitPrice * lessons, pct);
}

/** "both" is only selectable when city/yard prices match for manual vs automatic */
function bothEnabled(pricing: PackagePricingSource | null, mode: "city" | "yard"): boolean {
  if (!pricing) return false;
  if (mode === "city") {
    const m = pricing.manual_city_price != null ? Number(pricing.manual_city_price) : null;
    const a = pricing.automatic_city_price != null ? Number(pricing.automatic_city_price) : null;
    return m != null && a != null && m === a;
  } else {
    const m = pricing.manual_yard_price != null ? Number(pricing.manual_yard_price) : null;
    const a = pricing.automatic_yard_price != null ? Number(pricing.automatic_yard_price) : null;
    return m != null && a != null && m === a;
  }
}

// ─── PackageForm ──────────────────────────────────────────────────────────────

export function PackageForm({
  initial,
  pricing,
  onSave,
  onCancel,
  isSaving,
  language,
  popularTakenBy,
  availableTransmissions,
  defaultTransmission,
}: {
  initial?: PackageFormState;
  pricing: PackagePricingSource | null;
  onSave: (form: PackageFormState) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  language: string;
  popularTakenBy?: string | null;
  availableTransmissions?: readonly PackageFormState["transmission"][];
  defaultTransmission?: PackageFormState["transmission"];
}) {
  const [form, setForm] = useState<PackageFormState>(() => {
    if (initial) {
      return initial;
    }

    const nextDefaultTransmission = defaultTransmission ?? availableTransmissions?.[0] ?? "manual";
    return { ...emptyForm(), transmission: nextDefaultTransmission };
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const set = <K extends keyof PackageFormState>(field: K, value: PackageFormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSelectBoth = bothEnabled(pricing, form.mode);
  const selectableTransmissions = getSelectableTransmissions(availableTransmissions, canSelectBoth);
  const selectableTransmissionsKey = selectableTransmissions.join("|");
  const fallbackTransmission = selectableTransmissions[0] ?? "manual";
  const computedPrice = computePrice(pricing, form);
  const rawDiscount = Number(form.percentage);
  const sliderValue = clampPackageDiscountPercentage(
    Number.isFinite(rawDiscount) ? rawDiscount : DEFAULT_PACKAGE_DISCOUNT_PERCENTAGE,
  );
  const discountPreview = formatPackageAdjustment(
    Number.isFinite(rawDiscount) ? rawDiscount : sliderValue,
  );

  const setDiscount = (value: number) => {
    set("percentage", String(clampPackageDiscountPercentage(value)));
  };

  useEffect(() => {
    setForm((prev) => (
      selectableTransmissions.includes(prev.transmission)
        ? prev
        : { ...prev, transmission: fallbackTransmission }
    ));
  }, [fallbackTransmission, selectableTransmissionsKey]);

  // If "both" was selected but now prices diverge, reset to "manual"
  const handleModeChange = (newMode: "city" | "yard") => {
    const nextSelectableTransmissions = getSelectableTransmissions(
      availableTransmissions,
      bothEnabled(pricing, newMode),
    );
    setForm((prev) => ({
      ...prev,
      mode: newMode,
      transmission: nextSelectableTransmissions.includes(prev.transmission)
        ? prev.transmission
        : (nextSelectableTransmissions[0] ?? "manual"),
    }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim())
      errs.name = language === "ka" ? "სახელი სავალდებულოა" : "Name is required";
    if (!form.lessons || isNaN(Number(form.lessons)) || Number(form.lessons) < 1)
      errs.lessons = language === "ka" ? "მინ. 1 გაკვეთილი" : "Min 1 lesson";
    if (
      !form.percentage ||
      isNaN(Number(form.percentage)) ||
      Number(form.percentage) < MIN_PACKAGE_DISCOUNT_PERCENTAGE ||
      Number(form.percentage) >= 100
    )
      errs.percentage = language === "ka" ? "1–99% შორის" : "Must be between 1% and 99%";
    if (!selectableTransmissions.includes(form.transmission)) {
      errs.transmission = form.transmission === "both"
        ? language === "ka"
          ? '"ორივე" ხელმისაწვდომია მხოლოდ ფასების დამთხვევისას'
          : '"Both" is only available when prices match'
        : language === "ka"
          ? "აირჩიეთ მხოლოდ ხელმისაწვდომი გადაცემათა კოლოფი"
          : "Choose a transmission this instructor can actually offer";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(form);
  };

  const modeButtons: { value: "city" | "yard"; labelKa: string; labelEn: string; Icon: typeof MapPin }[] = [
    { value: "city", labelKa: "ქალაქი", labelEn: "City", Icon: MapPin },
    { value: "yard", labelKa: "მოედანი", labelEn: "Yard", Icon: SquareParking },
  ];

  const transmissionButtons: { value: "manual" | "automatic" | "both"; labelKa: string; labelEn: string }[] = [
    { value: "manual", labelKa: "მექანიკა", labelEn: "Manual" },
    { value: "automatic", labelKa: "ავტომატი", labelEn: "Automatic" },
    { value: "both", labelKa: "ორივე", labelEn: "Both" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {language === "ka" ? "პაკეტის სახელი" : "Package name"}
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={100}
          placeholder={language === "ka" ? "მაგ. სტანდარტი" : "e.g. Standard"}
          className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 ${
            errors.name ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Lessons + Discount */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === "ka" ? "გაკვეთილები" : "Lessons"}
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={form.lessons}
            onChange={(e) => set("lessons", e.target.value)}
            placeholder="10"
            className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 ${
              errors.lessons ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
            }`}
          />
          {errors.lessons && <p className="text-xs text-red-500 mt-1">{errors.lessons}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === "ka" ? "ფასდაკლება (%)" : "Discount off (%)"}
          </label>
          <div
            className={`rounded-2xl border p-4 sm:p-5 ${
              errors.percentage ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50/80"
            }`}
          >
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {language === "ka" ? "მოსაჭრელი ნაწილი" : "Discount applied"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[#F03D3D]">
                  <Percent className="w-4 h-4" />
                  <span className="text-2xl font-bold">{discountPreview ?? "-0%"}</span>
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                <button
                  type="button"
                  onClick={() => setDiscount(sliderValue - 1)}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  -
                </button>
                <div className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 sm:min-w-[72px] sm:flex-none">
                  {sliderValue}%
                </div>
                <button
                  type="button"
                  onClick={() => setDiscount(sliderValue + 1)}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  +
                </button>
              </div>
            </div>

            <input
              type="range"
              min={MIN_PACKAGE_DISCOUNT_PERCENTAGE}
              max={MAX_PACKAGE_DISCOUNT_PERCENTAGE}
              step={1}
              value={sliderValue}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full accent-[#F03D3D]"
            />

            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>{MIN_PACKAGE_DISCOUNT_PERCENTAGE}%</span>
              <span>{MAX_PACKAGE_DISCOUNT_PERCENTAGE}%</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {DISCOUNT_PRESET_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDiscount(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:min-w-[72px] ${
                    sliderValue === value
                      ? "bg-[#F03D3D] text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {formatPackageAdjustment(value)}
                </button>
              ))}
            </div>
          </div>
          {errors.percentage && <p className="text-xs text-red-500 mt-1">{errors.percentage}</p>}
          <p className="text-[11px] text-slate-400 mt-1">
            {language === "ka"
              ? "10 ნიშნავს 10%-იან ფასდაკლებას. მოსწავლე იხდის საწყისი ფასის 90%-ს."
              : "10 means a 10% discount, so the student pays 90% of the base price."}
          </p>
        </div>
      </div>

      {/* Mode (city / yard) */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">
          {language === "ka" ? "გაკვეთილის ადგილი" : "Lesson mode"}
        </p>
        <div className="flex flex-wrap gap-2">
          {modeButtons.map(({ value, labelKa, labelEn, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleModeChange(value)}
              className={`flex min-h-[42px] flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all sm:flex-none ${
                form.mode === value
                  ? "bg-[#F03D3D] text-white border-[#F03D3D] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {language === "ka" ? labelKa : labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">
          {language === "ka" ? "გადაცემათა კოლოფი" : "Transmission"}
        </p>
        <div className="flex gap-2 flex-wrap">
          {transmissionButtons.map(({ value, labelKa, labelEn }) => {
            const disabled = !selectableTransmissions.includes(value);
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => set("transmission", value)}
                title={
                  disabled
                    ? (language === "ka"
                        ? "შესაძლებელია მხოლოდ ფასების დამთხვევისას"
                        : "Only available when prices match")
                    : undefined
                }
                className={`flex min-h-[40px] items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all sm:flex-none ${
                  form.transmission === value
                    ? "bg-[#F03D3D] text-white border-[#F03D3D] shadow-sm"
                    : disabled
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                {language === "ka" ? labelKa : labelEn}
              </button>
            );
          })}
        </div>
        {errors.transmission && <p className="text-xs text-red-500 mt-1">{errors.transmission}</p>}
        {availableTransmissions?.length === 1 && (
          <p className="text-[11px] text-slate-400 mt-1">
            {language === "ka"
              ? "დამოუკიდებელი ინსტრუქტორის პაკეტი უნდა ემთხვეოდეს პროფილში მითითებულ კოლოფს."
              : "Independent instructor packages must match the transmission set on the profile."}
          </p>
        )}
      </div>

      {/* Price preview */}
      {computedPrice != null && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <span className="text-slate-500">
            {language === "ka" ? "სავარაუდო ღირებულება: " : "Estimated price: "}
          </span>
          <span className="font-bold text-slate-900">₾{computedPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {language === "ka" ? "აღწერა (სურვ.)" : "Description (optional)"}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30"
          placeholder={language === "ka" ? "პაკეტის მოკლე აღწერა..." : "Short description of what's included..."}
        />
      </div>

      {/* Popular */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => set("popular", !form.popular)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              form.popular ? "border-[#F03D3D] bg-[#F03D3D]" : "border-slate-300"
            }`}
          >
            {form.popular && <Star className="w-3 h-3 text-white fill-white" />}
          </div>
          <span className="text-sm text-slate-700 font-medium">
            {language === "ka" ? "პოპულარული პაკეტი" : "Mark as popular"}
          </span>
        </label>
        {popularTakenBy && !form.popular && (
          <p className="text-[11px] text-amber-500 mt-1 ml-7">
            {language === "ka"
              ? `"${popularTakenBy}" უკვე პოპულარულია — მონიშვნა გადაიტანს`
              : `"${popularTakenBy}" is already popular — marking this will replace it`}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-sm font-semibold shadow shadow-red-500/20 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isSaving
            ? language === "ka" ? "შენახვა..." : "Saving..."
            : language === "ka" ? "შენახვა" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors sm:w-auto"
        >
          {language === "ka" ? "გაუქმება" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

// ─── PackageCard ──────────────────────────────────────────────────────────────

export function PackageCard({
  pkg,
  pricing,
  onEdit,
  onToggleActive,
  onDelete,
  isTogglingActive,
  isDeleting,
  language,
}: {
  pkg: CoursePackage;
  pricing: PackagePricingSource | null;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isTogglingActive: boolean;
  isDeleting: boolean;
  language: string;
}) {
  const isActive = pkg.is_active ?? true;
  const hasBookedLessons = pkg.has_booked_lessons ?? false;
  const canDelete = pkg.can_delete ?? !hasBookedLessons;

  // Derive computed price for display
  const lessons = pkg.lessons;
  const pct = Number(pkg.percentage);
  let unitPrice: number | null = null;
  if (pricing) {
    if (pkg.mode === "city") {
      if (pkg.transmission === "manual") unitPrice = pricing.manual_city_price != null ? Number(pricing.manual_city_price) : null;
      else if (pkg.transmission === "automatic") unitPrice = pricing.automatic_city_price != null ? Number(pricing.automatic_city_price) : null;
      else unitPrice = pricing.manual_city_price != null ? Number(pricing.manual_city_price) : null;
    } else {
      if (pkg.transmission === "manual") unitPrice = pricing.manual_yard_price != null ? Number(pricing.manual_yard_price) : null;
      else if (pkg.transmission === "automatic") unitPrice = pricing.automatic_yard_price != null ? Number(pricing.automatic_yard_price) : null;
      else unitPrice = pricing.manual_yard_price != null ? Number(pricing.manual_yard_price) : null;
    }
  }
  const computedPrice = unitPrice != null && !isNaN(pct)
    ? applyPackagePercentage(unitPrice * lessons, pct)
    : null;
  const adjustmentLabel = formatPackageAdjustment(pkg.percentage);

  const ModeIcon = pkg.mode === "yard" ? SquareParking : MapPin;

  return (
    <div className={`relative rounded-2xl border p-4 sm:p-5 ${
      isActive ? "bg-white border-slate-200" : "bg-slate-50/70 border-slate-300"
    }`}>
      {pkg.popular && (
        <div className="absolute -top-2 left-4">
          <span className="bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-white" />
            {language === "ka" ? "პოპულარული" : "Popular"}
          </span>
        </div>
      )}

      <div className="mt-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold text-slate-900 truncate">{pkg.name}</h4>
          {!isActive && (
            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              {language === "ka" ? "არააქტიური" : "Inactive"}
            </span>
          )}
          {hasBookedLessons && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {language === "ka" ? "დაჯავშნილი გაკვეთილები" : "Booked lessons"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            {pkg.lessons} {language === "ka" ? "გაკვ." : "lessons"}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#F03D3D]">
            <Percent className="w-3.5 h-3.5" />
            {adjustmentLabel ?? "-"}
          </span>
        </div>
        {/* Mode + Transmission badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
            <ModeIcon className="w-2.5 h-2.5" />
            {pkg.mode === "city" ? (language === "ka" ? "ქალაქი" : "City") : (language === "ka" ? "მოედანი" : "Yard")}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            pkg.transmission === "automatic"
              ? "bg-blue-50 text-blue-600"
              : pkg.transmission === "both"
              ? "bg-purple-50 text-purple-600"
              : "bg-orange-50 text-orange-600"
          }`}>
            <Car className="w-2.5 h-2.5" />
            {pkg.transmission === "manual"
              ? (language === "ka" ? "მექ." : "Manual")
              : pkg.transmission === "automatic"
              ? (language === "ka" ? "ავტო." : "Auto")
              : (language === "ka" ? "ორივე" : "Both")}
          </span>
        </div>
        {/* Computed price */}
        {computedPrice != null && (
          <div className="text-sm font-bold text-slate-900">₾{computedPrice.toFixed(2)}</div>
        )}
        {pkg.description && (
          <p className="text-xs text-slate-400 line-clamp-2">{pkg.description}</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:flex sm:flex-wrap">
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:justify-start sm:py-1"
        >
          <Pencil className="w-3.5 h-3.5" />
          {language === "ka" ? "რედაქტირება" : "Edit"}
        </button>
        <button
          onClick={onToggleActive}
          disabled={isTogglingActive}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-40 sm:justify-start sm:py-1 ${
            isActive
              ? "text-amber-600 hover:bg-amber-50"
              : "text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {isTogglingActive
            ? language === "ka" ? "განახლება..." : "Updating..."
            : isActive
            ? language === "ka" ? "დეაქტივაცია" : "Deactivate"
            : language === "ka" ? "აქტივაცია" : "Activate"}
        </button>
        {canDelete ? (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 sm:justify-start sm:py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting
              ? language === "ka" ? "წაშლა..." : "Deleting..."
              : language === "ka" ? "წაშლა" : "Delete"}
          </button>
        ) : (
          <span className="flex items-center justify-center rounded-lg px-2 py-2 text-[11px] font-medium text-amber-700 sm:justify-start sm:py-1">
            {language === "ka"
              ? "წაშლა განიბლოკება როცა დაჯავშნილი გაკვეთილები დასრულდება"
              : "Delete unlocks after booked lessons are completed or cancelled"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AutoschoolPackages({ schoolId }: AutoschoolPackagesProps) {
  const { getToken } = useClerkAuth();
  const { language } = useLanguage();

  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [school, setSchool] = useState<AutoschoolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError(language === "ka" ? "ავტორიზაცია საჭიროა." : "Authorization is required.");
        return;
      }
      const [s, packageRows] = await Promise.all([
        getAutoschool(schoolId),
        getAutoschoolPackagesForAdmin(schoolId, token),
      ]);
      setSchool(s);
      setPackages(packageRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load packages.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, language, schoolId]);

  useEffect(() => { void load(); }, [load]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const formToInput = (form: PackageFormState): CoursePackageCreateInput => ({
    name: form.name.trim(),
    lessons: Number(form.lessons),
    percentage: Number(form.percentage),
    popular: form.popular,
    description: form.description.trim() || null,
    mode: form.mode,
    transmission: form.transmission,
  });

  const handleAdd = async (form: PackageFormState) => {
    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) return;
      const created = await createPackage(schoolId, formToInput(form), token);
      setPackages((prev) => {
        const base = form.popular ? prev.map((p) => ({ ...p, popular: false })) : prev;
        return [...base, created];
      });
      setShowAddForm(false);
      flash(language === "ka" ? "პაკეტი დამატებულია" : "Package created successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create package.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (pkg: CoursePackage, form: PackageFormState) => {
    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) return;
      const updated = await updatePackage(schoolId, pkg.id, formToInput(form), token);
      setPackages((prev) =>
        prev.map((p) => {
          if (p.id === pkg.id) return updated;
          return form.popular ? { ...p, popular: false } : p;
        })
      );
      setEditingId(null);
      flash(language === "ka" ? "პაკეტი განახლდა" : "Package updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update package.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pkg: CoursePackage) => {
    if (!window.confirm(
      language === "ka" ? `წაშლით "${pkg.name}" პაკეტს?` : `Delete package "${pkg.name}"?`
    )) return;
    try {
      setDeletingId(pkg.id);
      const token = await getToken();
      if (!token) return;
      await deletePackage(schoolId, pkg.id, token);
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
      flash(language === "ka" ? "პაკეტი წაიშალა" : "Package deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete package.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (pkg: CoursePackage) => {
    try {
      setTogglingId(pkg.id);
      const token = await getToken();
      if (!token) return;
      const updated = await updatePackage(schoolId, pkg.id, { is_active: !(pkg.is_active ?? true) }, token);
      setPackages((prev) => prev.map((item) => (item.id === pkg.id ? updated : item)));
      flash(
        (pkg.is_active ?? true)
          ? language === "ka" ? "პაკეტი დეაქტივირდა" : "Package deactivated."
          : language === "ka" ? "პაკეტი გააქტიურდა" : "Package activated."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update package.");
    } finally {
      setTogglingId(null);
    }
  };

  const pkgToForm = (pkg: CoursePackage): PackageFormState => ({
    name: pkg.name,
    lessons: String(pkg.lessons),
    percentage: pkg.percentage != null ? String(pkg.percentage) : "",
    popular: pkg.popular,
    description: pkg.description ?? "",
    mode: (pkg.mode === "yard" ? "yard" : "city") as "city" | "yard",
    transmission: (["manual", "automatic", "both"].includes(pkg.transmission)
      ? pkg.transmission
      : "manual") as "manual" | "automatic" | "both",
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === "ka" ? "კურსის პაკეტები" : "Course Packages"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {packages.length} {language === "ka" ? "პაკეტი" : "package(s)"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {language === "ka"
              ? "დაჯავშნილი გაკვეთილების მქონე პაკეტები მხოლოდ დეაქტიურდება, ხოლო წაშლა შემდეგ გახდება შესაძლებელი."
              : "Packages with booked lessons can only be deactivated. Delete becomes available after those lessons finish."}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-sm font-semibold shadow shadow-red-500/20 hover:opacity-90 transition-opacity sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            {language === "ka" ? "პაკეტის დამატება" : "Add Package"}
          </button>
        )}
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
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3 sm:items-center">
            <h3 className="text-sm font-bold text-slate-900">
              {language === "ka" ? "ახალი პაკეტი" : "New Package"}
            </h3>
            <button onClick={() => setShowAddForm(false)} className="shrink-0">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          <PackageForm
            pricing={school}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isSaving={isSaving}
            language={language}
            popularTakenBy={packages.find((p) => p.popular)?.name ?? null}
          />
        </div>
      )}

      {/* Package cards */}
      {packages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.map((pkg) =>
            editingId === pkg.id ? (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-[#F03D3D]/30 p-4 sm:p-5 col-span-1 sm:col-span-2"
              >
                <div className="mb-4 flex items-start justify-between gap-3 sm:items-center">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === "ka" ? "პაკეტის რედაქტირება" : "Edit Package"}
                  </h3>
                  <button onClick={() => setEditingId(null)} className="shrink-0">
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
                <PackageForm
                  initial={pkgToForm(pkg)}
                  pricing={school}
                  onSave={(form) => handleEdit(pkg, form)}
                  onCancel={() => setEditingId(null)}
                  isSaving={isSaving}
                  language={language}
                  popularTakenBy={packages.find((p) => p.popular && p.id !== pkg.id)?.name ?? null}
                />
              </div>
            ) : (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                pricing={school}
                onEdit={() => { setEditingId(pkg.id); setShowAddForm(false); }}
                onToggleActive={() => handleToggleActive(pkg)}
                onDelete={() => handleDelete(pkg)}
                isTogglingActive={togglingId === pkg.id}
                isDeleting={deletingId === pkg.id}
                language={language}
              />
            )
          )}
        </div>
      ) : (
        !showAddForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              {language === "ka"
                ? "პაკეტები ჯერ არ არის დამატებული"
                : "No packages yet. Add your first course package."}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {language === "ka" ? "პაკეტის დამატება" : "Add Package"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
