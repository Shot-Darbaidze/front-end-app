"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { UPLOAD_LIMITS } from "@/config/constants";
import { Camera, Trash2, Expand, CheckCircle, FileText } from "lucide-react";
import { API_CONFIG } from "@/config/constants";
import ImageLightbox from "@/components/ui/ImageLightbox";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { validateGeorgianPhone } from "@/utils/validation/georgianPhone";
import InstructorPackagesSection from "./InstructorPackagesSection";
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
const LICENSE_CACHE_KEY = "settings-license-v1";
const CERT_CACHE_KEY = "settings-cert-v1";
const SETTINGS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function scopedKey(baseKey: string, userId: string) {
    return `${baseKey}:${userId}`;
}

function getCached<T>(key: string, userId: string | null | undefined): T | null {
    if (typeof window === "undefined") return null;
    if (!userId) return null;
    const cacheKey = scopedKey(key, userId);
    try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { data: T; timestamp: number };
        if (!parsed.timestamp || Date.now() - parsed.timestamp > SETTINGS_CACHE_TTL) {
            sessionStorage.removeItem(cacheKey);
            return null;
        }
        return parsed.data;
    } catch {
        sessionStorage.removeItem(cacheKey);
        return null;
    }
}

function setCache<T>(key: string, userId: string | null | undefined, data: T) {
    if (typeof window === "undefined") return;
    if (!userId) return;
    const cacheKey = scopedKey(key, userId);
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* storage full — ignore */ }
}

function clearSettingsCache(userId: string | null | undefined) {
    if (typeof window === "undefined") return;
    if (!userId) return;
    sessionStorage.removeItem(scopedKey(PROFILE_CACHE_KEY, userId));
    sessionStorage.removeItem(scopedKey(ASSETS_CACHE_KEY, userId));
    sessionStorage.removeItem(scopedKey(LICENSE_CACHE_KEY, userId));
    sessionStorage.removeItem(scopedKey(CERT_CACHE_KEY, userId));
}

