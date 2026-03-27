"use client";

import React from "react";
import { useMultiStepForm } from "@/hooks";
import ModernStepIndicator from "@/components/for-instructors/signup/ModernStepIndicator";
import ModernStep1 from "@/components/for-instructors/signup/ModernStep1";
import ModernStep2 from "@/components/for-instructors/signup/ModernStep2";
import ModernStep3 from "@/components/for-instructors/signup/ModernStep3";
import ModernStep4 from "@/components/for-instructors/signup/ModernStep4";
import ModernSuccess from "@/components/for-instructors/signup/ModernSuccess";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { UPLOAD_LIMITS } from "@/config/constants";
import { useLocaleHref } from "@/hooks/useLocaleHref";

// File upload limits (from .env via constants)
const MAX_VEHICLE_PHOTOS = UPLOAD_LIMITS.MAX_VEHICLE_PHOTOS;
const MAX_LICENSE_FILES = UPLOAD_LIMITS.MAX_LICENSE_FILES;
const MAX_CERTIFICATE_FILES = UPLOAD_LIMITS.MAX_CERTIFICATE_FILES;
const MAX_FILE_SIZE_MB = UPLOAD_LIMITS.MAX_FILE_SIZE_MB;
const MAX_FILE_SIZE_BYTES = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES;

// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SignupPage = () => {
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const localeHref = useLocaleHref();
  const [inviteId, setInviteId] = useState("");
  const { t } = useLanguage();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "degraded">("checking");
  const [apiStatusMessage, setApiStatusMessage] = useState("Checking backend connection...");
  
  const initialFormData = {
    firstName: "",
    lastName: "",
    city: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    vehicleRegistration: "",
    vehicleBrand: "",
    vehicleYear: new Date().getFullYear(),
    transmission: "",
    vehiclePhotos: [] as File[],
    instructorLicense: [] as File[],
    professionalCertificate: null as File | null,
    backgroundCheckConsent: false,
    termsAccepted: false,
    privacyAccepted: false,
  };

  const { 
    currentStep, 
    handleNextStep, 
    handlePreviousStep, 
    handleFormDataChange,
    handleStepChange,
    formData,
    isFirstStep,
    isLastStep,
  } = useMultiStepForm(initialFormData, 4);

  const steps = [
    { number: 1, title: t("signup.step1") },
    { number: 2, title: t("signup.step2") },
    { number: 3, title: t("signup.step3") },
    { number: 4, title: t("signup.step4") },
  ];

  const statusStyles = {
    checking: "border-yellow-200 bg-yellow-50 text-yellow-800",
    connected: "border-green-200 bg-green-50 text-green-800",
    degraded: "border-red-200 bg-red-50 text-red-700",
  } as const;

  const statusTitles = {
    checking: t("signup.verifyingBackend"),
    connected: t("signup.backendConnected"),
    degraded: t("signup.backendUnreachable"),
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const inviteFromQuery = params.get("inviteId") || "";
    setInviteId(inviteFromQuery);

    if (inviteFromQuery && pathname?.endsWith("/for-instructors/signup")) {
      router.replace(`${localeHref("/for-instructors/invite-signup")}?inviteId=${encodeURIComponent(inviteFromQuery)}`);
    }
  }, [localeHref, pathname, router]);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      const healthEndpoints = [
        `${API_BASE_URL}/api/health`,
        `${API_BASE_URL}/health`,
      ];

      for (const url of healthEndpoints) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const payload = await response.json().catch(() => ({}));
            if (!cancelled) {
              setApiStatus("connected");
              setApiStatusMessage(payload.message || t("signup.apiReachable"));
            }
            return;
          }
        } catch (_error) {
          continue;
        }
      }

      if (!cancelled) {
        setApiStatus("degraded");
        setApiStatusMessage(t("signup.unableToReach"));
      }
    };

    checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDataUpdate = (newData: any) => {
    handleFormDataChange(newData);
    
    // Clear errors for fields that are being updated
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors };
      Object.keys(newData).forEach(key => {
        delete newErrors[key];
      });
      setErrors(newErrors);
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = t("signup.firstNameRequired");
      if (!formData.lastName) newErrors.lastName = t("signup.lastNameRequired");
      if (!formData.city) newErrors.city = t("signup.cityRequired");
      if (formData.dateOfBirth) {
        const year = parseInt(formData.dateOfBirth.split('-')[0]);
        if (year < 1950 || year > 2026) {
          newErrors.dateOfBirth = t("signup.dobRange");
        }
      }
      if (!formData.address) newErrors.address = t("signup.addressRequired");
      
      // Name validation (no numbers)
      const nameRegex = /^[a-zA-Z\u10A0-\u10FF\s]*$/;
      if (formData.firstName && !nameRegex.test(formData.firstName)) {
        newErrors.firstName = t("signup.nameLettersOnly");
      }
      if (formData.lastName && !nameRegex.test(formData.lastName)) {
        newErrors.lastName = t("signup.nameLettersOnly");
      }

      // Phone validation
      if (formData.phone) {
        const phoneRaw = formData.phone.replace(/\s/g, '');
        if (!/^\d+$/.test(phoneRaw)) {
          newErrors.phone = t("signup.phoneDigitsOnly");
        } else if (phoneRaw.length !== 9) {
          newErrors.phone = t("signup.phone9Digits");
        } else if (!phoneRaw.startsWith('5')) {
          newErrors.phone = t("signup.phoneStart5");
        }
      }
    }

    if (currentStep === 2) {
      if (!formData.vehicleBrand) newErrors.vehicleBrand = t("signup.vehicleBrandRequired");
      if (!formData.vehicleRegistration) newErrors.vehicleRegistration = t("signup.registrationRequired");
      if (!formData.vehicleYear) newErrors.vehicleYear = t("signup.yearRequired");
      if (!formData.transmission) newErrors.transmission = t("signup.transmissionRequired");
      
      // Registration Regex (XX-123-XX)
      const regRegex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
      if (formData.vehicleRegistration && !regRegex.test(formData.vehicleRegistration)) {
        newErrors.vehicleRegistration = t("signup.registrationFormat2");
      }

      // Photo Validation
      if (!formData.vehiclePhotos || formData.vehiclePhotos.length === 0) {
        newErrors.vehiclePhotos = t("signup.vehiclePhotoRequired");
      } else if (formData.vehiclePhotos.length > MAX_VEHICLE_PHOTOS) {
        newErrors.vehiclePhotos = t("signup.maxVehiclePhotos");
      }
    }

    if (currentStep === 3) {
      if (!formData.instructorLicense || formData.instructorLicense.length === 0) {
        newErrors.instructorLicense = t("signup.licenseRequired");
      } else if (formData.instructorLicense.length > MAX_LICENSE_FILES) {
        newErrors.instructorLicense = t("signup.maxLicenseFiles");
      }
    }

    if (currentStep === 4) {
      if (!formData.termsAccepted) newErrors.termsAccepted = t("signup.termsRequired");
      if (!formData.privacyAccepted) newErrors.privacyAccepted = t("signup.privacyRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    } else {
      setErrors({});
    }

    return isValid;
  };

  const onNext = () => {
    if (validateStep()) {
      handleNextStep();
    }
  };

  const onSubmit = async () => {
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Log all form data to console for debugging
    console.log("========================================");
    console.log("[INSTRUCTOR SIGNUP] Form Submission Data");
    console.log("========================================");
    console.log("[Personal Information]");
    console.log("  First Name:", formData.firstName);
    console.log("  Last Name:", formData.lastName);
    console.log("  Phone:", formData.phone);
    console.log("  City:", formData.city);
    console.log("  Address:", formData.address);
    console.log("  Date of Birth:", formData.dateOfBirth);
    console.log("[Vehicle Information]");
    console.log("  Vehicle Brand:", formData.vehicleBrand);
    console.log("  Vehicle Registration:", formData.vehicleRegistration);
    console.log("  Vehicle Year:", formData.vehicleYear);
    console.log("  Transmission:", formData.transmission);
    console.log("  Vehicle Photos:", formData.vehiclePhotos?.length || 0, "file(s)");
    if (formData.vehiclePhotos?.length > 0) {
      formData.vehiclePhotos.forEach((file: File, index: number) => {
        console.log(`    Photo ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      });
    }
    console.log("[Documents]");
    console.log("  Instructor License:", formData.instructorLicense?.length || 0, "file(s)");
    if (formData.instructorLicense?.length > 0) {
      formData.instructorLicense.forEach((file: File, index: number) => {
        console.log(`    License ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      });
    }
    console.log("  Professional Certificate:", formData.professionalCertificate ? formData.professionalCertificate.name : "Not provided");
    console.log("[Consents]");
    console.log("  Background Check Consent:", formData.backgroundCheckConsent);
    console.log("  Terms Accepted:", formData.termsAccepted);
    console.log("  Privacy Accepted:", formData.privacyAccepted);
    console.log("========================================");
    console.log("[FULL FORM DATA OBJECT]", formData);
    console.log("========================================");
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Please sign in again before submitting your application.");
      }

      const normalizedPhone = (formData.phone || "").replace(/\s/g, "").trim();

      // Enforce phone only at submit time.
      const profilePhoneResponse = await fetch(`${API_BASE_URL}/api/users/me/phone`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      let existingProfilePhone = "";
      if (profilePhoneResponse.ok) {
        const profilePayload = (await profilePhoneResponse.json()) as { mobile_number?: string | null };
        existingProfilePhone = (profilePayload.mobile_number || "").trim();
      }

      if (!existingProfilePhone && !normalizedPhone) {
        setShowPhonePrompt(true);
        setSubmitError(null);
        return;
      }

      const readErrorMessage = async (response: Response) => {
        const fallback = `Server error: ${response.status}`;

        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const payload = await response.json();
            const detail = payload?.detail;

            if (typeof detail === "string" && detail.trim()) {
              return detail;
            }

            if (Array.isArray(detail) && detail.length > 0) {
              const first = detail[0];
              if (typeof first === "string") return first;
              if (first && typeof first.msg === "string") return first.msg;
            }

            if (typeof payload?.message === "string" && payload.message.trim()) {
              return payload.message;
            }
          } else {
            const text = (await response.text()).trim();
            if (text) return text;
          }
        } catch {
          // Ignore parser errors and return fallback
        }

        return fallback;
      };

      // Phone now lives on user profile. Sync it before submitting the application.
      if (normalizedPhone) {
        const phoneRes = await fetch(`${API_BASE_URL}/api/users/me/phone`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            mobile_number: normalizedPhone,
            confirmed: true,
          }),
        });

        if (!phoneRes.ok) {
          const phoneError = await readErrorMessage(phoneRes);
          throw new Error(phoneError);
        }
      }

      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      
      // Personal Info
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("city", formData.city);
      submitData.append("address", formData.address);
      if (formData.dateOfBirth) {
        submitData.append("dateOfBirth", formData.dateOfBirth);
      }
      
      // Vehicle Info
      submitData.append("vehicleBrand", formData.vehicleBrand);
      submitData.append("vehicleRegistration", formData.vehicleRegistration);
      submitData.append("vehicleYear", formData.vehicleYear.toString());
      submitData.append("transmission", formData.transmission);

      if (inviteId) {
        submitData.append("inviteId", inviteId);
      }
      
      // Consents
      submitData.append("backgroundCheckConsent", formData.backgroundCheckConsent.toString());
      submitData.append("termsAccepted", formData.termsAccepted.toString());
      submitData.append("privacyAccepted", formData.privacyAccepted.toString());
      
      // Files - Vehicle Photos
      if (formData.vehiclePhotos && formData.vehiclePhotos.length > 0) {
        formData.vehiclePhotos.forEach((file: File) => {
          submitData.append("vehiclePhotos", file);
        });
      }
      
      // Files - Instructor License
      if (formData.instructorLicense && formData.instructorLicense.length > 0) {
        formData.instructorLicense.forEach((file: File) => {
          submitData.append("instructorLicense", file);
        });
      }
      
      // Files - Professional Certificate
      if (formData.professionalCertificate) {
        submitData.append("professionalCertificate", formData.professionalCertificate);
      }
      
      console.log("[API] Sending application to backend...");
      
      const response = await fetch(`${API_BASE_URL}/api/instructor/apply`, {
        method: "POST",
        body: submitData,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorMessage = await readErrorMessage(response);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log("[API] Application submitted successfully:", result);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("[API] Failed to submit application:", error);
      if (error instanceof Error) {
        const lowered = error.message.toLowerCase();
        if (lowered.includes("failed to fetch") || lowered.includes("load failed")) {
          setSubmitError(`Cannot reach backend (${API_BASE_URL}). Check server/CORS and try again.`);
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError("Failed to submit application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <ModernStep1 data={formData} updateData={handleDataUpdate} errors={errors} />;
      case 2: return <ModernStep2 data={formData} updateData={handleDataUpdate} errors={errors} />;
      case 3: return <ModernStep3 data={formData} updateData={handleDataUpdate} errors={errors} />;
      case 4: return <ModernStep4 data={formData} updateData={handleDataUpdate} onEditStep={handleStepChange} errors={errors} />;
      default: return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center relative overflow-hidden p-6">
        <div className="absolute top-0 right-0 w-full h-full bg-[#F03D3D]/10 skew-x-12 transform origin-top-right pointer-events-none" />
        <div className="relative z-10 w-full max-w-2xl">
          <ModernSuccess />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Visual & Info (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/3 bg-[#0F172A] text-white p-12 flex-col justify-between relative overflow-hidden sticky top-0 h-screen">
        <div className="absolute top-0 right-0 w-full h-full bg-[#F03D3D]/10 skew-x-12 transform origin-top-right" />
        
        <div className="relative z-10">
          <Link href="/" className="text-2xl font-bold tracking-tighter mb-12 block">
            Instruktori
          </Link>
          
          <h1 className="text-4xl font-bold leading-tight mb-6">
            {t("signup.sidebarTitle")}
          </h1>
          <p className="text-gray-400 text-lg">
            {t("signup.sidebarSubtitle")}
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-[#F03D3D]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{t("signup.beYourOwnBoss")}</h3>
              <p className="text-sm text-gray-400">{t("signup.beYourOwnBossDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-[#F03D3D]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{t("signup.guaranteedPayments")}</h3>
              <p className="text-sm text-gray-400">{t("signup.guaranteedPaymentsDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-[#F03D3D]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{t("signup.makeImpact")}</h3>
              <p className="text-sm text-gray-400">{t("signup.makeImpactDesc")}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          © 2025 Instruktori Inc.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 p-6 md:p-12 lg:p-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          {inviteId && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm">
              You are accepting an autoschool invite. Complete this application to join as an employee instructor.
            </div>
          )}

          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm shadow-sm ${statusStyles[apiStatus]}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold">{statusTitles[apiStatus]}</div>
              <span className="text-xs font-mono text-gray-600 truncate max-w-[200px]">
                {API_BASE_URL}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-90">{apiStatusMessage}</p>
          </div>
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              Instruktori
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("signup.pageTitle")}</h2>
          <p className="text-gray-500 mb-8">{t("signup.pageSubtitle")}</p>
          
          <ModernStepIndicator currentStep={currentStep} steps={steps} />
          
          <div className="bg-white min-h-[400px]">
            {renderStep()}
          </div>

          <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
            <button
              onClick={handlePreviousStep}
              disabled={isFirstStep}
              className={`
                flex items-center px-6 py-3 rounded-xl font-medium transition
                ${isFirstStep 
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
              `}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t("signup.back")}
            </button>

            <button
              onClick={isLastStep ? onSubmit : onNext}
              disabled={isSubmitting}
              className={`flex items-center px-8 py-3 bg-[#F03D3D] text-white rounded-xl font-bold transition shadow-lg shadow-red-500/20 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-red-600"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : isLastStep ? (
                t("signup.submitApplication")
              ) : (
                <>
                  {t("signup.continue")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>

          {/* Error Message Display */}
          {submitError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{submitError}</p>
            </div>
          )}
        </div>
      </div>

      {showPhonePrompt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Phone number required</h3>
            <p className="mt-2 text-sm text-gray-600">
              Please add your phone number in Profile Settings before submitting this application.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPhonePrompt(false)}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <Link
                href={localeHref("/dashboard/settings")}
                onClick={() => setShowPhonePrompt(false)}
                className="rounded-lg bg-[#F03D3D] px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Open profile settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
