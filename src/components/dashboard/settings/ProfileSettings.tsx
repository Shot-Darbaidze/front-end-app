"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { UPLOAD_LIMITS } from "@/config/constants";
import { Camera, Trash2 } from "lucide-react";
import { API_CONFIG } from "@/config/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    InstructorPost, InstructorAsset, InstructorProfileForm,
    emptyInstructorForm, mapPostToForm, buildUpdatePayload,
    normalizeTransmission, normalizeLanguageCodes, serializeLanguageCodes,
    formatLanguageLabels, PRIMARY_LANGUAGE_OPTIONS, OTHER_LANGUAGE_OPTIONS,
} from "./types";
import React from "react";

// ── SessionStorage cache for settings data (survives locale switches) ──
const PROFILE_CACHE_KEY = "settings-profile-v1";
const ASSETS_CACHE_KEY = "settings-assets-v1";
const SETTINGS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCached<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { data: T; timestamp: number };
        if (!parsed.timestamp || Date.now() - parsed.timestamp > SETTINGS_CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch {
        sessionStorage.removeItem(key);
        return null;
    }
}

function setCache<T>(key: string, data: T) {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* storage full — ignore */ }
}

function clearSettingsCache() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
    sessionStorage.removeItem(ASSETS_CACHE_KEY);
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}
const InputField = ({ label, ...props }: InputFieldProps) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input
            className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            {...props}
        />
    </div>
);

type ClerkUser = ReturnType<typeof useUser>["user"];