async function extractApiErrorMessage(res: Response, fallback: string): Promise<string> {
    let raw = "";
    try {
        raw = await res.text();
    } catch {
        return fallback;
    }

    const trimmed = raw.trim();
    if (!trimmed) return fallback;

    try {
        const payload = JSON.parse(trimmed);
        if (typeof payload?.detail === "string" && payload.detail.trim()) {
            return payload.detail;
        }
        if (typeof payload?.error === "string" && payload.error.trim()) {
            return payload.error;
        }
        if (Array.isArray(payload?.detail)) {
            const first = payload.detail[0];
            if (typeof first === "string" && first.trim()) return first;
            if (typeof first?.msg === "string" && first.msg.trim()) return first.msg;
        }
        if (typeof payload?.message === "string" && payload.message.trim()) {
            return payload.message;
        }
    } catch {
        // Non-JSON response; return raw text body.
        return trimmed;
    }

    return trimmed || fallback;
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

function StudentProfileSettings({ user, getToken }: { user: ClerkUser; getToken: () => Promise<string | null> }) {
    const { t } = useLanguage();
    const [phone, setPhone] = useState<string>("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadPhone = async () => {
            if (!user) return;
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/me/phone`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });
                if (!res.ok) return;
                const data = await res.json();
                if (isMounted) {
                    setPhone((data.mobile_number as string) || "");
                }
            } catch {
                // silent
            }
        };
        loadPhone();
        return () => { isMounted = false; };
    }, [getToken, user]);

    const handlePhoneChange = (value: string) => {
        setPhone(value);
        setPhoneError(validateGeorgianPhone(value));
        setSuccessMessage(null);
    };

    const handleSave = async () => {
        if (!user) return;
        const err = validateGeorgianPhone(phone);
        if (err) { setPhoneError(err); return; }
        if (!phone.trim()) {
            setPhoneError(t("booking.phoneRequired") || "Phone number is required");
            return;
        }
        setIsSaving(true);
        setSuccessMessage(null);
        try {
            const token = await getToken();
            if (!token) {
                setPhoneError("Not authenticated");
                return;
            }

            const digits = phone.replace(/\D/g, "");
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/me/phone`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mobile_number: digits, confirmed: true }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ detail: "Failed to update phone" }));
                throw new Error(data.detail || "Failed to update phone");
            }

            const updated = await res.json();
            setPhone((updated.mobile_number as string) || digits);
            setSuccessMessage(t("settings.profile.profileUpdated"));
        } catch (e) {
            setPhoneError(e instanceof Error ? e.message : "Failed to update phone");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-white shadow-sm overflow-hidden">
                        {user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : user?.firstName?.[0] || "U"}
                    </div>
                </div>
                <div className="text-center sm:text-left">
                    <h3 className="font-bold text-lg text-gray-900">{t("settings.profile.photoTitle")}</h3>
                    <p className="text-sm text-gray-500 mb-3">{t("settings.profile.photoDesc")}</p>
                    <Button size="sm" variant="outline">{t("settings.profile.updateInAccount")}</Button>
                </div>
            </div>

            {/* Personal info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-6">{t("settings.profile.personalInfo")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label={t("settings.profile.firstName")} value={user?.firstName || ""} disabled />
                    <InputField label={t("settings.profile.lastName")} value={user?.lastName || ""} disabled />
                    <InputField label={t("settings.profile.contactEmail")} type="email" value={user?.primaryEmailAddress?.emailAddress || ""} disabled />
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">{t("settings.profile.phone")}</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="555 123 456"
                            className={`w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 rounded-xl transition-all outline-none text-sm ${
                                phoneError
                                    ? "ring-2 ring-red-300 border-red-400 bg-red-50 focus:ring-red-300"
                                    : "focus:ring-[#F03D3D]/20 focus:border-[#F03D3D]"
                            }`}
                        />
                        {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">{t("settings.profile.emailSecurityNote")}</p>
                {successMessage && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-green-800">{successMessage}</p>
                    </div>
                )}
                <div className="mt-6 flex justify-end">
                    <Button disabled={isSaving} onClick={handleSave}>{t("settings.profile.saveChanges")}</Button>
                </div>
            </div>
        </div>
    );
}

export function ProfileSettings({ user, isInstructor }: { user: ClerkUser; isInstructor: boolean }) {
    const { getToken } = useClerkAuth();
    const { t, language } = useLanguage();
    const localeHref = useLocaleHref();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const licenseInputRef = useRef<HTMLInputElement | null>(null);
    const certInputRef = useRef<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isStatusSaving, setIsStatusSaving] = useState(false);
    const [isAssetLoading, setIsAssetLoading] = useState(false);
    const [isAssetUploading, setIsAssetUploading] = useState(false);
    const [instructorPost, setInstructorPost] = useState<InstructorPost | null>(null);
    const [formData, setFormData] = useState<InstructorProfileForm>(emptyInstructorForm);
    const [vehiclePhotos, setVehiclePhotos] = useState<InstructorAsset[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [assetError, setAssetError] = useState<string | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [licenseAssets, setLicenseAssets] = useState<InstructorAsset[]>([]);
    const [certAssets, setCertAssets] = useState<InstructorAsset[]>([]);
    const [isLicenseLoading, setIsLicenseLoading] = useState(false);
    const [isCertLoading, setIsCertLoading] = useState(false);
    const [isLicenseUploading, setIsLicenseUploading] = useState(false);
    const [isCertUploading, setIsCertUploading] = useState(false);
    const [showOtherLanguages, setShowOtherLanguages] = useState(false);

    const cacheUserId = user?.id ?? null;

    const isEditable = Boolean(instructorPost?.is_approved);
    const showNotInstructorMessage = !isLoading && (!instructorPost || !instructorPost.is_approved);
    const transmission = normalizeTransmission(instructorPost?.transmission);
    const showAutomaticPrices = !transmission || transmission === "automatic" || transmission === "auto";
    const showManualPrices = !transmission || transmission === "manual";
    const isSearchVisible = formData.status === "active";

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!user) return;
            // Check sessionStorage cache first
            const cached = getCached<InstructorPost>(PROFILE_CACHE_KEY, cacheUserId);
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
                setCache(PROFILE_CACHE_KEY, cacheUserId, data);
                if (isMounted) { setInstructorPost(data); setFormData(mapPostToForm(data)); }
            } catch { if (isMounted) { setInstructorPost(null); setFormData(emptyInstructorForm); } }
            finally { if (isMounted) setIsLoading(false); }
        };
        load();
        return () => { isMounted = false; };
    }, [getToken, user, cacheUserId]);

    useEffect(() => {
        let isMounted = true;
        const loadAssets = async () => {
            if (!user || !instructorPost) return;
            // Check sessionStorage cache first
            const cached = getCached<InstructorAsset[]>(ASSETS_CACHE_KEY, cacheUserId);
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
                setCache(ASSETS_CACHE_KEY, cacheUserId, data);
                if (isMounted) setVehiclePhotos(data);
            } catch { if (isMounted) setVehiclePhotos([]); }
            finally { if (isMounted) setIsAssetLoading(false); }
        };
        loadAssets();
        return () => { isMounted = false; };
    }, [getToken, instructorPost, user, cacheUserId]);

    useEffect(() => {
        let isMounted = true;
        const loadDocAssets = async () => {
            if (!user || !instructorPost) return;
            const cachedLicense = getCached<InstructorAsset[]>(LICENSE_CACHE_KEY, cacheUserId);
            const cachedCert = getCached<InstructorAsset[]>(CERT_CACHE_KEY, cacheUserId);
            if (cachedLicense && isMounted) setLicenseAssets(cachedLicense);
            if (cachedCert && isMounted) setCertAssets(cachedCert);
            if (cachedLicense && cachedCert) return;
            try {
                const token = await getToken();
                if (!token) return;
                if (!cachedLicense) {
                    if (isMounted) setIsLicenseLoading(true);
                    const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets?asset_type=instructor_license`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) { const data: InstructorAsset[] = await res.json(); setCache(LICENSE_CACHE_KEY, cacheUserId, data); if (isMounted) setLicenseAssets(data); }
                    if (isMounted) setIsLicenseLoading(false);
                }
                if (!cachedCert) {
                    if (isMounted) setIsCertLoading(true);
                    const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets?asset_type=professional_certificate`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) { const data: InstructorAsset[] = await res.json(); setCache(CERT_CACHE_KEY, cacheUserId, data); if (isMounted) setCertAssets(data); }
                    if (isMounted) setIsCertLoading(false);
                }
            } catch { /* silent */ }
        };
        loadDocAssets();
        return () => { isMounted = false; };
    }, [getToken, instructorPost, user, cacheUserId]);

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
        setFormError(null);
        setSuccessMessage(null);
        try {
            const token = await getToken();
            if (!token) {
                setFormError(language === "ka" ? "ავტორიზაცია ვერ დადასტურდა." : "Authentication failed.");
                return;
            }
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${instructorPost.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(buildUpdatePayload(formData)),
            });
            if (!res.ok) {
                const message = await extractApiErrorMessage(
                    res,
                    language === "ka" ? "შენახვა ვერ მოხერხდა." : "Failed to save."
                );
                throw new Error(message);
            }
            const updated: InstructorPost = await res.json();
            clearSettingsCache(cacheUserId);
            setCache(PROFILE_CACHE_KEY, cacheUserId, updated);
            setInstructorPost(updated);
            setFormData(mapPostToForm(updated));
            setSuccessMessage(language === "ka" ? "ცვლილებები წარმატებით შეინახა." : "Changes saved successfully.");
        } catch (error) {
            setFormError(error instanceof Error ? error.message : (language === "ka" ? "შენახვა ვერ მოხერხდა." : "Failed to save changes."));
        } finally { setIsSaving(false); }
    };

    const handleStatusToggle = async () => {
        if (!instructorPost || !isEditable || isStatusSaving) return;

        const nextStatus: InstructorProfileForm["status"] = formData.status === "active" ? "inactive" : "active";
        const prevStatus: InstructorProfileForm["status"] = formData.status;

        setFormData((prev) => ({ ...prev, status: nextStatus }));
        setIsStatusSaving(true);
        setStatusError(null);
        setFormError(null);
        setSuccessMessage(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error(language === "ka" ? "ავტორიზაცია ვერ დადასტურდა." : "Authentication failed.");
            }

            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${instructorPost.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: nextStatus }),
            });

            if (!res.ok) {
                const message = await extractApiErrorMessage(
                    res,
                    language === "ka" ? "სტატუსის განახლება ვერ მოხერხდა." : "Failed to update status."
                );
                throw new Error(message);
            }

            const updated: InstructorPost = await res.json();
            clearSettingsCache(cacheUserId);
            setCache(PROFILE_CACHE_KEY, cacheUserId, updated);
            setInstructorPost(updated);
            setFormData((prev) => ({ ...prev, status: mapPostToForm(updated).status }));
            setSuccessMessage(
                language === "ka"
                    ? "პროფილის აქტივაციის სტატუსი განახლდა."
                    : "Profile activation status updated."
            );
        } catch (error) {
            setFormData((prev) => ({ ...prev, status: prevStatus }));
            const message = error instanceof Error
                ? error.message
                : (language === "ka" ? "სტატუსის განახლება ვერ მოხერხდა." : "Failed to update status.");
            setStatusError(message);
            setFormError(message);
        } finally {
            setIsStatusSaving(false);
        }
    };

    const handleDiscard = () => {
        if (!instructorPost) return;
        setFormData(mapPostToForm(instructorPost));
        setSuccessMessage(null);
        setFormError(null);
    };

    const MAX_VEHICLE_PHOTOS = UPLOAD_LIMITS.MAX_VEHICLE_PHOTOS;
    const MAX_FILE_SIZE_BYTES = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES;
    const MAX_LICENSE_FILES = UPLOAD_LIMITS.MAX_LICENSE_FILES;
    const MAX_CERT_FILES = UPLOAD_LIMITS.MAX_CERTIFICATE_FILES;
    const isAtPhotoLimit = vehiclePhotos.length >= MAX_VEHICLE_PHOTOS;

    const placeholders = language === "ka"
        ? {
            title: "მაგ: Nova Drive აკადემია",
            locatedAt: "მაგ: თბილისი, ვაკე",
            mapsUrl: "https://maps.google.com/...",
            cityPrice: "მაგ: 45",
            yardPrice: "მაგ: 35",
            firstName: "მაგ: გიორგი",
            lastName: "მაგ: ბერიძე",
            phone: "555 123 456",
            city: "მაგ: თბილისი",
            description: "მოკლედ აღწერეთ სწავლების სტილი, გამოცდილება და რას მიიღებს მოსწავლე თქვენს გაკვეთილებზე.",
            address: "მაგ: ჭავჭავაძის გამზირი 12, თბილისი",
        }
        : {
            title: "e.g. Nova Drive Academy",
            locatedAt: "e.g. Tbilisi, Vake",
            mapsUrl: "https://maps.google.com/...",
            cityPrice: "e.g. 45",
            yardPrice: "e.g. 35",
            firstName: "e.g. Giorgi",
            lastName: "e.g. Beridze",
            phone: "555 123 456",
            city: "e.g. Tbilisi",
            description: "Briefly describe your teaching style, experience, and what students can expect from your lessons.",
            address: "e.g. Chavchavadze Ave. 12, Tbilisi",
        };

    const handleUploadVehiclePhotos = async (files: FileList | null) => {
        if (!files || !isEditable) return;
        setAssetError(null);
        const remaining = MAX_VEHICLE_PHOTOS - vehiclePhotos.length;
        if (remaining <= 0) {
            setSuccessMessage(null);
            setAssetError(`Maximum ${MAX_VEHICLE_PHOTOS} photos allowed.`);
            return;
        }
        const selectedFiles = Array.from(files);
        const oversizedFiles = selectedFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
        const sizeAcceptedFiles = selectedFiles.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);

        if (oversizedFiles.length > 0) {
            setAssetError(`Some files were skipped because they exceed ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB.`);
        }

        if (sizeAcceptedFiles.length > remaining) {
            setAssetError(`You can only upload ${remaining} more photo(s).`);
        }

        const validFiles = sizeAcceptedFiles.slice(0, remaining);
        if (validFiles.length === 0) return;
        setIsAssetUploading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = new FormData();
            data.append("asset_type", "vehicle_photos");
            validFiles.forEach((f) => data.append("files", f));
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({ detail: "Upload failed" }));
                throw new Error(payload.detail || "Upload failed");
            }
            const uploaded: InstructorAsset[] = await res.json();
            setVehiclePhotos((prev) => {
                const next = [...uploaded, ...prev];
                setCache(ASSETS_CACHE_KEY, cacheUserId, next);
                return next;
            });
            setSuccessMessage(t("settings.profile.photosUpdated"));
        } catch (error) {
            setAssetError(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setIsAssetUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveVehiclePhoto = async (assetId: string) => {
        if (!isEditable) return;
        setAssetError(null);
        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets/${assetId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Remove failed");
            setVehiclePhotos((prev) => {
                const next = prev.filter((a) => a.id !== assetId);
                setCache(ASSETS_CACHE_KEY, cacheUserId, next);
                return next;
            });
            setSuccessMessage(t("settings.profile.photoRemoved"));
        } catch (error) {
            setAssetError(error instanceof Error ? error.message : "Failed to remove photo");
        }
    };

    const handleUploadLicense = async (files: FileList | null) => {
        if (!files || !isEditable) return;
        setAssetError(null);
        const remaining = MAX_LICENSE_FILES - licenseAssets.length;
        if (remaining <= 0) { setAssetError(`Maximum ${MAX_LICENSE_FILES} license files allowed.`); return; }
        const selected = Array.from(files).slice(0, remaining);
        const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
        if (oversized.length > 0) { setAssetError(`Some files exceed ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB.`); return; }
        setIsLicenseUploading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const fd = new FormData();
            fd.append("asset_type", "instructor_license");
            selected.forEach((f) => fd.append("files", f));
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
            if (!res.ok) { const p = await res.json().catch(() => ({ detail: "Upload failed" })); throw new Error(p.detail || "Upload failed"); }
            const uploaded: InstructorAsset[] = await res.json();
            setLicenseAssets((prev) => { const next = [...uploaded, ...prev]; setCache(LICENSE_CACHE_KEY, cacheUserId, next); return next; });
            setSuccessMessage("License file uploaded.");
        } catch (error) {
            setAssetError(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setIsLicenseUploading(false);
            if (licenseInputRef.current) licenseInputRef.current.value = "";
        }
    };

    const handleRemoveLicense = async (assetId: string) => {
        if (!isEditable) return;
        setAssetError(null);
        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets/${assetId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Remove failed");
            setLicenseAssets((prev) => { const next = prev.filter((a) => a.id !== assetId); setCache(LICENSE_CACHE_KEY, cacheUserId, next); return next; });
            setSuccessMessage("License file removed.");
        } catch (error) {
            setAssetError(error instanceof Error ? error.message : "Failed to remove file");
        }
    };

    const handleUploadCert = async (files: FileList | null) => {
        if (!files || !isEditable) return;
        setAssetError(null);
        if (certAssets.length >= MAX_CERT_FILES) { setAssetError(`Maximum ${MAX_CERT_FILES} certificate file allowed.`); return; }
        const file = files[0];
        if (file.size > MAX_FILE_SIZE_BYTES) { setAssetError(`File exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB.`); return; }
        setIsCertUploading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const fd = new FormData();
            fd.append("asset_type", "professional_certificate");
            fd.append("files", file);
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
            if (!res.ok) { const p = await res.json().catch(() => ({ detail: "Upload failed" })); throw new Error(p.detail || "Upload failed"); }
            const uploaded: InstructorAsset[] = await res.json();
            setCertAssets((prev) => { const next = [...uploaded, ...prev]; setCache(CERT_CACHE_KEY, cacheUserId, next); return next; });
            setSuccessMessage("Certificate uploaded.");
        } catch (error) {
            setAssetError(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setIsCertUploading(false);
            if (certInputRef.current) certInputRef.current.value = "";
        }
    };

    const handleRemoveCert = async (assetId: string) => {
        if (!isEditable) return;
        setAssetError(null);
        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine/assets/${assetId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Remove failed");
            setCertAssets((prev) => { const next = prev.filter((a) => a.id !== assetId); setCache(CERT_CACHE_KEY, cacheUserId, next); return next; });
            setSuccessMessage("Certificate removed.");
        } catch (error) {
            setAssetError(error instanceof Error ? error.message : "Failed to remove file");
        }
    };

    // ── Student view ──────────────────────────────────────────────────────────
    if (!isInstructor) {
        return <StudentProfileSettings user={user} getToken={getToken} />;
    }

    // ── Instructor view ───────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative group cursor-pointer flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-white shadow-sm overflow-hidden">
                        {user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : user?.firstName?.[0] || "I"}
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

            <div className="rounded-2xl border border-[#F03D3D]/10 bg-gradient-to-r from-[#fff7f7] to-[#fff] p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-900">{language === "ka" ? "პროფილის ხარისხი" : "Profile quality"}</p>
                <p className="text-sm text-gray-600 mt-1">
                    {language === "ka"
                        ? "გამოიყენეთ მკაფიო სათაური (მაგ: ავტოსკოლის სახელი), განაახლეთ ფასები და ატვირთეთ მაღალი ხარისხის ავტომობილის ფოტოები."
                        : "Use a clear title (for example your autoschool name), keep pricing updated, and upload high-quality vehicle photos."}
                </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{language === "ka" ? "პროფილის აქტივაცია" : "Profile Activation"}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {language === "ka"
                                ? "ჩართეთ, რომ თქვენი პროფილი გამოჩნდეს ინსტრუქტორების ძიებაში."
                                : "Turn this on to make your profile visible in instructor search."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleStatusToggle}
                        disabled={!isEditable || isStatusSaving}
                        className={`inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            isSearchVisible
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                        aria-pressed={isSearchVisible}
                    >
                        <span
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isSearchVisible ? "bg-green-500" : "bg-gray-400"
                            }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                    isSearchVisible ? "translate-x-5" : "translate-x-1"
                                }`}
                            />
                        </span>
                        <span>
                            {isStatusSaving
                                ? (language === "ka" ? "ინახება..." : "Saving...")
                                : (isSearchVisible ? (language === "ka" ? "აქტიურია" : "Active") : (language === "ka" ? "არააქტიური" : "Inactive"))}
                        </span>
                    </button>
                </div>
                    {statusError && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-sm font-semibold text-red-700">
                                {language === "ka" ? "პროფილი ვერ გაითიშა" : "Could not deactivate profile"}
                            </p>
                            <p className="text-sm text-red-700/90 mt-0.5">{statusError}</p>
                        </div>
                    )}
            </div>

            {/* Availability */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{t("settings.profile.availability")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("settings.profile.availabilityDesc")}</p>
                <Button asChild><Link href={localeHref("/dashboard/schedule")}>{t("settings.profile.openCalendar")}</Link></Button>
            </div>

            {instructorPost && <InstructorPackagesSection post={instructorPost} />}

            {/* Personal Info */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900">{t("settings.profile.personalInfo")}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">{language === "ka" ? "პროფილის ინფორმაცია გამოჩნდება ინსტრუქტორის გვერდზე." : "These details are displayed on your instructor profile."}</p>
                {showNotInstructorMessage && <p className="text-sm text-gray-500 mb-6">{t("settings.profile.notInstructor")}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <InputField label={t("settings.profile.title")} placeholder={placeholders.title} value={formData.title} onChange={(e) => handleTextChange("title")(e.target.value)} disabled={!isEditable} />
                        <p className="text-xs text-gray-500 mt-1">{language === "ka" ? "სათაურში სასურველია მიუთითოთ თქვენი ავტოსკოლის/ბრენდის სახელი." : "Tip: use your autoschool or brand name in the title."}</p>
                    </div>
                    <InputField label={t("settings.profile.locatedAt")} placeholder={placeholders.locatedAt} value={formData.located_at} onChange={(e) => handleTextChange("located_at")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.googleMapsUrl")} placeholder={placeholders.mapsUrl} value={formData.google_maps_url} onChange={(e) => handleTextChange("google_maps_url")(e.target.value)} disabled={!isEditable} />
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
                        <InputField label={t("settings.profile.automaticCityPrice")} placeholder={placeholders.cityPrice} value={formData.automatic_city_price} onChange={(e) => handleNumericChange("automatic_city_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                        <InputField label={t("settings.profile.automaticYardPrice")} placeholder={placeholders.yardPrice} value={formData.automatic_yard_price} onChange={(e) => handleNumericChange("automatic_yard_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                    </>)}
                    {showManualPrices && (<>
                        <InputField label={t("settings.profile.manualCityPrice")} placeholder={placeholders.cityPrice} value={formData.manual_city_price} onChange={(e) => handleNumericChange("manual_city_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                        <InputField label={t("settings.profile.manualYardPrice")} placeholder={placeholders.yardPrice} value={formData.manual_yard_price} onChange={(e) => handleNumericChange("manual_yard_price")(e.target.value)} inputMode="decimal" disabled={!isEditable} />
                    </>)}
                    <InputField label={t("settings.profile.firstName")} placeholder={placeholders.firstName} value={formData.applicant_first_name} onChange={(e) => handleTextChange("applicant_first_name")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.lastName")} placeholder={placeholders.lastName} value={formData.applicant_last_name} onChange={(e) => handleTextChange("applicant_last_name")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.phone")} type="tel" placeholder={placeholders.phone} value={formData.phone} onChange={(e) => handleTextChange("phone")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.city")} placeholder={placeholders.city} value={formData.applicant_city} onChange={(e) => handleTextChange("applicant_city")(e.target.value)} disabled={!isEditable} />
                    <InputField label={t("settings.profile.dateOfBirth")} type="date" value={formData.applicant_date_of_birth} onChange={(e) => handleTextChange("applicant_date_of_birth")(e.target.value)} disabled={!isEditable} />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.profile.description")}</label>
                        <AutoResizeTextarea
                            className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder={placeholders.description}
                            value={formData.description} onChange={(e) => handleTextChange("description")(e.target.value)} disabled={!isEditable} />
                        <p className="text-xs text-gray-400 mt-1">*bold* · _italic_ · ~strikethrough~ · Enter for new line</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("settings.profile.address")}</label>
                        <textarea className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#F03D3D]/20 focus:border-[#F03D3D] rounded-xl transition-all outline-none text-sm min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder={placeholders.address}
                            value={formData.applicant_address} onChange={(e) => handleTextChange("applicant_address")(e.target.value)} disabled={!isEditable} />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">{t("settings.profile.emailSecurityNote")}</p>
                {successMessage && (
                    <div className="mt-4 p-4 bg-green-50 ring-1 ring-green-500/20 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 bg-green-100 rounded-full shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-green-900">{successMessage}</p>
                    </div>
                )}
                {formError && (
                    <div className="mt-4 p-4 bg-red-50 ring-1 ring-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-sm font-medium text-red-900">{formError}</p>
                    </div>
                )}
                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="outline" disabled={!isEditable || isSaving} onClick={handleDiscard}>{t("settings.profile.discardChanges")}</Button>
                    <Button disabled={!isEditable || isSaving} onClick={handleSave}>{t("settings.profile.saveChanges")}</Button>
                </div>
            </div>

            {/* Vehicle Photos */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-gray-900">{t("settings.profile.vehiclePhotos")} <span className="text-sm font-normal text-gray-500">({vehiclePhotos.length}/{MAX_VEHICLE_PHOTOS})</span></h3>
                    <div className="flex items-center gap-2">
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleUploadVehiclePhotos(e.target.files)} disabled={!isEditable || isAtPhotoLimit} />
                        <Button size="sm" variant="outline" disabled={!isEditable || isAssetUploading || isAtPhotoLimit} onClick={() => fileInputRef.current?.click()}>{isAtPhotoLimit ? t("settings.profile.limitReached") : t("settings.profile.uploadPhotos")}</Button>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Max {MAX_VEHICLE_PHOTOS} photos, up to {UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB each.</p>
                {showNotInstructorMessage && <p className="text-sm text-gray-500 mb-6">{t("settings.profile.notInstructor")}</p>}
                {assetError && <p className="text-sm text-red-600 mb-4">{assetError}</p>}
                {isAssetLoading ? (
                    <p className="text-sm text-gray-500">{t("settings.profile.loadingPhotos")}</p>
                ) : vehiclePhotos.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("settings.profile.noPhotos")}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vehiclePhotos.map((photo, idx) => (
                                <div key={photo.id} className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
                                    <img
                                        src={photo.url}
                                        alt={photo.original_filename || "Vehicle photo"}
                                        className="w-full h-36 sm:h-44 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                        onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                                    />
                                    <div
                                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none"
                                    >
                                        <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                    </div>
                                    <div className="absolute top-2 right-2 z-10">
                                        <button type="button" onClick={() => handleRemoveVehiclePhoto(photo.id)} disabled={!isEditable}
                                            className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed" aria-label="Remove vehicle photo">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ImageLightbox
                            images={vehiclePhotos.map((p) => ({ src: p.url, alt: p.original_filename || "Vehicle photo" }))}
                            initialIndex={lightboxIndex}
                            open={lightboxOpen}
                            onClose={() => setLightboxOpen(false)}
                        />
                    </>
                )}
            </div>

            {/* Instructor License */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">
                        {language === "ka" ? "ინსტრუქტორის ლიცენზია" : "Instructor License"}
                        <span className="text-sm font-normal text-gray-500 ml-2">({licenseAssets.length}/{MAX_LICENSE_FILES})</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <input ref={licenseInputRef} type="file" multiple accept="image/*,.pdf" className="hidden"
                            onChange={(e) => handleUploadLicense(e.target.files)}
                            disabled={!isEditable || licenseAssets.length >= MAX_LICENSE_FILES} />
                        <Button size="sm" variant="outline"
                            disabled={!isEditable || isLicenseUploading || licenseAssets.length >= MAX_LICENSE_FILES}
                            onClick={() => licenseInputRef.current?.click()}>
                            {licenseAssets.length >= MAX_LICENSE_FILES
                                ? (language === "ka" ? "ლიმიტი" : "Limit reached")
                                : (language === "ka" ? "ატვირთვა" : "Upload")}
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Max {MAX_LICENSE_FILES} files, up to {UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB each. Images or PDF.</p>
                {showNotInstructorMessage && <p className="text-sm text-gray-500">{t("settings.profile.notInstructor")}</p>}
                {isLicenseLoading ? (
                    <p className="text-sm text-gray-500">{language === "ka" ? "იტვირთება..." : "Loading..."}</p>
                ) : licenseAssets.length === 0 ? (
                    <p className="text-sm text-gray-500">{language === "ka" ? "ლიცენზია არ არის ატვირთული." : "No license files uploaded."}</p>
                ) : (
                    <div className="space-y-2">
                        {licenseAssets.map((asset) => {
                            const isImage = asset.content_type?.startsWith("image/");
                            return (
                                <div key={asset.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    {isImage ? (
                                        <img src={asset.url} alt={asset.original_filename || "License"} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{asset.original_filename || "License file"}</p>
                                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                            {language === "ka" ? "ნახვა" : "View"}
                                        </a>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveLicense(asset.id)} disabled={!isEditable}
                                        className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        aria-label="Remove license file">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Professional Certificate */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">
                        {language === "ka" ? "პროფესიული სერტიფიკატი" : "Professional Certificate"}
                        <span className="text-sm font-normal text-gray-500 ml-2">({certAssets.length}/{MAX_CERT_FILES})</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <input ref={certInputRef} type="file" accept="image/*,.pdf" className="hidden"
                            onChange={(e) => handleUploadCert(e.target.files)}
                            disabled={!isEditable || certAssets.length >= MAX_CERT_FILES} />
                        <Button size="sm" variant="outline"
                            disabled={!isEditable || isCertUploading || certAssets.length >= MAX_CERT_FILES}
                            onClick={() => certInputRef.current?.click()}>
                            {certAssets.length >= MAX_CERT_FILES
                                ? (language === "ka" ? "ლიმიტი" : "Limit reached")
                                : (language === "ka" ? "ატვირთვა" : "Upload")}
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Max {MAX_CERT_FILES} file, up to {UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB. Image or PDF.</p>
                {showNotInstructorMessage && <p className="text-sm text-gray-500">{t("settings.profile.notInstructor")}</p>}
                {isCertLoading ? (
                    <p className="text-sm text-gray-500">{language === "ka" ? "იტვირთება..." : "Loading..."}</p>
                ) : certAssets.length === 0 ? (
                    <p className="text-sm text-gray-500">{language === "ka" ? "სერტიფიკატი არ არის ატვირთული." : "No certificate uploaded."}</p>
                ) : (
                    <div className="space-y-2">
                        {certAssets.map((asset) => {
                            const isImage = asset.content_type?.startsWith("image/");
                            return (
                                <div key={asset.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    {isImage ? (
                                        <img src={asset.url} alt={asset.original_filename || "Certificate"} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{asset.original_filename || "Certificate file"}</p>
                                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                            {language === "ka" ? "ნახვა" : "View"}
                                        </a>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveCert(asset.id)} disabled={!isEditable}
                                        className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        aria-label="Remove certificate">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
