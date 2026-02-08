"use client";

import { FilterOptions } from "@/hooks/useInstructorFilters";
import { Filter, X, ChevronDown, MapPin, Car } from "lucide-react";
import { useState } from "react";

interface HorizontalFilterBarProps {
  filters: FilterOptions;
  updateFilter: (key: keyof FilterOptions, value: any) => void;
    onSearch: () => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
}

const HorizontalFilterBar = ({ filters, updateFilter, onSearch, resetFilters, hasActiveFilters }: HorizontalFilterBarProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 relative">
      <div className="flex flex-wrap items-center gap-4">
        
        {/* Label */}
        <div className="flex items-center gap-2 text-gray-900 mr-2">
            <Filter className="w-5 h-5" />
            <span className="font-bold">Filters:</span>
        </div>

        {/* City Pill */}
        <div className="relative">
            <button 
                onClick={() => toggleDropdown('city')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    filters.city 
                    ? 'border-[#F03D3D] bg-red-50 text-[#F03D3D]' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
                <MapPin className="w-4 h-4" />
                <span>City</span>
                {filters.city && (
                    <>
                        <div className="w-px h-3 bg-current opacity-30" />
                        <span className="font-bold">{filters.city}</span>
                    </>
                )}
                <ChevronDown className="w-4 h-4" />
            </button>
            
            {openDropdown === 'city' && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
                    {['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi'].map((city) => (
                        <button
                            key={city}
                            onClick={() => {
                                updateFilter('city', filters.city === city ? '' : city);
                                setOpenDropdown(null);
                            }}
                            className={`w-full text-center px-4 py-2 rounded-lg text-sm transition-colors ${
                                filters.city === city 
                                ? 'bg-red-50 text-[#F03D3D] font-bold' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            {city}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Transmission Pill */}
        <div className="relative">
            <button 
                onClick={() => toggleDropdown('transmission')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    filters.transmissionType 
                    ? 'border-[#F03D3D] bg-red-50 text-[#F03D3D]' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
                <Car className="w-4 h-4" />
                <span>Transmission</span>
                {filters.transmissionType && (
                    <>
                        <div className="w-px h-3 bg-current opacity-30" />
                        <span className="font-bold">{filters.transmissionType}</span>
                    </>
                )}
                <ChevronDown className="w-4 h-4" />
            </button>
            
            {openDropdown === 'transmission' && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
                    {['Manual', 'Automatic'].map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                updateFilter('transmissionType', filters.transmissionType === type ? '' : type);
                                setOpenDropdown(null);
                            }}
                            className={`w-full text-center px-4 py-2 rounded-lg text-sm transition-colors ${
                                filters.transmissionType === type 
                                ? 'bg-red-50 text-[#F03D3D] font-bold' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Price Range Inputs */}
        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₾</span>
                <input 
                    type="number" 
                    min="40"
                    max="100"
                    value={filters.budget[0]}
                    onChange={(e) => updateFilter('budget', [Number(e.target.value), filters.budget[1]])}
                    className="w-18 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#F03D3D]"
                    placeholder="Min"
                />
            </div>
            <div className="w-1 h-[2px] bg-gray-300" />
            <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₾</span>
                <input 
                    type="number" 
                    min="40"
                    max="100"
                    value={filters.budget[1]}
                    onChange={(e) => updateFilter('budget', [filters.budget[0], Number(e.target.value)])}
                    className="w-18 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#F03D3D]"
                    placeholder="Max"
                />
            </div>
        </div>

                {/* Search Button */}
                <button
                    onClick={onSearch}
                    className="ml-auto text-sm font-semibold text-white bg-[#F03D3D] hover:bg-[#d62f2f] flex items-center gap-1 px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                    Search
                </button>

                {/* Reset Button */}
        {hasActiveFilters() && (
          <button 
            onClick={resetFilters}
                        className="text-sm font-medium text-[#F03D3D] hover:text-[#d62f2f] flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" /> Reset Filters
          </button>
        )}
      </div>
      
      {/* Overlay to close dropdowns when clicking outside */}
      {openDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
      )}
    </div>
  );
};

export default HorizontalFilterBar;
