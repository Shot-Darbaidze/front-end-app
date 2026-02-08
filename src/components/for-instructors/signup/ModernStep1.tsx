"use client";

import { User, Calendar, MapPin, Mail, Phone } from "lucide-react";

interface Step1Props {
  data: any;
  updateData: (data: any) => void;
  errors?: Record<string, string>;
}

const GEORGIAN_CITIES = [
  "Tbilisi",
  "Batumi",
  "Kutaisi",
  "Rustavi",
  "Gori",
  "Zugdidi",
  "Poti",
  "Kobuleti",
  "Khashuri",
  "Samtredia"
];

const ModernStep1 = ({ data, updateData, errors = {} }: Step1Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only letters (English and Georgian) and spaces
    if (/^[a-zA-Z\u10A0-\u10FF\s]*$/.test(value)) {
      updateData({ [e.target.name]: value });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Limit to 9 digits
    const truncatedValue = rawValue.slice(0, 9);
    
    // Format as XXX XX XX XX
    let formattedValue = "";
    if (truncatedValue.length > 0) formattedValue += truncatedValue.slice(0, 3);
    if (truncatedValue.length > 3) formattedValue += " " + truncatedValue.slice(3, 5);
    if (truncatedValue.length > 5) formattedValue += " " + truncatedValue.slice(5, 7);
    if (truncatedValue.length > 7) formattedValue += " " + truncatedValue.slice(7, 9);
    
    updateData({ [e.target.name]: formattedValue });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const year = parseInt(value.split('-')[0]);
      if (year > 2026) {
        return; 
      }
    }
    updateData({ [e.target.name]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">First Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="firstName"
              value={data.firstName}
              onChange={handleNameChange}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${errors.firstName ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
              placeholder="John"
            />
          </div>
          {errors.firstName && <p className="text-xs text-red-500 font-medium mt-1">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Last Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="lastName"
              value={data.lastName}
              onChange={handleNameChange}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${errors.lastName ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
              placeholder="Doe"
            />
          </div>
          {errors.lastName && <p className="text-xs text-red-500 font-medium mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Email Address <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${errors.email ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
              placeholder="john@example.com"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">City <span className="text-red-500">*</span></label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              name="city"
              value={data.city}
              onChange={(e) => updateData({ city: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white appearance-none ${errors.city ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
            >
              <option value="" disabled>Select City</option>
              {GEORGIAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.city && <p className="text-xs text-red-500 font-medium mt-1">{errors.city}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Phone Number <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              name="phone"
              value={data.phone}
              onChange={handlePhoneChange}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
              placeholder="555 00 00 00"
            />
          </div>
          {errors.phone && <p className="text-xs text-red-500 font-medium mt-1">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900">Date of Birth <span className="text-red-500">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              name="dateOfBirth"
              value={data.dateOfBirth}
              onChange={handleDateChange}
              min="1950-01-01"
              max="2026-12-31"
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white ${errors.dateOfBirth ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
            />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-red-500 font-medium mt-1">{errors.dateOfBirth}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-900">Address (Teaching Location) <span className="text-red-500">*</span></label>
        <div className="relative">
          <MapPin className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
          <textarea
            name="address"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#F03D3D]/20 outline-none transition bg-gray-50 focus:bg-white min-h-[100px] resize-none ${errors.address ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F03D3D]"}`}
            placeholder="Chavchavadze street, Tbilisi"
          />
        </div>
        {errors.address && <p className="text-xs text-red-500 font-medium mt-1">{errors.address}</p>}
      </div>
    </div>
  );
};

export default ModernStep1;
