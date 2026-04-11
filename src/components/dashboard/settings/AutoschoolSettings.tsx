"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Upload, Loader2, CheckCircle, Camera, Trash2, Expand } from "lucide-react";
import { CITIES, PRIMARY_LANGUAGE_OPTIONS, OTHER_LANGUAGE_OPTIONS, ALL_LANGUAGE_OPTIONS, UPLOAD_LIMITS } from "@/config/constants";
import {
  getAutoschool,
  updateAutoschool,
  updateAutoschoolMedia,
  updateAutoschoolWorkingHours,
  type AutoschoolDetail,
  type WorkingHoursInput,
} from "@/services/autoschoolService";
import ImageLightbox from "@/components/ui/ImageLightbox";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import {
  readDashboardRouteCache,
  writeDashboardRouteCache,
} from "@/lib/dashboardRouteCache";

const MAX_AUTOSCHOOL_IMAGES = parseInt(process.env.NEXT_PUBLIC_MAX_AUTOSCHOOL_IMAGES ?? "5", 10);
const AUTOSCHOOL_SETTINGS_CACHE_NAMESPACE = "autoschool-settings";
const AUTOSCHOOL_SETTINGS_CACHE_TTL_MS = 3 * 60 * 1000;

interface AutoschoolSettingsProps {
  schoolId: string;
}

const DEFAULT_WORKING_HOURS: WorkingHoursInput[] = [
  { day_label: "Monday", hours_label: "09:00 - 20:00", is_closed: false },
  { day_label: "Tuesday", hours_label: "09:00 - 20:00", is_closed: false },
  { day_label: "Wednesday", hours_label: "09:00 - 20:00", is_closed: false },
  { day_label: "Thursday", hours_label: "09:00 - 20:00", is_closed: false },
  { day_label: "Friday", hours_label: "09:00 - 20:00", is_closed: false },
  { day_label: "Saturday", hours_label: "10:00 - 17:00", is_closed: false },
  { day_label: "Sunday", hours_label: "", is_closed: true },
];

function normalizeWorkingHours(hours: WorkingHoursInput[]): string {
  return JSON.stringify(
    hours.map((row) => ({
      day_label: row.day_label.trim(),
      hours_label: (row.hours_label ?? "").trim(),
      is_closed: Boolean(row.is_closed),
    })),
  );
}

type AutoschoolSettingsCachePayload = {
  name: string;
  description: string;
  selectedCity: string;
  address: string;
  googleMapsUrl: string;
  selectedLanguages: string[];
  showOtherLanguages: boolean;
  logoPreview: string | null;
  coverPreview: string | null;
  galleryUrls: string[];
  workingHours: WorkingHoursInput[];
  original?: Record<string, unknown>;
};

function buildSettingsPayloadFromSchool(school: AutoschoolDetail): AutoschoolSettingsCachePayload {
  const cities = school.city ? school.city.split(",").map((c) => c.trim()).filter(Boolean) : [];
  const selectedCity = cities[0] ?? "";
  const selectedLanguages = school.languages
    ? school.languages.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean)
    : [];
  const incomingWorkingHours = (school.working_hours ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((h) => ({
      day_label: h.day_label,
      hours_label: h.hours_label ?? "",
      is_closed: h.is_closed,
    }));
  const normalizedWorkingHours = incomingWorkingHours.length > 0 ? incomingWorkingHours : DEFAULT_WORKING_HOURS;
  const otherCodes = OTHER_LANGUAGE_OPTIONS.map((o) => o.code);
  const showOtherLanguages = selectedLanguages.some((c) => otherCodes.includes(c));

  return {
    name: school.name,
    description: school.description ?? "",
    selectedCity,
    address: school.address ?? "",
    googleMapsUrl: school.google_maps_url ?? "",
    selectedLanguages,
    showOtherLanguages,
    logoPreview: school.logo_url ?? null,
    coverPreview: school.cover_image_url ?? null,
    galleryUrls: school.image_urls ?? [],
    workingHours: normalizedWorkingHours,
    original: {
      name: school.name,
      description: school.description ?? "",
      city: selectedCity,
      address: school.address ?? "",
      google_maps_url: school.google_maps_url ?? "",
      languages: school.languages ?? "",
      working_hours: normalizeWorkingHours(normalizedWorkingHours),
    },
  };
}

