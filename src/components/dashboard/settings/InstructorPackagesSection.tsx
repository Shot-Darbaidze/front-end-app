"use client";

import { useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle, Package, Plus, X } from "lucide-react";
import type {
  CoursePackage,
  CoursePackageCreateInput,
} from "@/services/autoschoolService";
import {
  PackageCard,
  PackageForm,
  type PackageFormState,
  type PackagePricingSource,
} from "@/components/dashboard/autoschool/AutoschoolPackages";
import {
  createMyPackage,
  deleteMyPackage,
  updateMyPackage,
} from "@/services/instructorPackageService";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeTransmission, type InstructorPost } from "./types";

interface InstructorPackagesSectionProps {
  post: InstructorPost;
}

function toInput(form: PackageFormState): CoursePackageCreateInput {
  return {
    name: form.name.trim(),
    lessons: Number(form.lessons),
    percentage: Number(form.percentage),
    popular: form.popular,
    description: form.description.trim() || null,
    mode: form.mode,
    transmission: form.transmission,
  };
}

function toForm(pkg: CoursePackage): PackageFormState {
  return {
    name: pkg.name,
    lessons: String(pkg.lessons),
    percentage: pkg.percentage != null ? String(pkg.percentage) : "",
    popular: pkg.popular,
    description: pkg.description ?? "",
    mode: pkg.mode === "yard" ? "yard" : "city",
    transmission: ["manual", "automatic", "both"].includes(pkg.transmission)
      ? (pkg.transmission as "manual" | "automatic" | "both")
      : "manual",
  };
}

