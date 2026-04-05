"use client";

import { FileText, Landmark, Shield, X } from "lucide-react";
import { useRef } from "react";
import { StepProps, InstructorSignupFormData } from "@/types/instructor-signup";
import { useLanguage } from "@/contexts/LanguageContext";
import { UPLOAD_LIMITS } from "@/config/constants";

const MAX_LICENSE_FILES = UPLOAD_LIMITS.MAX_LICENSE_FILES;
const MAX_CERTIFICATE_FILES = UPLOAD_LIMITS.MAX_CERTIFICATE_FILES;
const MAX_FILE_SIZE_BYTES = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES;
const IBAN_MAX_LENGTH = 34;

const FileUploadBox = ({ 
  label, 
  icon: Icon, 
  subtext, 
  files,
  onFileSelect,
  onFileRemove,
  multiple = false,
  error,
  maxFiles = 1,
  addMoreText = "Add More",
  changeText = "Change",
  selectFileText = "Select File",
}: { 
  label: React.ReactNode; 
  icon: React.ComponentType<{ className?: string }>;
  subtext: string;
  files: File | File[] | null;
  onFileSelect: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  multiple?: boolean;
  error?: string;
  maxFiles?: number;
  addMoreText?: string;
  changeText?: string;
  selectFileText?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.size <= MAX_FILE_SIZE_BYTES);
      onFileSelect(newFiles);
    }
  };

  const fileList = Array.isArray(files) ? files : (files ? [files] : []);
  const isAtLimit = fileList.length >= maxFiles;
  
  return (
    <div>
      <div 
        onClick={() => {
          if (!isAtLimit) fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${isAtLimit ? "cursor-default opacity-75" : "cursor-pointer"} group ${error ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-[#F03D3D] hover:bg-[#F03D3D]/5"}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*,.pdf"
          multiple={multiple}
        />
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition ${error ? "bg-red-100" : "bg-gray-100 group-hover:bg-white"}`}>
          <Icon className={`w-6 h-6 transition ${error ? "text-red-500" : "text-gray-500 group-hover:text-[#F03D3D]"}`} />
        </div>
        <h4 className="font-bold text-gray-900 mb-1">{label}</h4>
        <p className={`text-sm mb-4 ${error ? "text-red-600" : "text-gray-500"}`}>{subtext}</p>
        
        {fileList.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {fileList.map((f, i) => (
              <div key={i} className="inline-flex items-center gap-2 pl-3 pr-1 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                <span className="truncate max-w-[150px]">{f.name}</span>
                {onFileRemove && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onFileRemove(i); }}
                    className="flex-shrink-0 p-0.5 rounded-full hover:bg-red-500 hover:text-white text-green-600 transition"
                    aria-label="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!isAtLimit) fileInputRef.current?.click();
              }}
              className={`text-sm hover:text-[#F03D3D] underline ml-2 ${isAtLimit ? "text-gray-300 cursor-not-allowed" : "text-gray-500"}`}
              disabled={isAtLimit}
            >
              {multiple ? `${addMoreText} (${fileList.length}/${maxFiles})` : changeText}
            </button>
          </div>
        ) : (
          <button className={`px-4 py-2 bg-white border rounded-lg text-sm font-medium transition ${error ? "border-red-200 text-red-600" : "border-gray-200 text-gray-700 group-hover:border-[#F03D3D] group-hover:text-[#F03D3D]"}`}>
            {selectFileText}{multiple ? "s" : ""} ({fileList.length}/{maxFiles})
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{error}</p>}
    </div>
  );
};

const ModernStep3 = ({ data, updateData, errors = {} }: StepProps<InstructorSignupFormData>) => {
  const { t } = useLanguage();
  const handleIbanChange = (value: string) => {
    const sanitized = value.replace(/\s+/g, "").toUpperCase().slice(0, IBAN_MAX_LENGTH);
    updateData({ iban: sanitized });
  };
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          {t("signup.documentsSecure")}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-900">{t("signup.iban")} <span className="text-red-500">*</span></label>
        <div className="relative">
          <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="iban"
            value={data.iban}
            onChange={(e) => handleIbanChange(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white font-mono uppercase tracking-wide ${errors.iban ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
            placeholder={t("signup.ibanPlaceholder")}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className={`text-xs ${errors.iban ? "text-red-500" : "text-gray-500"}`}>{errors.iban || t("signup.ibanSubtext")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FileUploadBox 
          label={<span>{t("signup.instructorLicense")} <span className="text-red-500">*</span></span>}
          icon={FileText} 
          subtext={t("signup.licenseSubtext")}
          files={data.instructorLicense}
          multiple={true}
          error={errors.instructorLicense}
          maxFiles={MAX_LICENSE_FILES}
          addMoreText={t("signup.addMore")}
          changeText={t("signup.change")}
          selectFileText={t("signup.selectFile")}
          onFileSelect={(files) => {
            const current = Array.isArray(data.instructorLicense) ? data.instructorLicense : [];
            const combined = [...current, ...files].slice(0, MAX_LICENSE_FILES);
            updateData({ instructorLicense: combined });
          }}
          onFileRemove={(index) => {
            const current = Array.isArray(data.instructorLicense) ? data.instructorLicense : [];
            updateData({ instructorLicense: current.filter((_, i) => i !== index) });
          }}
        />

        <FileUploadBox 
          label={<span>{t("signup.professionalCertificate")}</span>}
          icon={FileText} 
          subtext={t("signup.certificateSubtext")}
          files={data.professionalCertificate}
          error={errors.professionalCertificate}
          maxFiles={MAX_CERTIFICATE_FILES}
          addMoreText={t("signup.addMore")}
          changeText={t("signup.change")}
          selectFileText={t("signup.selectFile")}
          onFileSelect={(files) => updateData({ professionalCertificate: files[0] })}
          onFileRemove={() => updateData({ professionalCertificate: null })}
        />

        <FileUploadBox
          label={<span>{t("signup.bankRequisites")} <span className="text-red-500">*</span></span>}
          icon={FileText}
          subtext={t("signup.bankRequisitesSubtext")}
          files={data.bankRequisites}
          error={errors.bankRequisites}
          maxFiles={1}
          addMoreText={t("signup.addMore")}
          changeText={t("signup.change")}
          selectFileText={t("signup.selectFile")}
          onFileSelect={(files) => updateData({ bankRequisites: files[0] })}
          onFileRemove={() => updateData({ bankRequisites: null })}
        />
      </div>
    </div>
  );
};

export default ModernStep3;
