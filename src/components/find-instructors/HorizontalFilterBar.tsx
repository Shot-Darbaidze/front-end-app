"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { FilterOptions } from "@/hooks/useInstructorFilters";
import { PRICING, CITIES, TRANSMISSION_TYPES } from "@/config/constants";
import { Filter, X, ChevronDown, MapPin, Car, ArrowUpDown, DollarSign, Star, ArrowDown, ArrowUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type SortOption = "rating" | "price-asc" | "price-desc";

const CITY_LABELS: Record<string, { ka: string; en: string }> = {
  Tbilisi: { ka: "თბილისი", en: "Tbilisi" },
  Batumi: { ka: "ბათუმი", en: "Batumi" },
  Kutaisi: { ka: "ქუთაისი", en: "Kutaisi" },
  Rustavi: { ka: "რუსთავი", en: "Rustavi" },
  Gori: { ka: "გორი", en: "Gori" },
  Telavi: { ka: "თელავი", en: "Telavi" },
  Sachkhere: { ka: "საჩხერე", en: "Sachkhere" },
  Ozurgeti: { ka: "ოზურგეთი", en: "Ozurgeti" },
  Zugdidi: { ka: "ზუგდიდი", en: "Zugdidi" },
  Poti: { ka: "ფოთი", en: "Poti" },
  Akhaltsikhe: { ka: "ახალციხე", en: "Akhaltsikhe" },
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
  const { language } = useLanguage();
  const isKa = language === "ka";
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
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

  // Click-outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setIsMobileOpen(false);
        setIsMobileSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key closes dropdowns
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setIsMobileOpen(false);
        setIsMobileSortOpen(false);
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
    const container = (e.target as HTMLElement).closest("[role='listbox']");
    const buttons = container?.querySelectorAll<HTMLButtonElement>("[role='option']");
    buttons?.[next]?.focus();
  }, []);

  const activeFilterCount = [
    filters.city,
    filters.transmissionType,
    filters.budget[0] !== PRICING.MIN_PRICE_FILTER || filters.budget[1] !== PRICING.MAX_PRICE_FILTER,
  ].filter(Boolean).length;

  const sortLabels: Record<SortOption, string> = {
    rating: isKa ? "რეიტინგით" : "Top Rated",
    "price-asc": isKa ? "₾: დაბლიდან მაღლისკენ" : "₾: Low → High",
    "price-desc": isKa ? "₾: მაღლიდან დაბლისკენ" : "₾: High → Low",
  };

  const transmissionLabels: Record<string, string> = {
    Manual: isKa ? "მექანიკა" : "Manual",
    Automatic: isKa ? "ავტომატიკა" : "Automatic",
  };

  const getCityLabel = (city: string) => CITY_LABELS[city]?.[isKa ? "ka" : "en"] ?? city;
  const getTransmissionLabel = (type: string) => transmissionLabels[type] ?? type;

  return (
    <div ref={filterBarRef} className="relative mb-8">
      {/* ===== DESKTOP: Original horizontal bar (md+) ===== */}
      <div className="hidden md:block bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">

          {/* Label */}
          <div className="flex items-center gap-2 text-gray-900 mr-2">
            <Filter className="w-5 h-5" />
            <span className="font-bold">{isKa ? "ფილტრები:" : "Filters:"}</span>
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
              <span>{isKa ? "ქალაქი" : "City"}</span>
              {filters.city && (
                <>
                  <div className="w-px h-3 bg-current opacity-30" />
                  <span className="font-bold">{getCityLabel(filters.city)}</span>
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>

            {openDropdown === "city" && (
              <div role="listbox" aria-label={isKa ? "აირჩიეთ ქალაქი" : "Select city"} className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
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
                    {getCityLabel(city)}
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
              <span>{isKa ? "კოლოფი" : "Transmission"}</span>
              {filters.transmissionType && (
                <>
                  <div className="w-px h-3 bg-current opacity-30" />
                  <span className="font-bold">{getTransmissionLabel(filters.transmissionType)}</span>
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>

            {openDropdown === "transmission" && (
              <div role="listbox" aria-label={isKa ? "აირჩიეთ კოლოფი" : "Select transmission"} className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
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
                    {getTransmissionLabel(type)}
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
                className="w-[4.5rem] pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#F03D3D]"
                placeholder={isKa ? "მინ" : "Min"}
                aria-label={isKa ? "მინიმალური ფასი" : "Minimum price"}
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
                className="w-[4.5rem] pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#F03D3D]"
                placeholder={isKa ? "მაქს" : "Max"}
                aria-label={isKa ? "მაქსიმალური ფასი" : "Maximum price"}
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
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{sortLabels[sortBy]}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {openDropdown === "sort" && (
              <div role="listbox" aria-label={isKa ? "დალაგების წესი" : "Sort order"} className="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    role="option"
                    aria-selected={sortBy === option}
                    onClick={() => {
                      onSortChange(option);
                      setOpenDropdown(null);
                    }}
                    onKeyDown={(e) =>
                      handleListboxKeyDown(e, Object.keys(sortLabels), option, (o) => {
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
                    {sortLabels[option]}
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
              <X className="w-4 h-4" /> {isKa ? "ფილტრების გასუფთავება" : "Reset Filters"}
            </button>
          )}
        </div>
      </div>

      {/* ===== MOBILE: Dropdown buttons (<md) ===== */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setIsMobileOpen(!isMobileOpen); setIsMobileSortOpen(false); }}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-8 py-2.5 rounded-2xl border text-sm font-bold whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isMobileOpen || hasActiveFilters
                ? "border-[#F03D3D] bg-red-50 text-[#F03D3D]"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{isKa ? "ფილტრები" : "Filters"}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#F03D3D] text-white text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isMobileOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => { setIsMobileSortOpen(!isMobileSortOpen); setIsMobileOpen(false); }}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-gray-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sortBy === "rating" && <Star className="w-4 h-4" />}
              {sortBy === "price-asc" && <ArrowDown className="w-4 h-4" />}
              {sortBy === "price-desc" && <ArrowUp className="w-4 h-4" />}
              <ChevronDown className={`w-4 h-4 transition-transform ${isMobileSortOpen ? "rotate-180" : ""}`} />
            </button>

            {isMobileSortOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 z-30">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onSortChange(option);
                      setIsMobileSortOpen(false);
                    }}
                    className={`w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      sortBy === option
                        ? "bg-red-50 text-[#F03D3D] font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="p-2.5 rounded-2xl text-[#F03D3D] hover:bg-red-50 transition-colors flex-shrink-0"
              aria-label={isKa ? "ფილტრების გასუფთავება" : "Reset filters"}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Dropdown Panel */}
        {isMobileOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-5 z-30">
            {/* Row 1: City & Transmission */}
            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" /> {isKa ? "ქალაქი" : "City"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => updateFilter("city", filters.city === city ? "" : city)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.city === city
                          ? "bg-[#F03D3D] text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {getCityLabel(city)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                  <Car className="w-4 h-4" /> {isKa ? "კოლოფი" : "Transmission"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRANSMISSION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFilter("transmissionType", filters.transmissionType === type ? "" : type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.transmissionType === type
                          ? "bg-[#F03D3D] text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {getTransmissionLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Price Range */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4" /> {isKa ? "ფასის დიაპაზონი" : "Price Range"}
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[140px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{PRICING.CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    min={PRICING.MIN_PRICE_FILTER}
                    max={PRICING.MAX_PRICE_FILTER}
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    onBlur={commitMinPrice}
                    onKeyDown={(e) => e.key === "Enter" && commitMinPrice()}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F03D3D] focus:ring-1 focus:ring-[#F03D3D]/10"
                    placeholder={isKa ? "მინ" : "Min"}
                    aria-label={isKa ? "მინიმალური ფასი" : "Minimum price"}
                  />
                </div>
                <div className="w-4 h-[2px] bg-gray-300 flex-shrink-0" />
                <div className="relative flex-1 max-w-[140px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{PRICING.CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    min={PRICING.MIN_PRICE_FILTER}
                    max={PRICING.MAX_PRICE_FILTER}
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    onBlur={commitMaxPrice}
                    onKeyDown={(e) => e.key === "Enter" && commitMaxPrice()}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F03D3D] focus:ring-1 focus:ring-[#F03D3D]/10"
                    placeholder={isKa ? "მაქს" : "Max"}
                    aria-label={isKa ? "მაქსიმალური ფასი" : "Maximum price"}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

HorizontalFilterBar.displayName = "HorizontalFilterBar";

export default HorizontalFilterBar;