export function ProfileSettings({ user, isInstructor }: { user: ClerkUser; isInstructor: boolean }) {
    const { getToken } = useClerkAuth();
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAssetLoading, setIsAssetLoading] = useState(false);
    const [isAssetUploading, setIsAssetUploading] = useState(false);
    const [instructorPost, setInstructorPost] = useState<InstructorPost | null>(null);
    const [formData, setFormData] = useState<InstructorProfileForm>(emptyInstructorForm);
    const [vehiclePhotos, setVehiclePhotos] = useState<InstructorAsset[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showOtherLanguages, setShowOtherLanguages] = useState(false);

    const isEditable = Boolean(instructorPost?.is_approved);
    const showNotInstructorMessage = !isLoading && (!instructorPost || !instructorPost.is_approved);
    const transmission = normalizeTransmission(instructorPost?.transmission);
    const showAutomaticPrices = !transmission || transmission === "automatic" || transmission === "auto";
    const showManualPrices = !transmission || transmission === "manual";

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!user) return;
            // Check sessionStorage cache first
            const cached = getCached<InstructorPost>(PROFILE_CACHE_KEY);
            if (cached) {
                if (isMounted) { setInstructorPost(cached); setFormData(mapPostToForm(cached)); setIsLoading(false); }
                return;
            }
            setIsLoading(true);
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.status === 404) { if (isMounted) { setInstructorPost(null); setFormData(emptyInstructorForm); } return; }
                if (!res.ok) throw new Error("Failed to load instructor profile");
                const data: InstructorPost = await res.json();
                setCache(PROFILE_CACHE_KEY, data);
                if (isMounted) { setInstructorPost(data); setFormData(mapPostToForm(data)); }
            } catch { if (isMounted) { setInstructorPost(null); setFormData(emptyInstructorForm); } }
            finally { if (isMounted) setIsLoading(false); }
        };
        load();
        return () => { isMounted = false; };
    }, [getToken, user]);

    useEffect(() => {
        let isMounted = true;
        const loadAssets = async () => {
            if (!user || !instructorPost) return;
            // Check sessionStorage cache first
            const cached = getCached<InstructorAsset[]>(ASSETS_CACHE_KEY);
            if (cached) {
                if (isMounted) { setVehiclePhotos(cached); setIsAssetLoading(false); }
                return;
            }
            setIsAssetLoading(true);
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets?asset_type=vehicle_photos`, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error("Failed to load assets");
                const data: InstructorAsset[] = await res.json();
                setCache(ASSETS_CACHE_KEY, data);
                if (isMounted) setVehiclePhotos(data);
            } catch { if (isMounted) setVehiclePhotos([]); }
            finally { if (isMounted) setIsAssetLoading(false); }
        };
        loadAssets();
        return () => { isMounted = false; };
    }, [getToken, instructorPost, user]);

    const handleTextChange = (field: keyof InstructorProfileForm) => (value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleNumericChange = (field: keyof InstructorProfileForm) => (value: string) => {
        if (value === "" || /^\d+(\.\d+)?$/.test(value)) setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleLanguageToggle = (code: string) => {
        const current = normalizeLanguageCodes(formData.language_skills);
        const next = current.includes(code) ? current.filter((i) => i !== code) : [...current, code];
        setFormData((prev) => ({ ...prev, language_skills: serializeLanguageCodes(next) }));
    };

    const handleSave = async () => {
        if (!instructorPost || !isEditable) return;
        setIsSaving(true);
        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${instructorPost.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(buildUpdatePayload(formData)),
            });
            if (!res.ok) throw new Error("Failed to save");
            const updated: InstructorPost = await res.json();
            clearSettingsCache();
            setCache(PROFILE_CACHE_KEY, updated);
            setInstructorPost(updated);
            setFormData(mapPostToForm(updated));
            setSuccessMessage(t("settings.profile.profileUpdated"));
        } catch { /* silent */ } finally { setIsSaving(false); }
    };

    const handleDiscard = () => {
        if (!instructorPost) return;
        setFormData(mapPostToForm(instructorPost));
        setSuccessMessage(null);
    };

    const MAX_VEHICLE_PHOTOS = UPLOAD_LIMITS.MAX_VEHICLE_PHOTOS;
    const MAX_FILE_SIZE_BYTES = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES;
    const isAtPhotoLimit = vehiclePhotos.length >= MAX_VEHICLE_PHOTOS;

    const handleUploadVehiclePhotos = async (files: FileList | null) => {
        if (!files || !isEditable) return;
        const remaining = MAX_VEHICLE_PHOTOS - vehiclePhotos.length;
        if (remaining <= 0) {
            setSuccessMessage(null);
            return;
        }
        const validFiles = Array.from(files)
            .filter((f) => f.size <= MAX_FILE_SIZE_BYTES)
            .slice(0, remaining);
        if (validFiles.length === 0) return;
        setIsAssetUploading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = new FormData();
            data.append("asset_type", "vehicle_photos");
            validFiles.forEach((f) => data.append("files", f));
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
            if (!res.ok) throw new Error("Upload failed");
            const uploaded: InstructorAsset[] = await res.json();
            setVehiclePhotos((prev) => {
                const next = [...uploaded, ...prev];
                setCache(ASSETS_CACHE_KEY, next);
                return next;
            });
            setSuccessMessage(t("settings.profile.photosUpdated"));
        } catch { /* silent */ } finally {
            setIsAssetUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveVehiclePhoto = async (assetId: string) => {
        if (!isEditable) return;
        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets/${assetId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Remove failed");
            setVehiclePhotos((prev) => {
                const next = prev.filter((a) => a.id !== assetId);
                setCache(ASSETS_CACHE_KEY, next);
                return next;
            });
            setSuccessMessage(t("settings.profile.photoRemoved"));
        } catch { /* silent */ }
    };

    return (
        <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative group cursor-pointer flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-white shadow-sm overflow-hidden">
                        {user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : user?.firstName?.[0] || (isInstructor ? "I" : "U")}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="text-center sm:text-left">
                    <h3 className="font-bold text-lg text-gray-900">{t("settings.profile.photoTitle")}</h3>
                    <p className="text-sm text-gray-500 mb-3">{t("settings.profile.photoDesc")}</p>
                    <Button size="sm" variant="outline">{t("settings.profile.updateInAccount")}</Button>
                </div>
            </div>

            {/* Availability */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{t("settings.profile.availability")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("settings.profile.availabilityDesc")}</p>
                <Button asChild><Link href="/dashboard/schedule">{t("settings.profile.openCalendar")}</Link></Button>
            </div>

            {/* Personal Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-6">{t("settings.profile.personalInfo")}</h3>
                {showNotInstructorMessage && <p className="text-sm text-gray-500 mb-6">{t("settings.profile.notInstructor")}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label={t("settings.profile.title")} value={formData.title} onChange={(e) => handleTextChange("title")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.locatedAt")} value={formData.located_at} onChange={(e) => handleTextChange("located_at")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.googleMapsUrl")} value={formData.google_maps_url} onChange={(e) => handleTextChange("google_maps_url")(e.target.value)} disabled={!isEditable} />
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("settings.profile.languageSkills")}</label>
                        <div className="flex flex-wrap gap-2">
                            {PRIMARY_LANGUAGE_OPTIONS.map((opt) => {
                                const selected = normalizeLanguageCodes(formData.language_skills).includes(opt.code);
                                return (
                                    <button key={opt.code} type="button" onClick={() => handleLanguageToggle(opt.code)} disabled={!isEditable}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${selected ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5" : "border-gray-200 text-gray-700 bg-white"} disabled:opacity-60 disabled:cursor-not-allowed`}>
                                        {opt.label}
                                    </button>
                                );
                            })}
                            <button type="button" onClick={() => setShowOtherLanguages((p) => !p)} disabled={!isEditable}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${showOtherLanguages ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5" : "border-gray-200 text-gray-700 bg-white"} disabled:opacity-60 disabled:cursor-not-allowed`}>
                                {t("settings.profile.other")}
                            </button>
                        </div>
                        {showOtherLanguages && (
                            <div className="flex flex-wrap gap-2">
                                {OTHER_LANGUAGE_OPTIONS.map((opt) => {
                                    const selected = normalizeLanguageCodes(formData.language_skills).includes(opt.code);
                                    return (
                                        <button key={opt.code} type="button" onClick={() => handleLanguageToggle(opt.code)} disabled={!isEditable}
                                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${selected ? "border-[#F03D3D] text-[#F03D3D] bg-[#F03D3D]/5" : "border-gray-200 text-gray-700 bg-white"} disabled:opacity-60 disabled:cursor-not-allowed`}>
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-xs text-gray-500">{t("settings.profile.selected")}: {formatLanguageLabels(formData.language_skills) || t("settings.profile.none")}</p>
                    </div>
                    {showAutomaticPrices && (<>
                        <InputField label={t("settings.profile.automaticCityPrice")} value={formData.automatic_city_price} onChange={(e) => handleNumericChange("automatic_city_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                        <InputField label={t("settings.profile.automaticYardPrice")} value={formData.automatic_yard_price} onChange={(e) => handleNumericChange("automatic_yard_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                    </>)}
                    {showManualPrices && (<>
                        <InputField label={t("settings.profile.manualCityPrice")} value={formData.manual_city_price} onChange={(e) => handleNumericChange("manual_city_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                        <InputField label={t("settings.profile.manualYardPrice")} value={formData.manual_yard_price} onChange={(e) => handleNumericChange("manual_yard_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                    </>)}
                    <InputField label={t("settings.profile.firstName")} value={formData.applicant_first_name} onChange={(e) => handleTextChange("applicant_first_name")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.lastName")} value={formData.applicant_last_name} onChange={(e) => handleTextChange("applicant_last_name")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.contactEmail")} type="email" value={formData.contact_email} onChange={(e) => handleTextChange("contact_email")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.phone")} type="tel" value={formData.phone} onChange={(e) => handleTextChange("phone")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.city")} value={formData.applicant_city} onChange={(e) => handleTextChange("applicant_city")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.dateOfBirth")} type="date" value={formData.applicant_date_of_birth} onChange={(e) => handleTextChange("applicant_date_of_birth")(e.target.value)} disabled={!isEditable} />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.profile.description")}</label>
                        <textarea className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                            value={formData.description} onChange={(e) => handleTextChange("description")(e.target.value)} disabled={!isEditable} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.profile.address")}</label>
                        <textarea className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                            value={formData.applicant_address} onChange={(e) => handleTextChange("applicant_address")(e.target.value)} disabled={!isEditable} />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">{t("settings.profile.emailSecurityNote")}</p>
                {successMessage && <p className="text-sm text-green-700 font-semibold mt-4">{successMessage}</p>}
                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="outline" disabled={!isEditable || isSaving} onClick={handleDiscard}>{t("settings.profile.discardChanges")}</Button>
                    <Button disabled={!isEditable || isSaving} onClick={handleSave}>{t("settings.profile.saveChanges")}</Button>
                </div>
            </div>

            {/* Vehicle Photos */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-gray-900">{t("settings.profile.vehiclePhotos")} <span className="text-sm font-normal text-gray-500">({vehiclePhotos.length}/{MAX_VEHICLE_PHOTOS})</span></h3>
                    <div className="flex items-center gap-2">
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleUploadVehiclePhotos(e.target.files)} disabled={!isEditable || isAtPhotoLimit} />
                        <Button size="sm" variant="outline" disabled={!isEditable || isAssetUploading || isAtPhotoLimit} onClick={() => fileInputRef.current?.click()}>{isAtPhotoLimit ? t("settings.profile.limitReached") : t("settings.profile.uploadPhotos")}</Button>
                    </div>
                </div>
                {showNotInstructorMessage && <p className="text-sm text-gray-500 mb-6">{t("settings.profile.notInstructor")}</p>}
                {isAssetLoading ? (
                    <p className="text-sm text-gray-500">{t("settings.profile.loadingPhotos")}</p>
                ) : vehiclePhotos.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("settings.profile.noPhotos")}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehiclePhotos.map((photo) => (
                            <div key={photo.id} className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                <img src={photo.url} alt={photo.original_filename || "Vehicle photo"} className="w-full h-40 object-cover" />
                                <div className="absolute top-2 right-2">
                                    <button type="button" onClick={() => handleRemoveVehiclePhoto(photo.id)} disabled={!isEditable}
                                        className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed" aria-label="Remove vehicle photo">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
