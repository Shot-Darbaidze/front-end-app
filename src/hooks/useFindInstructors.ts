import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { InstructorCardData, SearchResult } from '@/types/find-instructors';
import { useInstructorFilters, type FilterOptions } from '@/hooks/useInstructorFilters';
import { api } from '@/services/api';
import { LIMITS, ERROR_MESSAGES, PRICING, TIME_CONFIG, API_ENDPOINTS } from '@/config/constants';
import { trackSearch, trackFilterChange } from '@/utils/analytics';

const PAGE_SIZE = 12;
const DEBOUNCE_DELAY = TIME_CONFIG.DEBOUNCE_DELAY;
const SESSION_KEY = 'find-instructors-state';

// ── Session storage helpers ──────────────────────────────────────────────

interface PersistedState {
  searchTerm: string;
  sortBy: 'rating' | 'price-asc' | 'price-desc';
  currentPage: number;
  filters: FilterOptions;
}

function saveState(state: PersistedState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable (SSR, private browsing quota)
  }
}

function loadState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function clearState(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Sort instructors on the client side */
const sortInstructors = (
  instructors: InstructorCardData[],
  sortBy: 'rating' | 'price-asc' | 'price-desc'
): InstructorCardData[] => {
  return [...instructors].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
      default:
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
    }
  });
};

/** Map API search results to InstructorCardData */
const mapResults = (results: SearchResult[]): InstructorCardData[] => {
  return results.map((item) => {
    const tags: string[] = [];

    if (item.located_at) {
      tags.push(`Location: ${item.located_at}`);
    }

    if (item.transmission) {
      tags.push(item.transmission.toLowerCase() === 'manual' ? 'Manual' : 'Automatic');
    }

    let specialty = item.title ?? 'Driving Instructor';
    if (specialty.startsWith(item.name)) {
      specialty = specialty.replace(item.name, '').trim();
      specialty = specialty.replace(/^[-–—]\s*/, '').trim();
    }
    if (!specialty || specialty === '') {
      specialty = 'Driving Instructor';
    }

    return {
      id: item.id,
      name: item.name,
      rating: Number(item.rating ?? 0),
      reviewCount: Number(item.review_count ?? 0),
      specialty,
      price: Number(item.hourly_rate ?? 0),
      cityPrice: item.city_price ?? null,
      tags,
      imageUrl: item.image_url ?? undefined,
    };
  });
};



