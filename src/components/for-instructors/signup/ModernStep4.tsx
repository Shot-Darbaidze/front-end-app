"use client";

import { Check, Edit2 } from "lucide-react";
import { ReviewStepProps } from "@/types/instructor-signup";
import { useLanguage } from "@/contexts/LanguageContext";

const ModernStep4 = ({ data, updateData, onEditStep, errors = {} }: ReviewStepProps) => {
  const { t } = useLanguage();

  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <button 
          onClick={() => onEditStep(step)}
          className="text-sm text-[#F03D3D] font-medium hover:underline flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" /> {t("signup.edit")}
        </button>
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-4">
        <Section title={t("signup.step1")} step={1}>
          <p><span className="font-medium text-gray-900">{t("signup.name")}</span> {data.firstName} {data.lastName}</p>
          <p><span className="font-medium text-gray-900">{t("signup.phoneLabel")}</span> {data.phone}</p>
          <p><span className="font-medium text-gray-900">{t("signup.addressLabel")}</span> {data.address}</p>
        </Section>

        <Section title={t("signup.step2")} step={2}>
          <p><span className="font-medium text-gray-900">{t("signup.vehicle")}</span> {data.vehicleBrand}</p>
          <p><span className="font-medium text-gray-900">{t("signup.registrationLabel")}</span> {data.vehicleRegistration}</p>
          <p><span className="font-medium text-gray-900">{t("signup.yearLabel")}</span> {data.vehicleYear}</p>
          <p><span className="font-medium text-gray-900">{t("signup.transmissionLabel")}</span> {data.transmission}</p>
          <p><span className="font-medium text-gray-900">{t("signup.licenseCategoryLabel")}</span> {data.licenseCategory || "-"}</p>
          <p><span className="font-medium text-gray-900">{t("signup.allowedModeLabel")}</span> {data.allowedMode}</p>
          <p>
            <span className="font-medium text-gray-900">{t("signup.photos")}</span>{' '}
            {data.vehiclePhotos && data.vehiclePhotos.length > 0 ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> {data.vehiclePhotos.length} {t("signup.photosUploaded")}
              </span>
            ) : (
              <span className="text-red-500">{t("signup.notUploaded")}</span>
            )}
          </p>
        </Section>

        <Section title={t("signup.step3")} step={3}>
          <p>
            <span className="font-medium text-gray-900">{t("signup.ibanLabel")}</span> {data.iban || "-"}
          </p>
          <p>
            <span className="font-medium text-gray-900">{t("signup.license")}</span>{' '}
            {data.instructorLicense && data.instructorLicense.length > 0 ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> {data.instructorLicense.length} {t("signup.filesUploaded")}
              </span>
            ) : (
              <span className="text-red-500">{t("signup.notUploaded")}</span>
            )}
          </p>
          <p>
            <span className="font-medium text-gray-900">{t("signup.professionalCertificateLabel")}</span>{' '}
            {data.professionalCertificate ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> {t("signup.uploaded")}
              </span>
            ) : (
              <span className="text-red-500">{t("signup.notUploaded")}</span>
            )}
          </p>
          <p>
            <span className="font-medium text-gray-900">{t("signup.bankRequisitesLabel")}</span>{' '}
            {data.bankRequisites ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> {t("signup.uploaded")}
              </span>
            ) : (
              <span className="text-red-500">{t("signup.notUploaded")}</span>
            )}
          </p>
        </Section>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={data.termsAccepted}
              onChange={(e) => updateData({ termsAccepted: e.target.checked })}
              className={`mt-1 w-4 h-4 text-[#F03D3D] rounded focus:ring-[#F03D3D] ${errors.termsAccepted ? "border-red-500" : "border-gray-300"}`}
            />
            <label htmlFor="terms" className={`text-sm cursor-pointer select-none ${errors.termsAccepted ? "text-red-600" : "text-gray-600"}`}>
              {t("signup.termsText")}
            </label>
          </div>
          {errors.termsAccepted && <p className="text-xs text-red-500 font-medium mt-1 ml-7">{errors.termsAccepted}</p>}
        </div>

        <div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="privacy"
              checked={data.privacyAccepted}
              onChange={(e) => updateData({ privacyAccepted: e.target.checked })}
              className={`mt-1 w-4 h-4 text-[#F03D3D] rounded focus:ring-[#F03D3D] ${errors.privacyAccepted ? "border-red-500" : "border-gray-300"}`}
            />
            <label htmlFor="privacy" className={`text-sm cursor-pointer select-none ${errors.privacyAccepted ? "text-red-600" : "text-gray-600"}`}>
              {t("signup.privacyText")}
            </label>
          </div>
          {errors.privacyAccepted && <p className="text-xs text-red-500 font-medium mt-1 ml-7">{errors.privacyAccepted}</p>}
        </div>
      </div>
    </div>
  );
};

export default ModernStep4;
