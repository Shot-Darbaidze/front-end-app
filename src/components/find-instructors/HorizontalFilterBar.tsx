"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { FilterOptions } from "@/hooks/useInstructorFilters";
import { PRICING, CITIES, TRANSMISSION_TYPES } from "@/config/constants";
import { Filter, X, ChevronDown, MapPin, Car, ArrowUpDown } from "lucide-react";

type SortOption = "rating" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  rating: "Top Rated",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
};

interface HorizontalFilterBarProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  sortBy: SortOption;
  onSortChange: (newSort: SortOption) => void;
  isLoading?: boolean;
}

const HorizontalFilterBar = memo(({
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
  sortBy,
  onSortChange,
  isLoading = false,
}: HorizontalFilterBarProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Local price state for controlled inputs (commit on blur)
  const [localMin, setLocalMin] = useState(String(filters.budget[0]));
  const [localMax, setLocalMax] = useState(String(filters.budget[1]));

  // Sync local state when filters change externally (e.g., reset)
  useEffect(() => {
    setLocalMin(String(filters.budget[0]));
    setLocalMax(String(filters.budget[1]));
  }, [filters.budget]);

  const toggleDropdown = useCallback((name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  // Click-outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key closes dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown((prev) => (prev ? null : prev));
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const commitMinPrice = useCallback(() => {
    const val = Math.max(PRICING.MIN_PRICE_FILTER, Math.min(Number(localMin) || PRICING.MIN_PRICE_FILTER, filters.budget[1]));
    setLocalMin(String(val));
    updateFilter("budget", [val, filters.budget[1]]);
  }, [localMin, filters.budget, updateFilter]);

  const commitMaxPrice = useCallback(() => {
    const val = Math.min(PRICING.MAX_PRICE_FILTER, Math.max(Number(localMax) || PRICING.MAX_PRICE_FILTER, filters.budget[0]));
    setLocalMax(String(val));
    updateFilter("budget", [filters.budget[0], val]);
  }, [localMax, filters.budget, updateFilter]);

  // Keyboard navigation for listbox dropdowns
  const handleListboxKeyDown = useCallback((e: React.KeyboardEvent, items: string[], current: string, onSelect: (item: string) => void) => {
    const idx = items.indexOf(current);
    let next = idx;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        next = Math.min(idx + 1, items.length - 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        next = Math.max(idx - 1, 0);
        break;
      case "Home":
        e.preventDefault();
        next = 0;
        break;
      case "End":
        e.preventDefault();
        next = items.length - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(items[idx]);
        return;
      default:
        return;
    }
    // Focus the next option button
    const container = (e.target as HTMLElement).closest("[role='listbox']");
    const buttons = container?.querySelectorAll<HTMLButtonElement>("[role='option']");
    buttons?.[next]?.focus();
  }, []);

  return (
    <div ref={filterBarRef} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 relative">
      <div className="flex flex-wrap items-center gap-4">

        {/* Label */}
        <div className="flex items-center gap-2 text-gray-900 mr-2">
          <Filter className="w-5 h-5" />
          <span className="font-bold">Filters:</span>
        </div>

        {/* City Pill */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("city")}
            disabled={isLoading}
            aria-expanded={openDropdown === "city"}
            aria-haspopup="listbox"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              filters.city
                ? "border-[#F03D3D] bg-red-50 text-[#F03D3D]"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
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

          {openDropdown === "city" && (
            <div role="listbox" aria-label="Select city" className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
              {CITIES.map((city) => (
                <button
                  key={city}
                  role="option"
                  aria-selected={filters.city === city}
                  onClick={() => {
                    updateFilter("city", filters.city === city ? "" : city);
                    setOpenDropdown(null);
                  }}
                  onKeyDown={(e) =>
                    handleListboxKeyDown(e, [...CITIES], city, (c) => {
                      updateFilter("city", filters.city === c ? "" : c);
                      setOpenDropdown(null);
                    })
                  }
                  className={`w-full text-center px-4 py-2 rounded-lg text-sm transition-colors ${
                    filters.city === city
                      ? "bg-red-50 text-[#F03D3D] font-bold"
                      : "hover:bg-gray-50 text-gray-700"
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
            onClick={() => toggleDropdown("transmission")}
            disabled={isLoading}
            aria-expanded={openDropdown === "transmission"}
            aria-haspopup="listbox"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              filters.transmissionType
                ? "border-[#F03D3D] bg-red-50 text-[#F03D3D]"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
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

          {openDropdown === "transmission" && (
            <div role="listbox" aria-label="Select transmission" className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
              {TRANSMISSION_TYPES.map((type) => (
                <button
                  key={type}
                  role="option"
                  aria-selected={filters.transmissionType === type}
                  onClick={() => {
                    updateFilter("transmissionType", filters.transmissionType === type ? "" : type);
                    setOpenDropdown(null);
                  }}
                  onKeyDown={(e) =>
                    handleListboxKeyDown(e, [...TRANSMISSION_TYPES], type, (t) => {
                      updateFilter("transmissionType", filters.transmissionType === t ? "" : t);
                      setOpenDropdown(null);
                    })
                  }
                  className={`w-full text-center px-4 py-2 rounded-lg text-sm transition-colors ${
                    filters.transmissionType === type
                      ? "bg-red-50 text-[#F03D3D] font-bold"
                      : "hover:bg-gray-50 text-gray-700"
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
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{PRICING.CURRENCY_SYMBOL}</span>
            <input
              type="number"
              min={PRICING.MIN_PRICE_FILTER}
              max={PRICING.MAX_PRICE_FILTER}
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              onBlur={commitMinPrice}
              onKeyDown={(e) => e.key === "Enter" && commitMinPrice()}
              className="w-18 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#F03D3D]"
              placeholder="Min"
              aria-label="Minimum price"
            />
          </div>
          <div className="w-1 h-[2px] bg-gray-300" />
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{PRICING.CURRENCY_SYMBOL}</span>
            <input
              type="number"
              min={PRICING.MIN_PRICE_FILTER}
              max={PRICING.MAX_PRICE_FILTER}
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              onBlur={commitMaxPrice}
              onKeyDown={(e) => e.key === "Enter" && commitMaxPrice()}
              className="w-18 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#F03D3D]"
              placeholder="Max"
              aria-label="Maximum price"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => toggleDropdown("sort")}
            disabled={isLoading}
            aria-expanded={openDropdown === "sort"}
            aria-haspopup="listbox"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{SORT_LABELS[sortBy]}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {openDropdown === "sort" && (
            <div role="listbox" aria-label="Sort order" className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <button
                  key={option}
                  role="option"
                  aria-selected={sortBy === option}
                  onClick={() => {
                    onSortChange(option);
                    setOpenDropdown(null);
                  }}
                  onKeyDown={(e) =>
                    handleListboxKeyDown(e, Object.keys(SORT_LABELS), option, (o) => {
                      onSortChange(o as SortOption);
                      setOpenDropdown(null);
                    })
                  }
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === option
                      ? "bg-red-50 text-[#F03D3D] font-bold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {SORT_LABELS[option]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm font-medium text-[#F03D3D] hover:text-[#d62f2f] flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" /> Reset Filters
          </button>
        )}
      </div>
    </div>
  );
});

HorizontalFilterBar.displayName = "HorizontalFilterBar";

export default HorizontalFilterBar;
