"use client";

import { memo, useState, useCallback, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { FilterOptions } from "@/hooks/useInstructorFilters";
import {
  PRICING,
  CITIES,
  CITY_LABELS,
  TRANSMISSION_TYPES,
  ALL_LANGUAGE_OPTIONS,
  DEFAULT_LICENSE_CATEGORY,
  LICENSE_CATEGORIES,
  LIMITS,
} from "@/config/constants";
import {
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  MapPin,
  Car,
  ArrowUpDown,
  DollarSign,
  Star,
  Route,
  BadgeCheck,
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
  hasSearched = false,
  totalCount = null,
  isSchoolMode = false,
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
    const val = Math.max(
      0,
      Math.min(Number.isFinite(parsedMin) ? parsedMin : PRICING.MIN_PRICE_FILTER, effectiveMax),
    );
    setLocalMin(toBudgetInputValue(val, PRICING.MIN_PRICE_FILTER));
    updateFilter("budget", [val, budgetMax]);
  }, [localMin, budgetMax, isMaxFilterActive, updateFilter, toBudgetInputValue]);

  const commitMaxPrice = useCallback(() => {
    if (localMax.trim() === "") {
      setLocalMax("");
      updateFilter("budget", [budgetMin, PRICING.MAX_PRICE_FILTER]);
      return;
    }

    const parsedMax = Number(localMax);
    const effectiveMin = isMinFilterActive ? budgetMin : 0;
    const val = Math.min(
      PRICING.MAX_HOURLY_RATE,
      Math.max(Number.isFinite(parsedMax) ? parsedMax : PRICING.MAX_PRICE_FILTER, effectiveMin),
    );
    setLocalMax(toBudgetInputValue(val, PRICING.MAX_PRICE_FILTER));
    updateFilter("budget", [budgetMin, val]);
  }, [localMax, budgetMin, isMinFilterActive, updateFilter, toBudgetInputValue]);

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
    filters.licenseCategory !== DEFAULT_LICENSE_CATEGORY,
    filters.mode,
    filters.budget[0] !== PRICING.MIN_PRICE_FILTER || filters.budget[1] !== PRICING.MAX_PRICE_FILTER,
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
  const modeLabel = filters.mode === "city"
    ? (isKa ? "ქალაქი" : "City")
    : filters.mode === "yard"
      ? (isKa ? "მოედანი" : "Yard")
      : (isKa ? "ყველა რეჟიმი" : "All modes");
  const selectedLanguageLabels = filters.languageCodes
    .map((code) => ALL_LANGUAGE_OPTIONS.find((opt) => opt.code === code)?.label ?? code.toUpperCase());
  const languageSummary = selectedLanguageLabels.length === 0
    ? (isKa ? "ყველა ენა" : "All languages")
    : selectedLanguageLabels.length === 1
      ? selectedLanguageLabels[0]
      : isKa
        ? `${selectedLanguageLabels.length} ენა`
        : `${selectedLanguageLabels.length} languages`;
  const totalLabel = totalCount !== null
    ? totalCount >= LIMITS.MAX_PAGE_SIZE
      ? `${LIMITS.MAX_PAGE_SIZE}+`
      : `${totalCount}`
    : null;
  const resultCountLabel = !hasSearched
    ? null
    : totalLabel === null
      ? (isKa ? "შედეგები ახლდება" : "Updating results")
      : isKa
        ? `${totalLabel} ${isSchoolMode ? "ავტოსკოლა" : "ინსტრუქტორი"} ნაპოვნია`
        : `${totalLabel} ${isSchoolMode ? (totalCount === 1 ? "school" : "schools") : (totalCount === 1 ? "instructor" : "instructors")} found`;

  const desktopControlClass = (isActive: boolean) => `group flex min-h-[76px] w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
    isActive
      ? "border-[#F03D3D]/20 bg-[#fff7f7] text-slate-900 shadow-[0_10px_26px_-22px_rgba(240,61,61,0.95)]"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
  }`;
  const headerPillClass = "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm";

  return (
    <div ref={filterBarRef} className="relative mb-6">
      <div className="hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] md:block">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,_rgba(248,250,252,0.98),_rgba(255,255,255,0.96))] px-4 py-4 lg:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.9)]">
                <Filter className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {isKa ? "მორგებული ძიება" : "Refine results"}
                  </span>
                  <span className={headerPillClass}>
                    {isKa
                      ? isSchoolMode
                        ? "ავტოსკოლები"
                        : "ინსტრუქტორები"
                      : isSchoolMode
                        ? "Driving schools"
                        : "Instructors"}
                  </span>
                  {activeFilterCount > 0 && (
                    <span className={headerPillClass}>
                      {isKa ? `${activeFilterCount} აქტიური` : `${activeFilterCount} active`}
                    </span>
                  )}
                  {resultCountLabel && (
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {resultCountLabel}
                    </span>
                  )}
                </div>

                <p className="mt-1 truncate text-sm font-medium text-slate-600">
                  {isKa
                    ? "ფილტრები, დალაგება და შედეგების რაოდენობა ახლა ერთ კომპაქტურ ბლოკშია."
                    : "Filters, sorting, and result count now live in one compact block."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="relative min-w-[190px]">
                <button
                  onClick={() => toggleDropdown("sort")}
                  disabled={isLoading}
                  aria-expanded={openDropdown === "sort"}
                  aria-haspopup="listbox"
                  className="flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-medium text-slate-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300"
                >
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {isKa ? "დალაგება" : "Sort"}
                    </span>
                    <span className="block truncate text-sm font-semibold text-slate-900">{sortLabels[sortBy]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    {sortBy === "rating" ? <Star className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {openDropdown === "sort" && (
                  <div role="listbox" aria-label={isKa ? "დალაგების წესი" : "Sort order"} className="absolute top-full right-0 z-20 mt-2 w-full rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
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
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#F03D3D]/15 bg-[#fff6f6] px-3.5 text-sm font-semibold text-[#F03D3D] transition-colors hover:bg-[#ffecec]"
                >
                  <X className="h-4 w-4" />
                  {isKa ? "გასუფთავება" : "Reset"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-5">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-12">
            <div className="relative xl:col-span-2">
              <button
                onClick={() => toggleDropdown("city")}
                disabled={isLoading}
                aria-expanded={openDropdown === "city"}
                aria-haspopup="listbox"
                className={desktopControlClass(Boolean(filters.city))}
              >
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isKa ? "ქალაქი" : "City"}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">
                    {filters.city ? getCityLabel(filters.city) : (isKa ? "აირჩიე ქალაქი" : "Choose city")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {openDropdown === "city" && (
                <div role="listbox" aria-label={isKa ? "აირჩიეთ ქალაქი" : "Select city"} className="absolute top-full left-0 z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
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

            <div className="relative xl:col-span-2">
              <button
                onClick={() => toggleDropdown("transmission")}
                disabled={isLoading}
                aria-expanded={openDropdown === "transmission"}
                aria-haspopup="listbox"
                className={desktopControlClass(Boolean(filters.transmissionType))}
              >
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isKa ? "კოლოფი" : "Transmission"}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">
                    {filters.transmissionType ? getTransmissionLabel(filters.transmissionType) : (isKa ? "ყველა ტიპი" : "All types")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Car className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {openDropdown === "transmission" && (
                <div role="listbox" aria-label={isKa ? "აირჩიეთ კოლოფი" : "Select transmission"} className="absolute top-full left-0 z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
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

            <div className="relative xl:col-span-2">
              <button
                onClick={() => toggleDropdown("mode")}
                disabled={isLoading}
                aria-expanded={openDropdown === "mode"}
                aria-haspopup="listbox"
                className={desktopControlClass(Boolean(filters.mode))}
              >
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isKa ? "რეჟიმი" : "Mode"}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{modeLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Route className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {openDropdown === "mode" && (
                <div role="listbox" aria-label={isKa ? "აირჩიეთ რეჟიმი" : "Select mode"} className="absolute top-full left-0 z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
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

            <div className="relative xl:col-span-2">
              <button
                onClick={() => toggleDropdown("language")}
                disabled={isLoading}
                aria-expanded={openDropdown === "language"}
                aria-haspopup="listbox"
                className={desktopControlClass(filters.languageCodes.length > 0)}
              >
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isKa ? "ენა" : "Language"}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{languageSummary}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              {openDropdown === "language" && (
                <div role="listbox" aria-label={isKa ? "აირჩიეთ ენები" : "Select languages"} className="absolute top-full left-0 z-20 mt-2 max-h-64 w-full min-w-[240px] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
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

            <div className="relative xl:col-span-2">
              <button
                onClick={() => toggleDropdown("license-category")}
                disabled={isLoading}
                aria-expanded={openDropdown === "license-category"}
                aria-haspopup="listbox"
                className={desktopControlClass(filters.licenseCategory !== DEFAULT_LICENSE_CATEGORY)}
              >
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isKa ? "კატეგორია" : "Category"}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{filters.licenseCategory}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <BadgeCheck className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {openDropdown === "license-category" && (
                <div role="listbox" aria-label={isKa ? "აირჩიეთ მართვის კატეგორია" : "Select license category"} className="absolute top-full left-0 z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                  {LICENSE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      role="option"
                      aria-selected={filters.licenseCategory === category}
                      onClick={() => {
                        updateFilter("licenseCategory", category);
                        setOpenDropdown(null);
                      }}
                      onKeyDown={(e) => handleListboxKeyDown(e, [...LICENSE_CATEGORIES], category, (selectedCategory) => {
                        updateFilter("licenseCategory", selectedCategory as FilterOptions["licenseCategory"]);
                        setOpenDropdown(null);
                      })}
                      className={`w-full rounded-xl px-4 py-2 text-center text-sm transition-colors ${
                        filters.licenseCategory === category
                          ? "bg-red-50 font-bold text-[#F03D3D]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 md:col-span-2 xl:col-span-2">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isKa ? "ბიუჯეტი" : "Budget"}</span>
                  <DollarSign className="h-4 w-4 shrink-0 text-slate-400" />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)] items-center gap-1.5">
                <div className="min-w-0">
                  <input
                    type="number"
                    min={0}
                    max={PRICING.MAX_HOURLY_RATE}
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    onFocus={handleMinFocus}
                    onBlur={handleMinBlur}
                    onKeyDown={(e) => e.key === "Enter" && commitMinPrice()}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F03D3D] focus:ring-2 focus:ring-[#F03D3D]/10"
                    placeholder="Min"
                    aria-label={isKa ? "მინიმალური ფასი" : "Minimum price"}
                  />
                </div>
                <div className="text-center text-sm font-semibold text-slate-300">-</div>
                <div className="min-w-0">
                  <input
                    type="number"
                    min={0}
                    max={PRICING.MAX_HOURLY_RATE}
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    onFocus={handleMaxFocus}
                    onBlur={handleMaxBlur}
                    onKeyDown={(e) => e.key === "Enter" && commitMaxPrice()}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F03D3D] focus:ring-2 focus:ring-[#F03D3D]/10"
                    placeholder="Max"
                    aria-label={isKa ? "მაქსიმალური ფასი" : "Maximum price"}
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errorMessage}</span>
              {onRetrySearch && (
                <button onClick={onRetrySearch} className="font-semibold underline underline-offset-2">
                  {isKa ? "ხელახლა ცდა" : "Retry"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      <div className="rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.35)] md:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            <Filter className="h-3.5 w-3.5" />
            {isKa ? "ფილტრები" : "Filters"}
          </span>
          {activeFilterCount > 0 && (
            <span className={headerPillClass}>{isKa ? `${activeFilterCount} აქტიური` : `${activeFilterCount} active`}</span>
          )}
          {resultCountLabel && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {resultCountLabel}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => {
              setIsMobileOpen(!isMobileOpen);
              setIsMobileSortOpen(false);
            }}
            disabled={isLoading}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isMobileOpen || hasActiveFilters
                ? "border-[#F03D3D] bg-red-50 text-[#F03D3D]"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span>{isKa ? "ფილტრების მართვა" : "Manage filters"}</span>
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
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#F03D3D] transition-colors hover:bg-red-50"
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
                  <BadgeCheck className="h-4 w-4" /> {isKa ? "მართვის კატეგორია" : "License category"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {LICENSE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => updateFilter("licenseCategory", category)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        filters.licenseCategory === category
                          ? "bg-[#F03D3D] text-white shadow-sm"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <DollarSign className="h-4 w-4" /> {isKa ? "ფასი" : "Price"}
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)] items-center gap-1.5">
                  <div className="min-w-0">
                    <input
                      type="number"
                      min={0}
                      max={PRICING.MAX_HOURLY_RATE}
                      value={localMin}
                      onChange={(e) => setLocalMin(e.target.value)}
                      onFocus={handleMinFocus}
                      onBlur={handleMinBlur}
                      onKeyDown={(e) => e.key === "Enter" && commitMinPrice()}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#F03D3D] focus:ring-1 focus:ring-[#F03D3D]/10"
                      placeholder="Min"
                      aria-label={isKa ? "მინიმალური ფასი" : "Minimum price"}
                    />
                  </div>
                  <div className="text-center text-sm font-semibold text-gray-300">-</div>
                  <div className="min-w-0">
                    <input
                      type="number"
                      min={0}
                      max={PRICING.MAX_HOURLY_RATE}
                      value={localMax}
                      onChange={(e) => setLocalMax(e.target.value)}
                      onFocus={handleMaxFocus}
                      onBlur={handleMaxBlur}
                      onKeyDown={(e) => e.key === "Enter" && commitMaxPrice()}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#F03D3D] focus:ring-1 focus:ring-[#F03D3D]/10"
                      placeholder="Max"
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