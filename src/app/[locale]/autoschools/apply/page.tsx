"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  address: string;
  google_maps_url: string;
  languages: string; // CSV e.g. "KA,EN"
  fleet: string;     // CSV e.g. "Skoda Rapid,VW Jetta"
}

const INITIAL: FormState = {
  name: "",
  city: "",
  phone: "",
  email: "",
  description: "",
  address: "",
  google_maps_url: "",
  languages: "",
  fleet: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutoschoolApplyPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ka";

  const [form, setForm] = useState<FormState>(INITIAL);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in to continue.");

      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) fd.append(key, val);
      });
      if (logoFile) fd.append("logo", logoFile);
      if (coverFile) fd.append("cover", coverFile);

      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${API_BASE}/api/autoschools/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "Submission failed.");

      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/autoschools/${data.id}`), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
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
          <h2 className="text-xl font-bold text-gray-900">Application Submitted!</h2>
          <p className="text-gray-500 text-sm">
            Your autoschool application is under review. We&apos;ll notify you once it&apos;s approved.
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
            onClick={() => coverInputRef.current?.click()}
            className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 cursor-pointer group border-2 border-dashed border-slate-300 hover:border-[#F03D3D] transition-colors"
          >
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-[#F03D3D] transition-colors">
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
              onClick={() => logoInputRef.current?.click()}
              className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-[#F03D3D] transition-colors cursor-pointer flex items-center justify-center bg-slate-50 group"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-slate-400 group-hover:text-[#F03D3D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Two-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "city", label: "City", required: true, placeholder: "Tbilisi" },
              { name: "phone", label: "Phone", required: true, placeholder: "+995 555 000 000" },
              { name: "email", label: "Email", required: false, placeholder: "info@school.ge" },
              { name: "address", label: "Address", required: false, placeholder: "123 Rustaveli Ave" },
            ].map(({ name, label, required, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  name={name}
                  value={(form as Record<string, string>)[name]}
                  onChange={handleChange}
                  required={required}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
                />
              </div>
            ))}
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

          {/* Languages + Fleet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Languages <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <input
                name="languages"
                value={form.languages}
                onChange={handleChange}
                placeholder="ქართული, English, Русский"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fleet <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <input
                name="fleet"
                value={form.fleet}
                onChange={handleChange}
                placeholder="Skoda Rapid, VW Jetta"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/30 focus:border-[#F03D3D] text-sm bg-white"
              />
            </div>
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
    </div>
  );
}