export const useFindInstructors = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // ── Resolve initial state: URL params win, then sessionStorage, then defaults ──
  const resolved = useMemo(() => {
    // 1. Check URL params
    const urlSearch = searchParams.get('search') || '';
    const urlCity = searchParams.get('city') || '';
    const urlTransmission = searchParams.get('transmission') || '';
    const urlMinPrice = searchParams.get('min_price');
    const urlMaxPrice = searchParams.get('max_price');
    const urlSort = searchParams.get('sort') as 'rating' | 'price-asc' | 'price-desc' | null;
    const urlPage = searchParams.get('page');
    const hasUrlParams = !!(urlSearch || urlCity || urlTransmission || urlMinPrice || urlMaxPrice || urlSort || urlPage);

    // 2. Check sessionStorage
    const saved = loadState();

    // URL params take priority; otherwise use saved state
    if (hasUrlParams) {
      const filterValues: Partial<FilterOptions> = {};
      if (urlCity) filterValues.city = urlCity;
      if (urlTransmission) {
        filterValues.transmissionType =
          urlTransmission.toLowerCase() === 'manual' ? 'Manual' :
          urlTransmission.toLowerCase() === 'automatic' ? 'Automatic' :
          urlTransmission.charAt(0).toUpperCase() + urlTransmission.slice(1).toLowerCase();
      }
      if (urlMinPrice || urlMaxPrice) {
        filterValues.budget = [
          urlMinPrice ? Number(urlMinPrice) : PRICING.MIN_PRICE_FILTER,
          urlMaxPrice ? Number(urlMaxPrice) : PRICING.MAX_PRICE_FILTER,
        ];
      }
      return {
        searchTerm: urlSearch,
        sortBy: (urlSort && ['rating', 'price-asc', 'price-desc'].includes(urlSort)) ? urlSort : 'rating' as const,
        currentPage: urlPage ? Math.max(1, Number(urlPage)) : 1,
        filterValues,
      };
    }

    if (saved) {
      return {
        searchTerm: saved.searchTerm ?? '',
        sortBy: saved.sortBy ?? 'rating' as const,
        currentPage: saved.currentPage ?? 1,
        filterValues: {
          city: saved.filters?.city || '',
          transmissionType: saved.filters?.transmissionType || '',
          budget: saved.filters?.budget ?? [PRICING.MIN_PRICE_FILTER, PRICING.MAX_PRICE_FILTER],
        } satisfies FilterOptions,
      };
    }

    // Defaults
    return {
      searchTerm: '',
      sortBy: 'rating' as const,
      currentPage: 1,
      filterValues: {} as Partial<FilterOptions>,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize filters with resolved values
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useInstructorFilters(resolved.filterValues);

  const [searchTerm, setSearchTerm] = useState(resolved.searchTerm);
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc'>(resolved.sortBy);
  const [currentPage, setCurrentPage] = useState(resolved.currentPage);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(resolved.searchTerm);
  const [hasSearched, setHasSearched] = useState(true);

  const didInitFromQuery = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Persist state to sessionStorage whenever it changes ──
  useEffect(() => {
    saveState({
      searchTerm: debouncedSearchTerm,
      sortBy,
      currentPage,
      filters,
    });
  }, [debouncedSearchTerm, sortBy, currentPage, filters]);

  // Debounce search term
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  /** Consolidated param builder for API queries and browser URL */
  const buildParams = useCallback(
    (options: { forAPI: boolean; page?: number; search?: string }): URLSearchParams => {
      const params = new URLSearchParams();
      const trimmedSearch = (options.search ?? debouncedSearchTerm).trim().slice(0, LIMITS.MAX_SEARCH_LENGTH);

      if (trimmedSearch) params.set('search', trimmedSearch);
      if (filters.city) params.set('city', filters.city);
      if (filters.transmissionType) {
        params.set(
          'transmission',
          options.forAPI ? filters.transmissionType.toLowerCase() : filters.transmissionType
        );
      }
      if (filters.budget[0] !== PRICING.MIN_PRICE_FILTER) {
        params.set('min_price', String(filters.budget[0]));
      }
      if (filters.budget[1] !== PRICING.MAX_PRICE_FILTER) {
        params.set('max_price', String(filters.budget[1]));
      }
      if (sortBy !== 'rating') params.set('sort', sortBy);

      if (options.forAPI) {
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(((options.page ?? 1) - 1) * PAGE_SIZE));
      } else if (options.page && options.page > 1) {
        params.set('page', String(options.page));
      }

      return params;
    },
    [debouncedSearchTerm, filters, sortBy]
  );

  // Create stable query key for React Query caching (includes pathname for locale separation)
  const queryKey = useMemo(() => {
    const params = buildParams({ forAPI: true, page: currentPage });
    return ['instructors', pathname, params.toString()];
  }, [buildParams, currentPage, pathname]);

  // Fetch function for React Query
  const fetchInstructors = useCallback(async (): Promise<{
    instructors: InstructorCardData[];
    hasMore: boolean;
    totalCount: number;
  }> => {
    const params = buildParams({ forAPI: true, page: currentPage });
    const endpoint = `${API_ENDPOINTS.INSTRUCTOR_SEARCH}?${params.toString()}`;
    const results = await api.get<SearchResult[]>(endpoint);

    const mapped = mapResults(results);
    const sorted = sortInstructors(mapped, sortBy);

    return {
      instructors: sorted,
      hasMore: results.length >= PAGE_SIZE,
      totalCount: results.length,
    };
  }, [buildParams, currentPage, sortBy]);

  // Use React Query for data fetching with caching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchInstructors,
    enabled: hasSearched || didInitFromQuery.current,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const currentInstructors = data?.instructors ?? [];
  const hasMore = data?.hasMore ?? false;
  const errorMessage = error ? (error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR) : null;

  // Fetch total count in background (not cached with main query)
  const totalCountQuery = useQuery({
    queryKey: ['instructors-total-count', pathname, buildParams({ forAPI: true, page: 1 }).toString()],
    queryFn: async () => {
      const params = buildParams({ forAPI: true, page: 1 });
      params.set('limit', String(LIMITS.MAX_PAGE_SIZE));
      params.set('offset', '0');
      const endpoint = `${API_ENDPOINTS.INSTRUCTOR_SEARCH}?${params.toString()}`;
      const results = await api.get<SearchResult[]>(endpoint);
      return results.length;
    },
    enabled: hasSearched && !!data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const totalCount = totalCountQuery.data ?? null;

  /** Update browser URL to reflect current filters */
  const updateBrowserURL = useCallback((page: number = currentPage) => {
    const params = buildParams({ forAPI: false, page, search: searchTerm });
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [buildParams, pathname, router, currentPage, searchTerm]);

  /** Execute a new search (resets to page 1) */
  const executeSearch = useCallback(() => {
    setCurrentPage(1);
    setHasSearched(true);
    trackSearch(debouncedSearchTerm, { ...filters });
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['instructors'] });
  }, [debouncedSearchTerm, filters, queryClient]);

  /** Navigate to a specific page */
  const goToPage = useCallback((page: number) => {
    if (page < 1 || isLoading) return;
    setCurrentPage(page);
    updateBrowserURL(page);
    // Scroll to top of results section
    const resultsEl = document.getElementById('results-section');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isLoading, updateBrowserURL]);

  // Sync browser URL when filters change
  useEffect(() => {
    if (!didInitFromQuery.current) return;
    updateBrowserURL();
  }, [updateBrowserURL]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    if (!didInitFromQuery.current) return;
    setCurrentPage(1);
    setHasSearched(true);
  }, [debouncedSearchTerm, filters, sortBy]);

  // --- Handlers ---

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setSearchTerm('');
    setSortBy('rating');
    setCurrentPage(1);
    clearState();
    trackFilterChange('reset', 'all');
    // Invalidate all instructor queries
    queryClient.invalidateQueries({ queryKey: ['instructors'] });
  }, [resetFilters, queryClient]);

  const handleSortChange = useCallback(
    (newSort: 'rating' | 'price-asc' | 'price-desc') => {
      setSortBy(newSort);
      trackFilterChange('sort', newSort);
    },
    []
  );

  const handleFilterUpdate = useCallback(
    <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
      updateFilter(key, value);
      trackFilterChange(key, value);
    },
    [updateFilter]
  );

  return {
    searchTerm,
    sortBy,
    currentInstructors,
    isLoading,
    errorMessage,
    hasMore,
    hasSearched,
    currentPage,
    totalCount,
    filters,
    hasActiveFilters,
    setSearchTerm,
    handleSearch: executeSearch,
    handleResetFilters,
    handleSortChange,
    handleFilterUpdate,
    goToPage,
  };
};