export default function InstructorPackagesSection({ post }: InstructorPackagesSectionProps) {
  const { getToken } = useClerkAuth();
  const { language } = useLanguage();

  const [packages, setPackages] = useState<CoursePackage[]>(post.packages ?? []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setPackages(post.packages ?? []);
  }, [post.packages]);

  const pricing: PackagePricingSource = {
    manual_city_price: post.manual_city_price ?? null,
    manual_yard_price: post.manual_yard_price ?? null,
    automatic_city_price: post.automatic_city_price ?? null,
    automatic_yard_price: post.automatic_yard_price ?? null,
  };
  const instructorTransmission = normalizeTransmission(post.transmission) === "automatic"
    ? "automatic"
    : "manual";
  const soloTransmissions = [instructorTransmission] as const;

  const flash = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const isEmployee = post.instructor_type === "employee";
  const isApprovedIndependent = !isEmployee && post.is_approved === true;

  if (isEmployee) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 mb-2">
          {language === "ka" ? "კურსის პაკეტები" : "Course packages"}
        </h3>
        <p className="text-sm text-gray-500">
          {language === "ka"
            ? "თქვენი პაკეტებს ავტოსკოლა მართავს. დამოუკიდებელი რედაქტირება ხელმისაწვდომი არ არის."
            : "Your autoschool manages your packages. Independent package editing is not available."}
        </p>
      </div>
    );
  }

  if (!isApprovedIndependent) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 mb-2">
          {language === "ka" ? "კურსის პაკეტები" : "Course packages"}
        </h3>
        <p className="text-sm text-gray-500">
          {language === "ka"
            ? "პაკეტების დამატება ხელმისაწვდომი გახდება დამოუკიდებელი პროფილის დამტკიცების შემდეგ."
            : "You can manage packages after your independent instructor profile is approved."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
              ? "დაჯავშნილი გაკვეთილების მქონე პაკეტები ჯერ დეაქტიურდება და მხოლოდ შემდეგ გახდება წაშლადი."
              : "Packages with booked lessons can only be deactivated first. Delete becomes available after those lessons finish."}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F03D3D] to-[#e04545] text-white text-sm font-semibold shadow shadow-red-500/20 hover:opacity-90 transition-opacity sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            {language === "ka" ? "პაკეტის დამატება" : "Add Package"}
          </button>
        )}
      </div>

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
            pricing={pricing}
            availableTransmissions={soloTransmissions}
            defaultTransmission={instructorTransmission}
            onSave={async (form) => {
              try {
                setIsSaving(true);
                const token = await getToken();
                if (!token) {
                  return;
                }
                const created = await createMyPackage(toInput(form), token);
                setPackages((prev) => {
                  const base = form.popular ? prev.map((item) => ({ ...item, popular: false })) : prev;
                  return [...base, created];
                });
                setShowAddForm(false);
                flash(language === "ka" ? "პაკეტი დამატებულია" : "Package created successfully.");
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Failed to create package.");
              } finally {
                setIsSaving(false);
              }
            }}
            onCancel={() => setShowAddForm(false)}
            isSaving={isSaving}
            language={language}
            popularTakenBy={packages.find((item) => item.popular)?.name ?? null}
          />
        </div>
      )}

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
                  initial={toForm(pkg)}
                  pricing={pricing}
                  availableTransmissions={soloTransmissions}
                  defaultTransmission={instructorTransmission}
                  onSave={async (form) => {
                    try {
                      setIsSaving(true);
                      const token = await getToken();
                      if (!token) {
                        return;
                      }
                      const updated = await updateMyPackage(pkg.id, toInput(form), token);
                      setPackages((prev) =>
                        prev.map((item) => {
                          if (item.id === pkg.id) {
                            return updated;
                          }
                          return form.popular ? { ...item, popular: false } : item;
                        }),
                      );
                      setEditingId(null);
                      flash(language === "ka" ? "პაკეტი განახლდა" : "Package updated.");
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : "Failed to update package.");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onCancel={() => setEditingId(null)}
                  isSaving={isSaving}
                  language={language}
                  popularTakenBy={packages.find((item) => item.popular && item.id !== pkg.id)?.name ?? null}
                />
              </div>
            ) : (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                pricing={pricing}
                onEdit={() => {
                  setEditingId(pkg.id);
                  setShowAddForm(false);
                }}
                onToggleActive={async () => {
                  try {
                    setTogglingId(pkg.id);
                    const token = await getToken();
                    if (!token) {
                      return;
                    }
                    const updated = await updateMyPackage(pkg.id, { is_active: !(pkg.is_active ?? true) }, token);
                    setPackages((prev) => prev.map((item) => (item.id === pkg.id ? updated : item)));
                    flash(
                      (pkg.is_active ?? true)
                        ? language === "ka" ? "პაკეტი დეაქტივირდა" : "Package deactivated."
                        : language === "ka" ? "პაკეტი გააქტიურდა" : "Package activated."
                    );
                  } catch (cause) {
                    setError(cause instanceof Error ? cause.message : "Failed to update package.");
                  } finally {
                    setTogglingId(null);
                  }
                }}
                onDelete={async () => {
                  if (!window.confirm(
                    language === "ka" ? `წაშლით "${pkg.name}" პაკეტს?` : `Delete package "${pkg.name}"?`,
                  )) {
                    return;
                  }
                  try {
                    setDeletingId(pkg.id);
                    const token = await getToken();
                    if (!token) {
                      return;
                    }
                    await deleteMyPackage(pkg.id, token);
                    setPackages((prev) => prev.filter((item) => item.id !== pkg.id));
                    flash(language === "ka" ? "პაკეტი წაიშალა" : "Package deleted.");
                  } catch (cause) {
                    setError(cause instanceof Error ? cause.message : "Failed to delete package.");
                  } finally {
                    setDeletingId(null);
                  }
                }}
                isTogglingActive={togglingId === pkg.id}
                isDeleting={deletingId === pkg.id}
                language={language}
              />
            ),
          )}
        </div>
      ) : (
        !showAddForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 text-center">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              {language === "ka"
                ? "პაკეტები ჯერ არ არის დამატებული"
                : "No packages yet. Add your first course package."}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
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