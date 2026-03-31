"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createPackage,
  updatePackage,
  deletePackage,
  getAutoschool,
  type CoursePackage,
  type CoursePackageCreateInput,
  type AutoschoolDetail,
} from "@/services/autoschoolService";
import {
  Plus, Pencil, Trash2, Star, X, AlertCircle, CheckCircle,
  Package, Percent, MapPin, SquareParking, Car,
} from "lucide-react";

interface AutoschoolPackagesProps {
  schoolId: string;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface PackageFormState {
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
  percentage: "",
  popular: false,
  description: "",
  mode: "city",
  transmission: "manual",
});

// ─── Helper: derive computed price from school prices ─────────────────────────

function computePrice(
  school: AutoschoolDetail | null,
  form: PackageFormState,
): number | null {
  if (!school) return null;
  const lessons = parseInt(form.lessons, 10);
  const pct = parseFloat(form.percentage);
  if (isNaN(lessons) || lessons < 1) return null;
  if (isNaN(pct) || pct < 0 || pct > 200) return null;

  let unitPrice: number | null | undefined;
  if (form.mode === "city") {
    if (form.transmission === "manual") unitPrice = school.manual_city_price != null ? Number(school.manual_city_price) : null;
    else if (form.transmission === "automatic") unitPrice = school.automatic_city_price != null ? Number(school.automatic_city_price) : null;
    else {
      // "both" — only valid when both prices match
      const m = school.manual_city_price != null ? Number(school.manual_city_price) : null;
      const a = school.automatic_city_price != null ? Number(school.automatic_city_price) : null;
      unitPrice = (m != null && a != null && m === a) ? m : null;
    }
  } else {
    if (form.transmission === "manual") unitPrice = school.manual_yard_price != null ? Number(school.manual_yard_price) : null;
    else if (form.transmission === "automatic") unitPrice = school.automatic_yard_price != null ? Number(school.automatic_yard_price) : null;
    else {
      const m = school.manual_yard_price != null ? Number(school.manual_yard_price) : null;
      const a = school.automatic_yard_price != null ? Number(school.automatic_yard_price) : null;
      unitPrice = (m != null && a != null && m === a) ? m : null;
    }
  }
  if (unitPrice == null) return null;
  return Number((unitPrice * lessons * (pct / 100)).toFixed(2));
}

/** "both" is only selectable when city/yard prices match for manual vs automatic */
function bothEnabled(school: AutoschoolDetail | null, mode: "city" | "yard"): boolean {
  if (!school) return false;
  if (mode === "city") {
    const m = school.manual_city_price != null ? Number(school.manual_city_price) : null;
    const a = school.automatic_city_price != null ? Number(school.automatic_city_price) : null;
    return m != null && a != null && m === a;
  } else {
    const m = school.manual_yard_price != null ? Number(school.manual_yard_price) : null;
    const a = school.automatic_yard_price != null ? Number(school.automatic_yard_price) : null;
    return m != null && a != null && m === a;
  }
}

// ─── PackageForm ──────────────────────────────────────────────────────────────

