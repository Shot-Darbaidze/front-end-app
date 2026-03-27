"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Upload, Loader2, CheckCircle, Camera } from "lucide-react";
import { CITIES, PRIMARY_LANGUAGE_OPTIONS, OTHER_LANGUAGE_OPTIONS, ALL_LANGUAGE_OPTIONS } from "@/config/constants";
import { getAutoschool, updateAutoschool } from "@/services/autoschoolService";
import { API_CONFIG } from "@/config/constants";

interface AutoschoolSettingsProps {
  schoolId: string;
}

export function AutoschoolSettings({ schoolId }: AutoschoolSettingsProps) {
  const { getToken } = useAuth();

  // ── Form state ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showOtherLanguages, setShowOtherLanguages] = useState(false);

  // ── Logo & cover ──
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Original data for dirty detection
  const originalRef = useRef<Record<string, unknown>>({});

  // ── Load school data ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const school = await getAutoschool(schoolId);
        if (cancelled || !school) return;

        setName(school.name);
        setDescription(school.description ?? "");
        setSelectedCities(school.city ? school.city.split(",").map((c) => c.trim()).filter(Boolean) : []);
        setAddress(school.address ?? "");
        setGoogleMapsUrl(school.google_maps_url ?? "");
        setSelectedLanguages(school.languages ? school.languages.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean) : []);
        setLogoPreview(school.logo_url ?? null);
        setCoverPreview(school.cover_image_url ?? null);

        // Check if any "other" languages are selected
        const otherCodes = OTHER_LANGUAGE_OPTIONS.map((o) => o.code);
        if (school.languages) {
          const langCodes = school.languages.split(",").map((l) => l.trim().toLowerCase());
          if (langCodes.some((c) => otherCodes.includes(c))) {
            setShowOtherLanguages(true);
          }
        }

        originalRef.current = {
          name: school.name,
          description: school.description ?? "",
          city: school.city ?? "",
          address: school.address ?? "",
          google_maps_url: school.google_maps_url ?? "",
          languages: school.languages ?? "",
        };
      } catch {
        setError("Failed to load autoschool data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  // ── Dirty tracking ──
  useEffect(() => {
    const current = {
      name,
      description,
      city: selectedCities.join(","),
      address,
      google_maps_url: googleMapsUrl,
      languages: selectedLanguages.join(","),
    };
    const orig = originalRef.current;
    const changed = Object.keys(current).some(
      (k) => (current as Record<string, unknown>)[k] !== orig[k],
    );
    setDirty(changed);
  }, [name, description, selectedCities, address, googleMapsUrl, selectedLanguages]);

  // ── Handlers ──
  function toggleCity(city: string) {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }

  function toggleLanguage(code: string) {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  async function handleSave() {
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      if (!name.trim()) throw new Error("School name is required.");
      if (selectedCities.length === 0) throw new Error("Select at least one city.");

      const payload: Record<string, string | null> = {
        name: name.trim(),
        description: description.trim() || null,
        city: selectedCities.join(","),
        address: address.trim() || null,
        google_maps_url: googleMapsUrl.trim() || null,
        languages: selectedLanguages.length > 0 ? selectedLanguages.join(",") : null,
      };

      await updateAutoschool(schoolId, payload, token);

      // Update originals
      originalRef.current = {
        name: payload.name ?? "",
        description: payload.description ?? "",
        city: payload.city ?? "",
        address: payload.address ?? "",
        google_maps_url: payload.google_maps_url ?? "",
        languages: payload.languages ?? "",
      };
      setDirty(false);
      setSuccessMsg("Changes saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Autoschool Settings</h2>
        <p className="text-sm text-gray-500">Update your school&apos;s public profile information.</p>
      </div>

      {/* Cover + Logo (read-only preview) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800 relative">
          {coverPreview && (
            <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 rounded-xl border-4 border-white bg-gray-100 shadow overflow-hidden flex items-center justify-center">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* School Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            School Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all"
            placeholder="e.g. Tbilisi Driving Academy"
          />
        </div>

        {/* City multi-select */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => {
              const selected = selectedCities.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleCity(city)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                    selected
                      ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5"
                      : "border-gray-200 text-gray-700 bg-white"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
          {selectedCities.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Selected: {selectedCities.join(", ")}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all"
            placeholder="123 Rustaveli Ave"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all resize-none"
            placeholder="Tell students about your school, teaching style, experience..."
          />
        </div>

        {/* Languages */}
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

        {/* Google Maps URL */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Google Maps Embed URL</label>
          <input
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all"
            placeholder="https://maps.google.com/maps?q=..."
          />
        </div>

        {/* Error / Success */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-6 py-2.5 rounded-xl bg-[#F03D3D] hover:bg-[#d93333] active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-200/50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
