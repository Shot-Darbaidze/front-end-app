"use client";

import { Search, X } from "lucide-react";

interface SearchHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  instructorType: 'all' | 'solo' | 'school';
  onInstructorTypeChange: (type: 'all' | 'solo' | 'school') => void;
}

const SearchHeader = ({ value, onChange, onSearch, isLoading = false, instructorType, onInstructorTypeChange }: SearchHeaderProps) => {
  return (
    <div className="relative bg-[#0F172A] pt-24 pb-10 sm:pt-32 sm:pb-16 px-4 sm:px-6 overflow-hidden">
       {/* Abstract Background Shapes - Matching Home Page */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 -left-32 sm:-left-10 md:left-0 w-2/3 sm:w-1/2 md:w-1/3 h-1/2 bg-blue-500/5 -skew-x-12 transform origin-bottom-left" />
      
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Find Your Perfect <span className="text-[#F03D3D]">Instructor</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
            Compare ratings, prices, and reviews to find the best match for your learning journey.
            </p>
        </div>
        
        <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-black/20 max-w-2xl mx-auto flex flex-col md:flex-row gap-2 transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F03D3D] transition-colors w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, specialty..." 
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="w-full h-14 pl-12 pr-12 rounded-xl bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/10 transition-all"
            />
            {value && (
              <button
                onClick={() => onChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F03D3D] transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="px-8 py-3 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Searching
              </span>
            ) : 'Search'}
          </button>
        </div>

        {/* Instructor Type Toggle */}
        <div className="flex items-center justify-center gap-1 mt-5 p-1 bg-white/10 backdrop-blur-sm rounded-2xl w-fit mx-auto">
          {([
            { value: 'all', label: 'All' },
            { value: 'solo', label: 'Solo Instructors' },
            { value: 'school', label: 'Driving Schools' },
          ] as const).map(({ value: v, label }) => (
            <button
              key={v}
              onClick={() => onInstructorTypeChange(v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                instructorType === v
                  ? 'bg-[#F03D3D] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
