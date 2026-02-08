"use client";

import { Search } from "lucide-react";

interface SearchHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

const SearchHeader = ({ value, onChange, onSearch }: SearchHeaderProps) => {
  return (
    <div className="relative bg-[#0F172A] pt-32 pb-16 px-6 overflow-hidden">
       {/* Abstract Background Shapes - Matching Home Page */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/5 -skew-x-12 transform origin-bottom-left" />
      
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Find Your Perfect <span className="text-[#F03D3D]">Instructor</span>
            </h1>
            <p className="text-gray-400 text-lg">
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
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/10 transition-all"
            />
          </div>
          <button
            onClick={onSearch}
            className="px-8 py-3 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
