"use client";

import { Calendar, Camera } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { logger } from "@/utils/secureLogger";
import { StepProps, InstructorSignupFormData } from "@/types/instructor-signup";

const ModernStep2 = ({ data, updateData, errors = {} }: StepProps<InstructorSignupFormData>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrandSelect = (brand: string) => {
    updateData({ vehicleBrand: brand });
    logger.debug('[Vehicle Brand Selection] Brand selected', { brand });
  };
  
  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    let raw = val.replace(/-/g, '');
    let result = '';
    let rawIndex = 0;

    // Part 1: 2 Letters
    for (let i = 0; i < 2; i++) {
      if (rawIndex >= raw.length) break;
      while (rawIndex < raw.length && !/[A-Z]/.test(raw[rawIndex])) rawIndex++;
      if (rawIndex < raw.length) {
        result += raw[rawIndex];
        rawIndex++;
      }
    }

    if (result.length === 2) result += '-';

    // Part 2: 3 Numbers
    if (result.length >= 3) {
      for (let i = 0; i < 3; i++) {
        if (rawIndex >= raw.length) break;
        while (rawIndex < raw.length && !/[0-9]/.test(raw[rawIndex])) rawIndex++;
        if (rawIndex < raw.length) {
          result += raw[rawIndex];
          rawIndex++;
        }
      }
    }

    if (result.length === 6) result += '-';

    // Part 3: 2 Letters
    if (result.length >= 7) {
      for (let i = 0; i < 2; i++) {
        if (rawIndex >= raw.length) break;
        while (rawIndex < raw.length && !/[A-Z]/.test(raw[rawIndex])) rawIndex++;
        if (rawIndex < raw.length) {
          result += raw[rawIndex];
          rawIndex++;
        }
      }
    }
    
    // Truncate if it exceeds format
    if (result.length > 9) result = result.substring(0, 9);
    
    updateData({ vehicleRegistration: result });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      updateData({ vehicleYear: "" });
      return;
    }
    const numVal = parseInt(value);
    if (!isNaN(numVal) && numVal > 2026) {
      updateData({ vehicleYear: 2026 });
    } else {
      updateData({ vehicleYear: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      updateData({ vehiclePhotos: [...(data.vehiclePhotos || []), ...newFiles] });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Vehicle Brand <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <Image src="/images/skoda.svg" alt="Skoda" width={32} height={32} />
              </div>
              <button
                type="button"
                onClick={() => handleBrandSelect("Skoda")}
                className={`w-full py-3 px-2 rounded-xl border-2 font-medium transition text-center text-sm ${
                  data.vehicleBrand === "Skoda"
                    ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                Skoda
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <Image src="/images/volkswagen.svg" alt="Volkswagen" width={32} height={32} />
              </div>
              <button
                type="button"
                onClick={() => handleBrandSelect("Volkswagen")}
                className={`w-full py-3 px-2 rounded-xl border-2 font-medium transition text-center text-sm ${
                  data.vehicleBrand === "Volkswagen"
                    ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                Volkswagen
              </button>
            </div>
          </div>
          {errors.vehicleBrand && <p className="text-xs text-red-500 font-medium mt-1">{errors.vehicleBrand}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Vehicle Registration <span className="text-red-500">*</span></label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-4 bg-white rounded-sm border border-gray-300 flex items-center justify-center text-[8px] font-bold">GE</div>
            <input
              type="text"
              name="vehicleRegistration"
              value={data.vehicleRegistration}
              onChange={handleRegistrationChange}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white uppercase font-mono tracking-wider ${errors.vehicleRegistration ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
              placeholder="XX-123-XX"
            />
          </div>
          <p className="text-xs text-gray-500">Format: XX-123-XX (Standard Georgian Plates)</p>
          {errors.vehicleRegistration && <p className="text-xs text-red-500 font-medium mt-1">{errors.vehicleRegistration}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Year <span className="text-red-500">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              name="vehicleYear"
              value={data.vehicleYear}
              onChange={handleYearChange}
              max="2026"
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${errors.vehicleYear ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
              placeholder="2018"
            />
          </div>
          {errors.vehicleYear && <p className="text-xs text-red-500 font-medium mt-1">{errors.vehicleYear}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Transmission <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => updateData({ transmission: "Automatic" })}
              className={`w-full py-3 px-4 rounded-xl border-2 font-medium transition text-center ${
                data.transmission === "Automatic"
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                  : `bg-white text-gray-600 hover:border-gray-300 ${errors.transmission ? "border-red-500 bg-red-50" : "border-gray-200"}`
              }`}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => updateData({ transmission: "Manual" })}
              className={`w-full py-3 px-4 rounded-xl border-2 font-medium transition text-center ${
                data.transmission === "Manual"
                  ? "border-[#F03D3D] bg-[#F03D3D]/5 text-[#F03D3D]"
                  : `bg-white text-gray-600 hover:border-gray-300 ${errors.transmission ? "border-red-500 bg-red-50" : "border-gray-200"}`
              }`}
            >
              Manual
            </button>
          </div>
          {errors.transmission && <p className="text-xs text-red-500 font-medium mt-1">{errors.transmission}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-900">Vehicle Photos <span className="text-red-500">*</span></label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition hover:border-[#F03D3D] hover:bg-[#F03D3D]/5 group ${errors.vehiclePhotos ? "border-red-500 bg-red-50" : "border-gray-200"}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
            accept="image/*"
          />
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-[#F03D3D] transition">
            <Camera className="w-6 h-6 text-gray-500 group-hover:text-[#F03D3D]" />
          </div>
          <h4 className="font-bold text-gray-900 mb-1">Upload Vehicle Photos</h4>
          <p className="text-sm text-gray-500 mb-4">Upload clear photos of your vehicle (front, back, interior)</p>
          <button type="button" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 group-hover:border-[#F03D3D] group-hover:text-[#F03D3D] transition">
            Select Files
          </button>
        </div>
        {data.vehiclePhotos && data.vehiclePhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {data.vehiclePhotos.map((file: File, index: number) => (
              <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={URL.createObjectURL(file)}
                  alt={`Vehicle photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newPhotos = [...data.vehiclePhotos];
                    newPhotos.splice(index, 1);
                    updateData({ vehiclePhotos: newPhotos });
                  }}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.vehiclePhotos && <p className="text-xs text-red-500 font-medium mt-1">{errors.vehiclePhotos}</p>}
      </div>
    </div>
  );
};

export default ModernStep2;
