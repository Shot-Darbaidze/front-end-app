"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { X } from "lucide-react";
import { CITIES, PRIMARY_LANGUAGE_OPTIONS, OTHER_LANGUAGE_OPTIONS, ALL_LANGUAGE_OPTIONS } from "@/config/constants";
import { normalizePhone, validateGeorgianPhone } from "@/utils/validation/georgianPhone";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = parseInt(process.env.NEXT_PUBLIC_MAX_AUTOSCHOOL_IMAGES ?? "5", 10);

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  address: string;
  google_maps_url: string;
}

interface GalleryItem {
  file: File;
  previewUrl: string;
}

const INITIAL: FormState = {
  name: "",
  description: "",
  address: "",
  google_maps_url: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutoschoolApplyPage() {
  const { getToken } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showOtherLanguages, setShowOtherLanguages] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Gallery images (up to MAX_IMAGES)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const galleryItemsRef = useRef<GalleryItem[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Phone popup state
  const [userPhone, setUserPhone] = useState<string>("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    galleryItemsRef.current = galleryItems;
  }, [galleryItems]);

  useEffect(() => {
    return () => {
      galleryItemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const hasPhone = normalizePhone(userPhone).length > 0;

  // Check user phone on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(`${API_BASE}/api/users/me/phone`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserPhone(data.mobile_number || "");
        }
      } catch { /* ignore */ }
    })();
  }, [getToken]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (s: string | null) => void,
  ) {
    const file = e.target.files?.[0] ?? null;
    setter(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => previewSetter(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      previewSetter(null);
    }
  }

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - galleryItems.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;

    const nextItems = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setGalleryItems((prev) => [...prev, ...nextItems]);
    e.target.value = "";
  }

  function handleImageRemove(index: number) {
    setGalleryItems((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleCityChange(city: string) {
    setSelectedCity(city);
  }

  function toggleLanguage(code: string) {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  async function doSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in to continue.");

      if (!selectedCity) throw new Error("Please select a city.");

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("city", selectedCity);
      if (form.description) fd.append("description", form.description);
      if (form.address) fd.append("address", form.address);
      if (form.google_maps_url) fd.append("google_maps_url", form.google_maps_url);
      if (selectedLanguages.length > 0) fd.append("languages", selectedLanguages.join(","));
      if (logoFile) fd.append("logo", logoFile);
      if (coverFile) fd.append("cover", coverFile);
      galleryItems.forEach((item) => fd.append("images", item.file));

      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${API_BASE}/api/autoschools/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail ?? data?.error ?? "Submission failed.";
        if (typeof detail === "string" && detail.toLowerCase().includes("phone number is required in your profile")) {
          setPhoneInput("");
          setPhoneConfirmed(false);
          setPhoneError(null);
          setShowPhoneModal(true);
          return;
        }
        throw new Error(detail);
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasPhone) {
      setPhoneInput("");
      setPhoneConfirmed(false);
      setPhoneError(null);
      setShowPhoneModal(true);
      return;
    }

    await doSubmit();
  }

  async function handleSavePhoneAndContinue() {
    const digits = normalizePhone(phoneInput);
    const phoneErr = validateGeorgianPhone(digits, { required: true });

    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    if (!phoneConfirmed) {
      setPhoneError("Please confirm your number is correct");
      return;
    }

    setPhoneSaving(true);
    setPhoneError(null);

    try {
      const token = await getToken();
      if (!token) {
        setPhoneError("Not authenticated");
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${API_BASE}/api/users/me/phone`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: digits, confirmed: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to save phone" }));
        throw new Error(err.detail || "Failed to save phone");
      }

      setUserPhone(digits);
      setShowPhoneModal(false);
      await doSubmit();
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Failed to save phone");
    } finally {
      setPhoneSaving(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-28">
        <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Application Is Being Processed</h2>
          <p className="text-gray-500 text-sm">
            Your autoschool application was submitted successfully and is now under review. We&apos;ll notify you as soon as it&apos;s approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50/30 pt-28 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-red-50 text-[#F03D3D] px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <span>🏫</span> Autoschool Application
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Register Your Autoschool</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Fill in your school details. Our team will review your application within 1–2 business days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Cover image */}
          <div
            className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 group border-2 border-dashed border-slate-300 hover:border-[#F03D3D] transition-colors"
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover cursor-pointer" onClick={() => coverInputRef.current?.click()} />
                <button
                  type="button"
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-[#F03D3D] transition-colors cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Upload Cover Image</span>
              </div>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFileChange(e, setCoverFile, setCoverPreview)} />
          </div>

          {/* Logo + school name */}
          <div className="flex gap-4 items-start">
            <div
              className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-[#F03D3D] transition-colors cursor-pointer flex items-center justify-center bg-slate-50 group"
            >
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="logo" className="w-full h-full object-cover" onClick={() => logoInputRef.current?.click()} />
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors z-10"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </>
              ) : (
                <svg className="w-6 h-6 text-slate-400 group-hover:text-[#F03D3D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" onClick={() => logoInputRef.current?.click()}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">School Name <span className="text-red-500">*</span></label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Tbilisi Driving Academy"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
              />
            </div>
          </div>

          {/* City dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
            >
              <option value="">Select a city</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Rustaveli Ave"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Tell students about your school, teaching style, and experience..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white resize-none"
            />
          </div>

          {/* Languages toggle buttons */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Languages</label>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_LANGUAGE_OPTIONS.map((opt) => {
                const selected = selectedLanguages.includes(opt.code);
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => toggleLanguage(opt.code)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      selected
                        ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                        : "border-gray-200 text-gray-700 bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowOtherLanguages((p) => !p)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  showOtherLanguages
                    ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                    : "border-gray-200 text-gray-700 bg-white"
                }`}
              >
                Other
              </button>
            </div>
            {showOtherLanguages && (
              <div className="flex flex-wrap gap-2 mt-2">
                {OTHER_LANGUAGE_OPTIONS.map((opt) => {
                  const selected = selectedLanguages.includes(opt.code);
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => toggleLanguage(opt.code)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        selected
                          ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                          : "border-gray-200 text-gray-700 bg-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedLanguages.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedLanguages.map((c) => ALL_LANGUAGE_OPTIONS.find((o) => o.code === c)?.label ?? c).join(", ")}
              </p>
            )}
          </div>

          {/* Gallery images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gallery Images <span className="text-slate-400 font-normal">(up to {MAX_IMAGES})</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {galleryItems.map((item, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={item.previewUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(idx)}
                    aria-label={`Remove gallery image ${idx + 1}`}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {galleryItems.length < MAX_IMAGES && (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#F03D3D] transition-colors cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-[#F03D3D]"
                >
                  <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">Add</span>
                </div>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageAdd}
            />
          </div>

          {/* Google Maps */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Google Maps Embed URL</label>
            <input
              name="google_maps_url"
              value={form.google_maps_url}
              onChange={handleChange}
              placeholder="https://maps.google.com/maps?q=..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#F03D3D] hover:bg-[#d93333] active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-200"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </div>

      {/* ── Phone popup modal ── */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPhoneModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Phone number required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Before submitting, add your phone number and confirm it is correct.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. 555123456"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D]"
            />

            <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={phoneConfirmed}
                onChange={(e) => setPhoneConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>I confirm this phone number is correct</span>
            </label>

            {phoneError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {phoneError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                disabled={phoneSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhoneAndContinue}
                disabled={phoneSaving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#F03D3D] hover:bg-[#d93333] disabled:opacity-60"
              >
                {phoneSaving ? "Saving..." : "Save and continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
