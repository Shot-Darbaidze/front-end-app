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
} from "@/services/autoschoolService";
import { API_CONFIG } from "@/config/constants";
import {
  Plus, Pencil, Trash2, Star, X, AlertCircle, CheckCircle,
  Package, Users, Percent, Car,
} from "lucide-react";

interface AutoschoolPackagesProps {
  schoolId: string;
}

interface InstructorBasic {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  title: string;
}

const MODES = ["manual", "automatic", "city", "yard"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, { ka: string; en: string }> = {
  manual:    { ka: "მექანიკა",   en: "Manual" },
  automatic: { ka: "ავტომატი",   en: "Automatic" },
  city:      { ka: "ქალაქი",     en: "City" },
  yard:      { ka: "მოედანი",    en: "Yard" },
};

interface PackageFormState {
  name: string;
  lessons: string;
  percentage: string;
  applies_to_all: boolean;
  assigned_post_ids: string[];
  popular: boolean;
  description: string;
  transmission_modes: Mode[];
}

const emptyForm = (): PackageFormState => ({
  name: "",
  lessons: "",
  percentage: "",
  applies_to_all: true,
  assigned_post_ids: [],
  popular: false,
  description: "",
  transmission_modes: [],
});

// ─── PackageForm ─────────────────────────────────────────────────────────────

function PackageForm({
  initial,
  instructors,
  onSave,
  onCancel,
  isSaving,
  language,
  popularTakenBy,
}: {
  initial?: PackageFormState;
  instructors: InstructorBasic[];
  onSave: (form: PackageFormState) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  language: string;
  popularTakenBy?: string | null; // name of the package that already holds popular
}) {
  const [form, setForm] = useState<PackageFormState>(initial ?? emptyForm());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const set = <K extends keyof PackageFormState>(field: K, value: PackageFormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleInstructor = (id: string) => {
    setForm((prev) => {
      const ids = prev.assigned_post_ids.includes(id)
        ? prev.assigned_post_ids.filter((x) => x !== id)
        : [...prev.assigned_post_ids, id];
      return { ...prev, assigned_post_ids: ids };
    });
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
    if (!form.applies_to_all && form.assigned_post_ids.length === 0)
      errs.assigned = language === "ka" ? "აირჩიეთ ინსტრუქტორი" : "Select at least one instructor";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(form);
  };

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
              placeholder="100"
              className={`w-full pl-3 pr-8 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 ${
                errors.percentage ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
              }`}
            />
            <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          {errors.percentage && <p className="text-xs text-red-500 mt-1">{errors.percentage}</p>}
          <p className="text-[11px] text-slate-400 mt-1">
            {language === "ka"
              ? "ფასი = ინსტრ. ₾ × გაკვ. × (1 − % / 100)"
              : "Price = rate × lessons × (1 − % / 100)"}
          </p>
        </div>
      </div>

      {/* Applies to */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">
          {language === "ka" ? "ვისზე ვრცელდება" : "Applies to"}
        </p>
        <div className="flex gap-2">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => set("applies_to_all", val)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                form.applies_to_all === val
                  ? "bg-[#F03D3D] text-white border-[#F03D3D] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {val ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  {language === "ka" ? "ყველა ინსტრუქტორი" : "All instructors"}
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  {language === "ka" ? "კონკრეტული" : "Specific"}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission / lesson modes */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">
          {language === "ka" ? "რეჟიმი (სურვ.)" : "Mode (optional)"}
        </p>
        <p className="text-[11px] text-slate-400 mb-2">
          {language === "ka"
            ? "დატოვეთ ცარიელი — ყველა რეჟიმზე"
            : "Leave empty to apply to all modes"}
        </p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((mode) => {
            const active = form.transmission_modes.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    transmission_modes: active
                      ? prev.transmission_modes.filter((m) => m !== mode)
                      : [...prev.transmission_modes, mode],
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  active
                    ? "bg-[#F03D3D] text-white border-[#F03D3D] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                {MODE_LABELS[mode][language === "ka" ? "ka" : "en"]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructor selection */}
      {!form.applies_to_all && (
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">
            {language === "ka" ? "ინსტრუქტორების არჩევა" : "Select instructors"}
          </p>
          {instructors.length === 0 ? (
            <p className="text-xs text-slate-400">
              {language === "ka" ? "ინსტრუქტორები არ არის" : "No instructors available"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-3">
              {instructors.map((inst) => {
                const name = [inst.first_name, inst.last_name].filter(Boolean).join(" ") || inst.title;
                const checked = form.assigned_post_ids.includes(inst.id);
                return (
                  <label
                    key={inst.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => toggleInstructor(inst.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        checked ? "border-[#F03D3D] bg-[#F03D3D]" : "border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-slate-700 truncate">{name}</span>
                  </label>
                );
              })}
            </div>
          )}
          {errors.assigned && <p className="text-xs text-red-500 mt-1">{errors.assigned}</p>}
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
  onEdit,
  onDelete,
  isDeleting,
  language,
}: {
  pkg: CoursePackage;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  language: string;
}) {
  const assignedCount = pkg.assigned_post_ids?.length ?? 0;
  const scopeLabel = pkg.applies_to_all
    ? language === "ka" ? "ყველა ინსტრუქტორი" : "All instructors"
    : `${assignedCount} ${language === "ka" ? "ინსტრუქტ." : "instructor(s)"}`;

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
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Users className="w-3 h-3" />
          {scopeLabel}
        </div>
        {pkg.transmission_modes && pkg.transmission_modes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pkg.transmission_modes.map((mode) => (
              <span
                key={mode}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600"
              >
                <Car className="w-2.5 h-2.5" />
                {MODE_LABELS[mode as Mode]?.[language === "ka" ? "ka" : "en"] ?? mode}
              </span>
            ))}
          </div>
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
  const [instructors, setInstructors] = useState<InstructorBasic[]>([]);
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
      const token = await getToken();
      const school = await getAutoschool(schoolId);
      setPackages(school?.packages ?? []);
      if (token) {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/autoschools/${schoolId}/instructors`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) setInstructors(await res.json());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load packages.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, getToken]);

  useEffect(() => { void load(); }, [load]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const formToInput = (form: PackageFormState): CoursePackageCreateInput => ({
    name: form.name.trim(),
    lessons: Number(form.lessons),
    percentage: Number(form.percentage),
    applies_to_all: form.applies_to_all,
    assigned_post_ids: form.applies_to_all ? null : form.assigned_post_ids,
    popular: form.popular,
    description: form.description.trim() || null,
    transmission_modes: form.transmission_modes.length > 0 ? form.transmission_modes : null,
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
    applies_to_all: pkg.applies_to_all,
    assigned_post_ids: pkg.assigned_post_ids ?? [],
    popular: pkg.popular,
    description: pkg.description ?? "",
    transmission_modes: (pkg.transmission_modes ?? []) as Mode[],
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
            instructors={instructors}
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
                  instructors={instructors}
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
