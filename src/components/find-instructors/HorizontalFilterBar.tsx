"use client";

import { memo, useState, useCallback, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { FilterOptions } from "@/hooks/useInstructorFilters";
import {
  PRICING,
  CITIES,
  CITY_LABELS,
  TRANSMISSION_TYPES,
  ALL_LANGUAGE_OPTIONS,
} from "@/config/constants";
import {
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  MapPin,
  Car,
  ArrowUpDown,
  Globe,
  Star,
  Route,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type SortOption = "rating" | "price-asc" | "price-desc";

interface HorizontalFilterBarProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  sortBy: SortOption;
  onSortChange: (newSort: SortOption) => void;
  isLoading?: boolean;
  hasSearched?: boolean;
  totalCount?: number | null;
  isSchoolMode?: boolean;
  errorMessage?: string | null;
  onRetrySearch?: () => void;
}

const HorizontalFilterBar = memo(({
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
  sortBy,
  onSortChange,
  isLoading = false,
  errorMessage = null,
  onRetrySearch,
}: HorizontalFilterBarProps) => {
  const toBudgetInputValue = useCallback((value: number, defaultValue: number) => (
    value === defaultValue ? "" : String(value)
  ), []);

  const { language } = useLanguage();
  const isKa = language === "ka";

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [editingBudgetField, setEditingBudgetField] = useState<null | "min" | "max">(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const budgetMin = filters.budget[0];
  const budgetMax = filters.budget[1];
  const isMinFilterActive = budgetMin !== PRICING.MIN_PRICE_FILTER;
  const isMaxFilterActive = budgetMax !== PRICING.MAX_PRICE_FILTER;
  const isBudgetActive = isMinFilterActive || isMaxFilterActive;

  const [localMin, setLocalMin] = useState(() => toBudgetInputValue(budgetMin, PRICING.MIN_PRICE_FILTER));
  const [localMax, setLocalMax] = useState(() => toBudgetInputValue(budgetMax, PRICING.MAX_PRICE_FILTER));

  useEffect(() => {
    if (editingBudgetField !== "min") {
      setLocalMin(toBudgetInputValue(budgetMin, PRICING.MIN_PRICE_FILTER));
    }
    if (editingBudgetField !== "max") {
      setLocalMax(toBudgetInputValue(budgetMax, PRICING.MAX_PRICE_FILTER));
    }
  }, [budgetMin, budgetMax, editingBudgetField, toBudgetInputValue]);

  const toggleDropdown = useCallback((name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

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
    if (localMin.trim() === "") {
      setLocalMin("");
      updateFilter("budget", [PRICING.MIN_PRICE_FILTER, budgetMax]);
      return;
    }

    const parsedMin = Number(localMin);
    const effectiveMax = isMaxFilterActive ? budgetMax : PRICING.MAX_HOURLY_RATE;
    const value = Math.max(
      0,
      Math.min(Number.isFinite(parsedMin) ? parsedMin : PRICING.MIN_PRICE_FILTER, effectiveMax),
    );
    setLocalMin(toBudgetInputValue(value, PRICING.MIN_PRICE_FILTER));
    updateFilter("budget", [value, budgetMax]);
  }, [budgetMax, isMaxFilterActive, localMin, toBudgetInputValue, updateFilter]);

  const commitMaxPrice = useCallback(() => {
    if (localMax.trim() === "") {
      setLocalMax("");
      updateFilter("budget", [budgetMin, PRICING.MAX_PRICE_FILTER]);
      return;
    }

    const parsedMax = Number(localMax);
    const effectiveMin = isMinFilterActive ? budgetMin : 0;
    const value = Math.min(
      PRICING.MAX_HOURLY_RATE,
      Math.max(Number.isFinite(parsedMax) ? parsedMax : PRICING.MAX_PRICE_FILTER, effectiveMin),
    );
    setLocalMax(toBudgetInputValue(value, PRICING.MAX_PRICE_FILTER));
    updateFilter("budget", [budgetMin, value]);
  }, [budgetMin, isMinFilterActive, localMax, toBudgetInputValue, updateFilter]);

  const handleMinFocus = useCallback(() => {
    setEditingBudgetField("min");
  }, []);

  const handleMaxFocus = useCallback(() => {
    setEditingBudgetField("max");
  }, []);

  const handleMinBlur = useCallback(() => {
    setEditingBudgetField((current) => (current === "min" ? null : current));
    commitMinPrice();
  }, [commitMinPrice]);

  const handleMaxBlur = useCallback(() => {
    setEditingBudgetField((current) => (current === "max" ? null : current));
    commitMaxPrice();
  }, [commitMaxPrice]);

  const handleListboxKeyDown = useCallback((
    e: ReactKeyboardEvent<HTMLButtonElement>,
    items: string[],
    current: string,
    onSelect: (item: string) => void,
  ) => {
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

    const container = e.currentTarget.closest("[role='listbox']");
    const buttons = container?.querySelectorAll<HTMLButtonElement>("[role='option']");
    buttons?.[next]?.focus();
  }, []);

  const activeFilterCount = [
    filters.city,
    filters.transmissionType,
    filters.languageCodes.length > 0,
    filters.mode,
    isBudgetActive,
  ].filter(Boolean).length;

  const sortLabels: Record<SortOption, string> = {
    rating: isKa ? "რეიტინგი" : "Top rated",
    "price-asc": isKa ? "დაბ → მაღ" : "Low → High",
    "price-desc": isKa ? "მაღ → დაბ" : "High → Low",
  };

  const transmissionLabels: Record<string, string> = {
    Manual: isKa ? "მექანიკა" : "Manual",
    Automatic: isKa ? "ავტომატიკა" : "Automatic",
  };

  const toggleLanguageCode = useCallback((code: string) => {
    const normalized = code.toLowerCase();
    const next = filters.languageCodes.includes(normalized)
      ? filters.languageCodes.filter((item) => item !== normalized)
      : [...filters.languageCodes, normalized];
    updateFilter("languageCodes", next);
  }, [filters.languageCodes, updateFilter]);

  const getCityLabel = (city: string) => CITY_LABELS[city]?.[isKa ? "ka" : "en"] ?? city;
  const getTransmissionLabel = (type: string) => transmissionLabels[type] ?? type;
  const cityPlaceholder = isKa ? "ქალაქი" : "City";
  const transmissionPlaceholder = isKa ? "კოლოფი" : "Transmission";
  const modePlaceholder = isKa ? "რეჟიმი" : "Mode";
  const languagePlaceholder = isKa ? "ენა" : "Language";
  const minPricePlaceholder = isKa ? "მინ" : "Min";
  const maxPricePlaceholder = isKa ? "მაქს" : "Max";
  const modeLabel = filters.mode === "city"
    ? (isKa ? "ქალაქი" : "City")
    : filters.mode === "yard"
      ? (isKa ? "მოედანი" : "Yard")
      : "";
  const selectedLanguageLabels = filters.languageCodes
    .map((code) => ALL_LANGUAGE_OPTIONS.find((opt) => opt.code === code)?.label ?? code.toUpperCase());
  const languageSummary = selectedLanguageLabels.length === 0
    ? ""
    : selectedLanguageLabels.length === 1
      ? selectedLanguageLabels[0]
      : `${selectedLanguageLabels.length}`;

  const desktopControlClass = (isActive: boolean) => `group flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
    isActive
      ? "border-[#F03D3D] bg-red-50 text-[#F03D3D]"
      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
  }`;
  const desktopPriceInputClass = "h-11 w-[4.75rem] rounded-xl border border-gray-200 bg-white pl-7 pr-2 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#F03D3D]";

  return (
    <div ref={filterBarRef} className="relative mb-6">
      <div className="hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm md:block">
        <div className="flex flex-nowrap items-center gap-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-900" aria-label={isKa ? "ფილტრები" : "Filters"} title={isKa ? "ფილტრები" : "Filters"}>
            <Filter className="h-4 w-4" />
          </div>

          <div className="relative min-w-[80px] flex-1">
            <button
              onClick={() => toggleDropdown("city")}
              disabled={isLoading}
              aria-expanded={openDropdown === "city"}
              aria-haspopup="listbox"
              className={desktopControlClass(Boolean(filters.city))}
            >
              <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                <MapPin className="h-4 w-4 shrink-0" />
                {filters.city ? (
                  <span className="min-w-0 truncate font-semibold">{getCityLabel(filters.city)}</span>
                ) : (
                  <span className="truncate text-slate-500">{cityPlaceholder}</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {openDropdown === "city" && (
              <div role="listbox" aria-label={isKa ? "აირჩიეთ ქალაქი" : "Select city"} className="absolute top-full left-0 z-20 mt-2 min-w-[200px] rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    role="option"
                    aria-selected={filters.city === city}
                    onClick={() => {
                      updateFilter("city", filters.city === city ? "" : city);
                      setOpenDropdown(null);
                    }}
                    onKeyDown={(e) => handleListboxKeyDown(e, [...CITIES], city, (selectedCity) => {
                      updateFilter("city", filters.city === selectedCity ? "" : selectedCity);
                      setOpenDropdown(null);
                    })}
                    className={`w-full rounded-xl px-4 py-2 text-center text-sm transition-colors ${
                      filters.city === city
                        ? "bg-red-50 font-bold text-[#F03D3D]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {getCityLabel(city)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative min-w-[80px] flex-1">
            <button
              onClick={() => toggleDropdown("transmission")}
              disabled={isLoading}
              aria-expanded={openDropdown === "transmission"}
              aria-haspopup="listbox"
              className={desktopControlClass(Boolean(filters.transmissionType))}
            >
              <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                <Car className="h-4 w-4 shrink-0" />
                {filters.transmissionType ? (
                  <span className="min-w-0 truncate font-semibold">{getTransmissionLabel(filters.transmissionType)}</span>
                ) : (
                  <span className="truncate text-slate-500">{transmissionPlaceholder}</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {openDropdown === "transmission" && (
              <div role="listbox" aria-label={isKa ? "აირჩიეთ კოლოფი" : "Select transmission"} className="absolute top-full left-0 z-20 mt-2 min-w-[200px] rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {TRANSMISSION_TYPES.map((type) => (
                  <button
                    key={type}
                    role="option"
                    aria-selected={filters.transmissionType === type}
                    onClick={() => {
                      updateFilter("transmissionType", filters.transmissionType === type ? "" : type);
                      setOpenDropdown(null);
                    }}
                    onKeyDown={(e) => handleListboxKeyDown(e, [...TRANSMISSION_TYPES], type, (selectedType) => {
                      updateFilter("transmissionType", filters.transmissionType === selectedType ? "" : selectedType);
                      setOpenDropdown(null);
                    })}
                    className={`w-full rounded-xl px-4 py-2 text-center text-sm transition-colors ${
                      filters.transmissionType === type
                        ? "bg-red-50 font-bold text-[#F03D3D]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {getTransmissionLabel(type)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative min-w-[80px] flex-1">
            <button
              onClick={() => toggleDropdown("mode")}
              disabled={isLoading}
              aria-expanded={openDropdown === "mode"}
              aria-haspopup="listbox"
              className={desktopControlClass(Boolean(filters.mode))}
            >
              <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                <Route className="h-4 w-4 shrink-0" />
                {filters.mode ? (
                  <span className="min-w-0 truncate font-semibold">{modeLabel}</span>
                ) : (
                  <span className="truncate text-slate-500">{modePlaceholder}</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {openDropdown === "mode" && (
              <div role="listbox" aria-label={isKa ? "აირჩიეთ რეჟიმი" : "Select mode"} className="absolute top-full left-0 z-20 mt-2 min-w-[180px] rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {(["city", "yard"] as const).map((mode) => {
                  const optionLabel = mode === "city" ? (isKa ? "ქალაქი" : "City") : (isKa ? "მოედანი" : "Yard");

                  return (
                    <button
                      key={mode}
                      role="option"
                      aria-selected={filters.mode === mode}
                      onClick={() => {
                        updateFilter("mode", filters.mode === mode ? "" : mode);
                        setOpenDropdown(null);
                      }}
                      className={`w-full rounded-xl px-4 py-2 text-center text-sm transition-colors ${
                        filters.mode === mode
                          ? "bg-red-50 font-bold text-[#F03D3D]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {optionLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative min-w-[80px] flex-1">
            <button
              onClick={() => toggleDropdown("language")}
              disabled={isLoading}
              aria-expanded={openDropdown === "language"}
              aria-haspopup="listbox"
              className={desktopControlClass(filters.languageCodes.length > 0)}
            >
              <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                <Globe className="h-4 w-4 shrink-0" />
                {filters.languageCodes.length > 0 ? (
                  <span className="min-w-0 truncate font-semibold">{languageSummary}</span>
                ) : (
                  <span className="truncate text-slate-500">{languagePlaceholder}</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {openDropdown === "language" && (
              <div role="listbox" aria-label={isKa ? "აირჩიეთ ენები" : "Select languages"} className="absolute top-full left-0 z-20 mt-2 max-h-64 min-w-[240px] overflow-y-auto rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {ALL_LANGUAGE_OPTIONS.map((opt) => {
                  const selected = filters.languageCodes.includes(opt.code);

                  return (
                    <button
                      key={opt.code}
                      role="option"
                      aria-selected={selected}
                      onClick={() => toggleLanguageCode(opt.code)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "bg-red-50 font-bold text-[#F03D3D]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{PRICING.CURRENCY_SYMBOL}</span>
              <input
                type="number"
                min={0}
                max={PRICING.MAX_HOURLY_RATE}
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                onFocus={handleMinFocus}
                onBlur={handleMinBlur}
                onKeyDown={(e) => e.key === "Enter" && commitMinPrice()}
                className={desktopPriceInputClass}
                placeholder={minPricePlaceholder}
                aria-label={isKa ? "მინიმალური ფასი" : "Minimum price"}
              />
            </div>
            <div className="h-px w-3 bg-gray-300" />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{PRICING.CURRENCY_SYMBOL}</span>
              <input
                type="number"
                min={0}
                max={PRICING.MAX_HOURLY_RATE}
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                onFocus={handleMaxFocus}
                onBlur={handleMaxBlur}
                onKeyDown={(e) => e.key === "Enter" && commitMaxPrice()}
                className={desktopPriceInputClass}
                placeholder={maxPricePlaceholder}
                aria-label={isKa ? "მაქსიმალური ფასი" : "Maximum price"}
              />
            </div>
          </div>

          <div className="relative min-w-[180px]">
            <button
              onClick={() => toggleDropdown("sort")}
              disabled={isLoading}
              aria-expanded={openDropdown === "sort"}
              aria-haspopup="listbox"
              className={desktopControlClass(sortBy !== "rating")}
            >
              <span className="flex min-w-0 items-center gap-2">
                {sortBy === "rating" ? <Star className="h-4 w-4 shrink-0" /> : <ArrowUpDown className="h-4 w-4 shrink-0" />}
                <span className="max-w-[8rem] truncate font-semibold">{sortLabels[sortBy]}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {openDropdown === "sort" && (
              <div role="listbox" aria-label={isKa ? "დალაგების წესი" : "Sort order"} className="absolute top-full right-0 z-20 mt-2 min-w-[180px] rounded-xl border border-slate-100 bg-white p-2 shadow-xl">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    role="option"
                    aria-selected={sortBy === option}
                    onClick={() => {
                      onSortChange(option);
                      setOpenDropdown(null);
                    }}
                    onKeyDown={(e) => handleListboxKeyDown(e, Object.keys(sortLabels), option, (selectedOption) => {
                      onSortChange(selectedOption as SortOption);
                      setOpenDropdown(null);
                    })}
                    className={`flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm transition-colors ${
                      sortBy === option
                        ? "bg-red-50 font-bold text-[#F03D3D]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option === "rating" && <Star className="h-4 w-4" />}
                    {(option === "price-asc" || option === "price-desc") && <span className="flex h-4 w-4 items-center justify-center text-sm font-bold">₾</span>}
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F03D3D]/15 bg-[#fff6f6] text-[#F03D3D] transition-colors hover:bg-[#ffecec]"
              aria-label={isKa ? "ფილტრების გასუფთავება" : "Reset filters"}
              title={isKa ? "ფილტრების გასუფთავება" : "Reset filters"}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {errorMessage && (
            <div className="w-full pt-1">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errorMessage}</span>
                {onRetrySearch && (
                  <button onClick={onRetrySearch} className="font-semibold underline underline-offset-2">
                    {isKa ? "ხელახლა ცდა" : "Retry"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setIsMobileOpen(!isMobileOpen);
              setIsMobileSortOpen(false);
            }}
            disabled={isLoading}
            aria-label={isKa ? "ფილტრები" : "Filters"}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isMobileOpen || hasActiveFilters
                ? "border-[#F03D3D] bg-red-50 text-[#F03D3D]"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>{isKa ? "ფილტრები" : "Filters"}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F03D3D] text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isMobileOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setIsMobileSortOpen(!isMobileSortOpen);
                setIsMobileOpen(false);
              }}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sortBy === "rating" && <Star className="h-4 w-4" />}
              {(sortBy === "price-asc" || sortBy === "price-desc") && <ArrowUpDown className="h-4 w-4" />}
              <ChevronDown className={`h-4 w-4 transition-transform ${isMobileSortOpen ? "rotate-180" : ""}`} />
            </button>

            {isMobileSortOpen && (
              <div className="absolute top-full right-0 z-30 mt-2 w-44 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onSortChange(option);
                      setIsMobileSortOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      sortBy === option
                        ? "bg-red-50 font-bold text-[#F03D3D]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {option === "rating" && <Star className="h-4 w-4" />}
                      {(option === "price-asc" || option === "price-desc") && <ArrowUpDown className="h-4 w-4" />}
                    </span>
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex-shrink-0 rounded-2xl p-2.5 text-[#F03D3D] transition-colors hover:bg-red-50"
              aria-label={isKa ? "ფილტრების გასუფთავება" : "Reset filters"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
            <span className="inline-flex items-center gap-2 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {errorMessage}
            </span>
            {onRetrySearch && (
              <button onClick={onRetrySearch} className="font-semibold underline underline-offset-2">
                {isKa ? "ხელახლა ცდა" : "Retry"}
              </button>
            )}
          </div>
        )}

        {isMobileOpen && (
          <div className="absolute top-full left-0 right-0 z-30 mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <MapPin className="h-4 w-4" /> {isKa ? "ქალაქი" : "City"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => updateFilter("city", filters.city === city ? "" : city)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        filters.city === city
                          ? "bg-[#F03D3D] text-white shadow-sm"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {getCityLabel(city)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Car className="h-4 w-4" /> {isKa ? "კოლოფი" : "Transmission"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRANSMISSION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFilter("transmissionType", filters.transmissionType === type ? "" : type)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        filters.transmissionType === type
                          ? "bg-[#F03D3D] text-white shadow-sm"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {getTransmissionLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Route className="h-4 w-4" /> {isKa ? "რეჟიმი" : "Mode"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["city", "yard"] as const).map((mode) => {
                    const optionLabel = mode === "city" ? (isKa ? "ქალაქი" : "City") : (isKa ? "მოედანი" : "Yard");

                    return (
                      <button
                        key={mode}
                        onClick={() => updateFilter("mode", filters.mode === mode ? "" : mode)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                          filters.mode === mode
                            ? "bg-[#F03D3D] text-white shadow-sm"
                            : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {optionLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">{isKa ? "ენები" : "Languages"}</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_LANGUAGE_OPTIONS.map((opt) => {
                    const selected = filters.languageCodes.includes(opt.code);

                    return (
                      <button
                        key={opt.code}
                        onClick={() => toggleLanguageCode(opt.code)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                          selected
                            ? "bg-[#F03D3D] text-white shadow-sm"
                            : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <span className="text-sm font-semibold leading-none">{PRICING.CURRENCY_SYMBOL}</span> {isKa ? "ფასის დიაპაზონი" : "Price Range"}
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-[140px] flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{PRICING.CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      min={0}
                      max={PRICING.MAX_HOURLY_RATE}
                      value={localMin}
                      onChange={(e) => setLocalMin(e.target.value)}
                      onFocus={handleMinFocus}
                      onBlur={handleMinBlur}
                      onKeyDown={(e) => e.key === "Enter" && commitMinPrice()}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#F03D3D]"
                      placeholder={minPricePlaceholder}
                      aria-label={isKa ? "მინიმალური ფასი" : "Minimum price"}
                    />
                  </div>
                  <div className="h-px w-4 bg-gray-300" />
                  <div className="relative max-w-[140px] flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{PRICING.CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      min={0}
                      max={PRICING.MAX_HOURLY_RATE}
                      value={localMax}
                      onChange={(e) => setLocalMax(e.target.value)}
                      onFocus={handleMaxFocus}
                      onBlur={handleMaxBlur}
                      onKeyDown={(e) => e.key === "Enter" && commitMaxPrice()}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#F03D3D]"
                      placeholder={maxPricePlaceholder}
                      aria-label={isKa ? "მაქსიმალური ფასი" : "Maximum price"}
                    />
                  </div>
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