function PackageForm({
  initial,
  school,
  onSave,
  onCancel,
  isSaving,
  language,
  popularTakenBy,
}: {
  initial?: PackageFormState;
  school: AutoschoolDetail | null;
  onSave: (form: PackageFormState) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  language: string;
  popularTakenBy?: string | null;
}) {
  const [form, setForm] = useState<PackageFormState>(initial ?? emptyForm());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const set = <K extends keyof PackageFormState>(field: K, value: PackageFormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSelectBoth = bothEnabled(school, form.mode);
  const computedPrice = computePrice(school, form);

  // If "both" was selected but now prices diverge, reset to "manual"
  const handleModeChange = (newMode: "city" | "yard") => {
    const newBothEnabled = bothEnabled(school, newMode);
    setForm((prev) => ({
      ...prev,
      mode: newMode,
      transmission: prev.transmission === "both" && !newBothEnabled ? "manual" : prev.transmission,
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
      Number(form.percentage) < 0 ||
      Number(form.percentage) > 200
    )
      errs.percentage = language === "ka" ? "0–200 შორის" : "Must be 0–200";
    if (form.transmission === "both" && !bothEnabled(school, form.mode))
      errs.transmission = language === "ka"
        ? '"ორივე" ხელმისაწვდომია მხოლოდ ფასების დამთხვევისას'
        : '"Both" is only available when prices match';
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

      {/* Lessons + Percentage */}
      <div className="grid grid-cols-2 gap-3">
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
            {language === "ka" ? "პროცენტი (%)" : "Percentage (%)"}
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={200}
              step={0.01}
              value={form.percentage}
              onChange={(e) => set("percentage", e.target.value)}
              placeholder="90"
              className={`w-full pl-3 pr-8 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 ${
                errors.percentage ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
              }`}
            />
            <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          {errors.percentage && <p className="text-xs text-red-500 mt-1">{errors.percentage}</p>}
        </div>
      </div>

      {/* Mode (city / yard) */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">
          {language === "ka" ? "გაკვეთილის ადგილი" : "Lesson mode"}
        </p>
        <div className="flex gap-2">
          {modeButtons.map(({ value, labelKa, labelEn, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleModeChange(value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
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
            const disabled = value === "both" && !canSelectBoth;
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
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

      <div className="flex gap-2 pt-1">
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
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {language === "ka" ? "გაუქმება" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

// ─── PackageCard ──────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  school,
  onEdit,
  onDelete,
  isDeleting,
  language,
}: {
  pkg: CoursePackage;
  school: AutoschoolDetail | null;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  language: string;
}) {
  // Derive computed price for display
  const lessons = pkg.lessons;
  const pct = Number(pkg.percentage);
  let unitPrice: number | null = null;
  if (school) {
    if (pkg.mode === "city") {
      if (pkg.transmission === "manual") unitPrice = school.manual_city_price != null ? Number(school.manual_city_price) : null;
      else if (pkg.transmission === "automatic") unitPrice = school.automatic_city_price != null ? Number(school.automatic_city_price) : null;
      else unitPrice = school.manual_city_price != null ? Number(school.manual_city_price) : null;
    } else {
      if (pkg.transmission === "manual") unitPrice = school.manual_yard_price != null ? Number(school.manual_yard_price) : null;
      else if (pkg.transmission === "automatic") unitPrice = school.automatic_yard_price != null ? Number(school.automatic_yard_price) : null;
      else unitPrice = school.manual_yard_price != null ? Number(school.manual_yard_price) : null;
    }
  }
  const computedPrice = unitPrice != null && !isNaN(pct) ? Number((unitPrice * lessons * (pct / 100)).toFixed(2)) : null;

  const ModeIcon = pkg.mode === "yard" ? SquareParking : MapPin;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 relative">
      {pkg.popular && (
        <div className="absolute -top-2 left-4">
          <span className="bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-white" />
            {language === "ka" ? "პოპულარული" : "Popular"}
          </span>
        </div>
      )}

      <div className="mt-1 space-y-2">
        <h4 className="font-bold text-slate-900 truncate">{pkg.name}</h4>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            {pkg.lessons} {language === "ka" ? "გაკვ." : "lessons"}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#F03D3D]">
            <Percent className="w-3.5 h-3.5" />
            {Number(pkg.percentage).toFixed(0)}%
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

      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
        >
          <Pencil className="w-3.5 h-3.5" />
          {language === "ka" ? "რედაქტირება" : "Edit"}
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isDeleting
            ? language === "ka" ? "წაშლა..." : "Deleting..."
            : language === "ka" ? "წაშლა" : "Delete"}
        </button>
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
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const s = await getAutoschool(schoolId);
      setSchool(s);
      setPackages(s?.packages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load packages.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === "ka" ? "კურსის პაკეტები" : "Course Packages"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {packages.length} {language === "ka" ? "პაკეტი" : "package(s)"}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-sm font-semibold shadow shadow-red-500/20 hover:opacity-90 transition-opacity"
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {language === "ka" ? "ახალი პაკეტი" : "New Package"}
            </h3>
            <button onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          <PackageForm
            school={school}
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
                className="bg-white rounded-2xl border border-[#F03D3D]/30 p-5 col-span-1 sm:col-span-2"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === "ka" ? "პაკეტის რედაქტირება" : "Edit Package"}
                  </h3>
                  <button onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
                <PackageForm
                  initial={pkgToForm(pkg)}
                  school={school}
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
                school={school}
                onEdit={() => { setEditingId(pkg.id); setShowAddForm(false); }}
                onDelete={() => handleDelete(pkg)}
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