export function AutoschoolSettings({ schoolId }: AutoschoolSettingsProps) {
  const { getToken, userId } = useAuth();

  // ── Form state ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showOtherLanguages, setShowOtherLanguages] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHoursInput[]>(DEFAULT_WORKING_HOURS);

  // ── Logo & cover ──
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // ── Gallery images ──
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // ── Media UI state ──
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaSuccess, setMediaSuccess] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [removingGalleryIdx, setRemovingGalleryIdx] = useState<number | null>(null);

  // ── Lightbox ──
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // ── Refs ──
  const originalRef = useRef<Record<string, unknown>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const cacheUserId = userId ?? "anonymous";
  const writeSettingsCache = useCallback((payload: AutoschoolSettingsCachePayload) => {
    writeDashboardRouteCache(
      {
        namespace: AUTOSCHOOL_SETTINGS_CACHE_NAMESPACE,
        userId: cacheUserId,
        variant: schoolId,
      },
      payload,
    );
  }, [cacheUserId, schoolId]);

  const applySettingsPayload = useCallback((payload: AutoschoolSettingsCachePayload) => {
    setName(payload.name);
    setDescription(payload.description);
    setSelectedCity(payload.selectedCity);
    setAddress(payload.address);
    setGoogleMapsUrl(payload.googleMapsUrl);
    setSelectedLanguages(payload.selectedLanguages);
    setShowOtherLanguages(payload.showOtherLanguages);
    setLogoPreview(payload.logoPreview);
    setCoverPreview(payload.coverPreview);
    setGalleryUrls(payload.galleryUrls);
    setWorkingHours(payload.workingHours);
    originalRef.current = payload.original ?? {
      name: payload.name,
      description: payload.description,
      city: payload.selectedCity,
      address: payload.address,
      google_maps_url: payload.googleMapsUrl,
      languages: payload.selectedLanguages.join(","),
      working_hours: normalizeWorkingHours(payload.workingHours),
    };
  }, []);

  const writeCurrentSettingsCache = (overrides: Partial<AutoschoolSettingsCachePayload> = {}) => {
    writeSettingsCache({
      name,
      description,
      selectedCity,
      address,
      googleMapsUrl,
      selectedLanguages,
      showOtherLanguages,
      logoPreview,
      coverPreview,
      galleryUrls,
      workingHours,
      original: originalRef.current,
      ...overrides,
    });
  };

  // ── Load school data ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = readDashboardRouteCache<AutoschoolSettingsCachePayload>({
        namespace: AUTOSCHOOL_SETTINGS_CACHE_NAMESPACE,
        userId: cacheUserId,
        variant: schoolId,
        ttlMs: AUTOSCHOOL_SETTINGS_CACHE_TTL_MS,
      });

      if (cached && !cancelled) {
        applySettingsPayload(cached);
        setLoading(false);
        return;
      }

      try {
        const school = await getAutoschool(schoolId);
        if (cancelled || !school) return;

        const payload = buildSettingsPayloadFromSchool(school);
        applySettingsPayload(payload);
        writeSettingsCache(payload);
      } catch {
        setError("Failed to load autoschool data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applySettingsPayload, cacheUserId, schoolId, writeSettingsCache]);

  // ── Dirty tracking ──
  useEffect(() => {
    const current = {
      name,
      description,
      city: selectedCity,
      address,
      google_maps_url: googleMapsUrl,
      languages: selectedLanguages.join(","),
      working_hours: normalizeWorkingHours(workingHours),
    };
    const orig = originalRef.current;
    const changed = Object.keys(current).some(
      (k) => (current as Record<string, unknown>)[k] !== orig[k],
    );
    setDirty(changed);
  }, [name, description, selectedCity, address, googleMapsUrl, selectedLanguages, workingHours]);

  // ── Handlers ──
  function toggleLanguage(code: string) {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function updateWorkingHour(index: number, patch: Partial<WorkingHoursInput>) {
    setWorkingHours((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.is_closed === true) {
          next.hours_label = "";
        }
        return next;
      }),
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
      if (!selectedCity) throw new Error("Please select a city.");

      const payload: Record<string, string | null> = {
        name: name.trim(),
        description: description.trim() || null,
        city: selectedCity,
        address: address.trim() || null,
        google_maps_url: googleMapsUrl.trim() || null,
        languages: selectedLanguages.length > 0 ? selectedLanguages.join(",") : null,
      };

      await updateAutoschool(schoolId, payload, token);
      const workingHoursPayload: WorkingHoursInput[] = workingHours.map((row) => ({
        day_label: row.day_label.trim(),
        hours_label: row.is_closed ? null : (row.hours_label ?? "").trim() || null,
        is_closed: row.is_closed,
      }));
      await updateAutoschoolWorkingHours(schoolId, workingHoursPayload, token);

      originalRef.current = {
        name: payload.name ?? "",
        description: payload.description ?? "",
        city: payload.city ?? "",
        address: payload.address ?? "",
        google_maps_url: payload.google_maps_url ?? "",
        languages: payload.languages ?? "",
        working_hours: normalizeWorkingHours(workingHours),
      };
      setDirty(false);
      writeCurrentSettingsCache({
        name: (payload.name ?? "") as string,
        description: (payload.description ?? "") as string,
        selectedCity: (payload.city ?? "") as string,
        address: (payload.address ?? "") as string,
        googleMapsUrl: (payload.google_maps_url ?? "") as string,
        selectedLanguages,
        showOtherLanguages,
        logoPreview,
        coverPreview,
        galleryUrls,
        workingHours,
        original: originalRef.current,
      });
      setSuccessMsg("Changes saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  // ── Media handlers with optimistic UI ──
  function showMediaSuccess(msg: string) {
    setMediaError(null);
    setMediaSuccess(msg);
    setTimeout(() => setMediaSuccess(null), 3000);
  }

  async function handleUploadLogo(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      setMediaError(`File exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }
    // Optimistic preview
    const previewUrl = URL.createObjectURL(file);
    const prevLogo = logoPreview;
    setLogoPreview(previewUrl);
    setLogoUploading(true);
    setMediaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const fd = new FormData();
      fd.append("logo", file);
      const updated = await updateAutoschoolMedia(schoolId, fd, token);
      const nextLogo = updated.logo_url ?? null;
      setLogoPreview(nextLogo);
      writeCurrentSettingsCache({ logoPreview: nextLogo });
      showMediaSuccess("Logo updated!");
    } catch (err) {
      setLogoPreview(prevLogo);
      setMediaError(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    const prevLogo = logoPreview;
    setLogoPreview(null);
    setLogoUploading(true);
    setMediaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const fd = new FormData();
      fd.append("remove_logo", "true");
      await updateAutoschoolMedia(schoolId, fd, token);
      writeCurrentSettingsCache({ logoPreview: null });
      showMediaSuccess("Logo removed!");
    } catch (err) {
      setLogoPreview(prevLogo);
      setMediaError(err instanceof Error ? err.message : "Failed to remove logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleUploadCover(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      setMediaError(`File exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const prevCover = coverPreview;
    setCoverPreview(previewUrl);
    setCoverUploading(true);
    setMediaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const fd = new FormData();
      fd.append("cover", file);
      const updated = await updateAutoschoolMedia(schoolId, fd, token);
      const nextCover = updated.cover_image_url ?? null;
      setCoverPreview(nextCover);
      writeCurrentSettingsCache({ coverPreview: nextCover });
      showMediaSuccess("Cover updated!");
    } catch (err) {
      setCoverPreview(prevCover);
      setMediaError(err instanceof Error ? err.message : "Failed to upload cover.");
    } finally {
      setCoverUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleRemoveCover() {
    const prevCover = coverPreview;
    setCoverPreview(null);
    setCoverUploading(true);
    setMediaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const fd = new FormData();
      fd.append("remove_cover", "true");
      await updateAutoschoolMedia(schoolId, fd, token);
      writeCurrentSettingsCache({ coverPreview: null });
      showMediaSuccess("Cover removed!");
    } catch (err) {
      setCoverPreview(prevCover);
      setMediaError(err instanceof Error ? err.message : "Failed to remove cover.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleUploadGallery(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_AUTOSCHOOL_IMAGES - galleryUrls.length;
    if (remaining <= 0) {
      setMediaError(`Maximum ${MAX_AUTOSCHOOL_IMAGES} gallery images allowed.`);
      return;
    }
    const selected = Array.from(files);
    const oversized = selected.filter((f) => f.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES);
    const valid = selected.filter((f) => f.size <= UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES).slice(0, remaining);
    if (oversized.length > 0) {
      setMediaError(`Some files were skipped because they exceed ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB.`);
    }
    if (valid.length === 0) return;
    // Optimistic preview
    const previewUrls = valid.map((f) => URL.createObjectURL(f));
    const prevGallery = galleryUrls;
    setGalleryUrls((prev) => [...prev, ...previewUrls]);
    setGalleryUploading(true);
    setMediaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const fd = new FormData();
      valid.forEach((f) => fd.append("images", f));
      const updated = await updateAutoschoolMedia(schoolId, fd, token);
      const nextGallery = updated.image_urls ?? [];
      setGalleryUrls(nextGallery);
      writeCurrentSettingsCache({ galleryUrls: nextGallery });
      showMediaSuccess("Photos uploaded!");
    } catch (err) {
      setGalleryUrls(prevGallery);
      setMediaError(err instanceof Error ? err.message : "Failed to upload photos.");
    } finally {
      setGalleryUploading(false);
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function handleRemoveGalleryImage(idx: number) {
    const prevGallery = [...galleryUrls];
    // Optimistic removal
    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
    setRemovingGalleryIdx(idx);
    setMediaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const fd = new FormData();
      fd.append("remove_image_indexes", String(idx));
      const updated = await updateAutoschoolMedia(schoolId, fd, token);
      const nextGallery = updated.image_urls ?? [];
      setGalleryUrls(nextGallery);
      writeCurrentSettingsCache({ galleryUrls: nextGallery });
    } catch (err) {
      setGalleryUrls(prevGallery);
      setMediaError(err instanceof Error ? err.message : "Failed to remove image.");
    } finally {
      setRemovingGalleryIdx(null);
    }
  }

  const isAtGalleryLimit = galleryUrls.length >= MAX_AUTOSCHOOL_IMAGES;

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

      {/* Cover + Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800 relative group">
          {coverPreview ? (
            <>
              <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {coverUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-[#F03D3D] transition disabled:opacity-60"
                  aria-label="Replace cover image"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={coverUploading}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition disabled:opacity-60"
                  aria-label="Remove cover image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-colors"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Upload Cover Image</span>
                </>
              )}
            </div>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleUploadCover(e.target.files)} />
        </div>
        <div className="px-6 pb-6 -mt-10 flex items-end gap-3">
          <div className="relative w-20 h-20 rounded-xl border-4 border-white bg-gray-100 shadow overflow-hidden flex items-center justify-center group/logo">
            {logoPreview ? (
              <>
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                {logoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/logo:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="p-1 rounded-full bg-black/60 text-white hover:bg-[#F03D3D] transition disabled:opacity-60"
                    aria-label="Replace logo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={logoUploading}
                    className="p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition disabled:opacity-60"
                    aria-label="Remove logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[#F03D3D] transition-colors w-full h-full"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleUploadLogo(e.target.files)} />
          </div>
        </div>
        {mediaError && (
          <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            {mediaError}
          </div>
        )}
        {mediaSuccess && (
          <div className="mx-6 mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {mediaSuccess}
          </div>
        )}
      </div>

      {/* Gallery Images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">
            Gallery Images <span className="text-sm font-normal text-gray-500">({galleryUrls.length}/{MAX_AUTOSCHOOL_IMAGES})</span>
          </h3>
          <div className="flex items-center gap-2">
            <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden"
              onChange={(e) => handleUploadGallery(e.target.files)} disabled={galleryUploading || isAtGalleryLimit} />
            <button
              type="button"
              disabled={galleryUploading || isAtGalleryLimit}
              onClick={() => galleryInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {galleryUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {isAtGalleryLimit ? "Limit Reached" : "Upload Photos"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">Max {MAX_AUTOSCHOOL_IMAGES} photos, up to {UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB each.</p>
        {galleryUrls.length === 0 ? (
          <p className="text-sm text-gray-500">No gallery images yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
                  <img
                    src={url}
                    alt={`Gallery image ${idx + 1}`}
                    className="w-full h-36 sm:h-44 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                    <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      disabled={removingGalleryIdx !== null}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label="Remove gallery image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <ImageLightbox
              images={galleryUrls.map((url, idx) => ({ src: url, alt: `Gallery image ${idx + 1}` }))}
              initialIndex={lightboxIndex}
              open={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          </>
        )}
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

        {/* City dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all"
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
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all"
            placeholder="123 Rustaveli Ave"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <AutoResizeTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-gray-50 focus:bg-white transition-all"
            placeholder="Tell students about your school, teaching style, experience..."
          />
          <p className="text-xs text-gray-400 mt-1">*bold* · _italic_ · ~strikethrough~ · Enter for new line</p>
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

        {/* Working Hours */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Working Hours</label>
          <div className="space-y-2">
            {workingHours.map((row, idx) => (
              <div
                key={`${row.day_label}-${idx}`}
                className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_auto] gap-2 items-center p-2 rounded-xl border border-gray-200 bg-gray-50"
              >
                <input
                  value={row.day_label}
                  onChange={(e) => updateWorkingHour(idx, { day_label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-white"
                  placeholder="Day label"
                />
                <input
                  value={row.hours_label ?? ""}
                  onChange={(e) => updateWorkingHour(idx, { hours_label: e.target.value })}
                  disabled={row.is_closed}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="e.g. 09:00 - 20:00"
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 justify-self-start md:justify-self-end">
                  <input
                    type="checkbox"
                    checked={row.is_closed}
                    onChange={(e) => updateWorkingHour(idx, { is_closed: e.target.checked })}
                    className="rounded border-gray-300 text-[#F03D3D] focus:ring-[#F03D3D]/30"
                  />
                  Closed
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Edit each day label and opening hours shown on your public autoschool profile.</p>
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
