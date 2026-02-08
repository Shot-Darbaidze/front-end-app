"use client";

import { Check, Edit2 } from "lucide-react";

interface Step4Props {
  data: any;
  updateData: (data: any) => void;
  onEditStep: (step: number) => void;
  errors?: Record<string, string>;
}

const ModernStep4 = ({ data, updateData, onEditStep, errors = {} }: Step4Props) => {
  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <button 
          onClick={() => onEditStep(step)}
          className="text-sm text-[#F03D3D] font-medium hover:underline flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" /> Edit
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
        <Section title="About You" step={1}>
          <p><span className="font-medium text-gray-900">Name:</span> {data.firstName} {data.lastName}</p>
          <p><span className="font-medium text-gray-900">Email:</span> {data.email}</p>
          <p><span className="font-medium text-gray-900">Phone:</span> {data.phone}</p>
          <p><span className="font-medium text-gray-900">Address:</span> {data.address}</p>
        </Section>

        <Section title="Vehicle Info" step={2}>
          <p><span className="font-medium text-gray-900">Vehicle:</span> {data.vehicleBrand}</p>
          <p><span className="font-medium text-gray-900">Registration:</span> {data.vehicleRegistration}</p>
          <p><span className="font-medium text-gray-900">Year:</span> {data.vehicleYear}</p>
          <p><span className="font-medium text-gray-900">Transmission:</span> {data.transmission}</p>
          <p>
            <span className="font-medium text-gray-900">Photos:</span>{' '}
            {data.vehiclePhotos && data.vehiclePhotos.length > 0 ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> {data.vehiclePhotos.length} photo(s) uploaded
              </span>
            ) : (
              <span className="text-red-500">Not uploaded</span>
            )}
          </p>
        </Section>

        <Section title="Documents" step={3}>
          <p>
            <span className="font-medium text-gray-900">License:</span>{' '}
            {data.instructorLicense && data.instructorLicense.length > 0 ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> {data.instructorLicense.length} file(s) uploaded
              </span>
            ) : (
              <span className="text-red-500">Not uploaded</span>
            )}
          </p>
          <p>
            <span className="font-medium text-gray-900">Professional Certificate:</span>{' '}
            {data.professionalCertificate ? (
              <span className="text-green-600 flex items-center gap-1 inline-flex">
                <Check className="w-3 h-3" /> Uploaded
              </span>
            ) : (
              <span className="text-red-500">Not uploaded</span>
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
              I accept the <a href="#" className="text-[#F03D3D] hover:underline">Terms and Conditions</a> and agree to abide by the platform&apos;s rules.
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
              I agree to the <a href="#" className="text-[#F03D3D] hover:underline">Privacy Policy</a> and consent to the processing of my personal data.
            </label>
          </div>
          {errors.privacyAccepted && <p className="text-xs text-red-500 font-medium mt-1 ml-7">{errors.privacyAccepted}</p>}
        </div>
      </div>
    </div>
  );
};

export default ModernStep4;
