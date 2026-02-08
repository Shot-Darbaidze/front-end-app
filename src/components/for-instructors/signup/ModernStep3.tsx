"use client";

import { FileText, Shield } from "lucide-react";
import { useRef } from "react";

interface Step3Props {
  data: any;
  updateData: (data: any) => void;
  errors?: Record<string, string>;
}

const FileUploadBox = ({ 
  label, 
  icon: Icon, 
  subtext, 
  files, 
  onFileSelect,
  multiple = false,
  error
}: { 
  label: React.ReactNode; 
  icon: any; 
  subtext: string;
  files: File | File[] | null;
  onFileSelect: (files: File[]) => void;
  multiple?: boolean;
  error?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      onFileSelect(newFiles);
    }
  };

  const fileList = Array.isArray(files) ? files : (files ? [files] : []);
  
  return (
    <div>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer group ${error ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-[#F03D3D] hover:bg-[#F03D3D]/5"}`}
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
              <div key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                <span className="truncate max-w-[150px]">{f.name}</span>
              </div>
            ))}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-sm text-gray-500 hover:text-[#F03D3D] underline ml-2"
            >
              {multiple ? "Add More" : "Change"}
            </button>
          </div>
        ) : (
          <button className={`px-4 py-2 bg-white border rounded-lg text-sm font-medium transition ${error ? "border-red-200 text-red-600" : "border-gray-200 text-gray-700 group-hover:border-[#F03D3D] group-hover:text-[#F03D3D]"}`}>
            Select File{multiple ? "s" : ""}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{error}</p>}
    </div>
  );
};

const ModernStep3 = ({ data, updateData, errors = {} }: Step3Props) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Your documents are stored securely and only used for verification purposes. We are GDPR compliant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FileUploadBox 
          label={<span>Driving Instructor License <span className="text-red-500">*</span></span>}
          icon={FileText} 
          subtext="Upload clear photos of your license (front & back)"
          files={data.instructorLicense}
          multiple={true}
          error={errors.instructorLicense}
          onFileSelect={(files) => {
            const current = Array.isArray(data.instructorLicense) ? data.instructorLicense : [];
            updateData({ instructorLicense: [...current, ...files] });
          }}
        />

        <FileUploadBox 
          label={<span>Professional Certificate</span>}
          icon={FileText} 
          subtext="Upload your professional driving instructor certificate"
          files={data.professionalCertificate}
          error={errors.professionalCertificate}
          onFileSelect={(files) => updateData({ professionalCertificate: files[0] })}
        />
      </div>
    </div>
  );
};

export default ModernStep3;
