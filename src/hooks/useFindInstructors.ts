import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { InstructorCardData, SearchResult } from '@/types/find-instructors';
import { useInstructorFilters } from '@/hooks/useInstructorFilters';
import { api } from '@/services/api';
import { LIMITS, ERROR_MESSAGES, PRICING, TIME_CONFIG, API_ENDPOINTS } from '@/config/constants';
import { trackSearch, trackFilterChange } from '@/utils/analytics';

const PAGE_SIZE = 12;
const DEBOUNCE_DELAY = TIME_CONFIG.DEBOUNCE_DELAY;

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
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useInstructorFilters();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc'>('rating');
  const [currentInstructors, setCurrentInstructors] = useState<InstructorCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const didInitFromQuery = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const requestCounter = useRef(0);
  const immediateSearchRef = useRef(false);

  /** Consolidated param builder for API queries and browser URL */
  const buildParams = useCallback(
    (options: { forAPI: boolean; page?: number }): URLSearchParams => {
      const params = new URLSearchParams();
      const trimmedSearch = searchTerm.trim().slice(0, LIMITS.MAX_SEARCH_LENGTH);

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
    [searchTerm, filters, sortBy]
  );

  /** Update browser URL to reflect current filters */
  const updateBrowserURL = useCallback((page: number = currentPage) => {
    const params = buildParams({ forAPI: false, page });
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [buildParams, pathname, router, currentPage]);

  /** Fetch total count of matching instructors */
  const fetchTotalCount = useCallback(async () => {
    try {
      const params = buildParams({ forAPI: true, page: 1 });
      params.set('limit', String(LIMITS.MAX_PAGE_SIZE));
      params.set('offset', '0');

      const endpoint = `${API_ENDPOINTS.INSTRUCTOR_SEARCH}?${params.toString()}`;
      const results = await api.get<SearchResult[]>(endpoint);
      setTotalCount(results.length);
    } catch {
      // Don't block UI if count fetch fails
    }
  }, [buildParams]);

  /** Fetch a specific page of results */
  const fetchPage = useCallback(async (page: number, isNewSearch: boolean = false) => {
    const currentRequest = ++requestCounter.current;

    setIsLoading(true);
    setErrorMessage(null);
    if (isNewSearch) {
      setCurrentPage(page);
      setHasMore(true);
      setTotalCount(null);
    }
    setHasSearched(true);

    if (isNewSearch) {
      trackSearch(searchTerm, { ...filters });
    }

    try {
      const params = buildParams({ forAPI: true, page });
      const endpoint = `${API_ENDPOINTS.INSTRUCTOR_SEARCH}?${params.toString()}`;
      const results = await api.get<SearchResult[]>(endpoint);

      // Ignore stale responses
      if (requestCounter.current !== currentRequest) return;

      const mapped = mapResults(results);
      const sorted = sortInstructors(mapped, sortBy);

      setCurrentInstructors(sorted);
      setCurrentPage(page);
      setHasMore(results.length >= PAGE_SIZE);

      // Fetch total count in background on new search
      if (isNewSearch) {
        fetchTotalCount();
      }
    } catch (error: unknown) {
      if (requestCounter.current !== currentRequest) return;

      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: string }).message)
            : ERROR_MESSAGES.GENERIC_ERROR;
      setErrorMessage(message);
      setCurrentInstructors([]);
      setHasMore(false);
    } finally {
      if (requestCounter.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, [buildParams, searchTerm, filters, fetchTotalCount]);

  /** Execute a new search (resets to page 1) */
  const executeSearch = useCallback(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  // Keep ref to latest executeSearch so the debounce timer never calls a stale version
  const executeSearchRef = useRef(executeSearch);
  executeSearchRef.current = executeSearch;

  /** Navigate to a specific page */
  const goToPage = useCallback((page: number) => {
    if (page < 1 || isLoading) return;
    fetchPage(page);
    updateBrowserURL(page);
    // Scroll to top of results section
    const resultsEl = document.getElementById('results-section');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [fetchPage, isLoading, updateBrowserURL]);

  // Mark as initialized and trigger initial search (runs once)
  useEffect(() => {
    if (didInitFromQuery.current) return;
    didInitFromQuery.current = true;
    immediateSearchRef.current = true;
  }, []);

  // Sync browser URL when filters change
  useEffect(() => {
    if (!didInitFromQuery.current) return;
    updateBrowserURL();
  }, [updateBrowserURL]);

  // Debounced search — fires on searchTerm/filters/sortBy change
  useEffect(() => {
    if (!didInitFromQuery.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const delay = immediateSearchRef.current ? 0 : DEBOUNCE_DELAY;
    immediateSearchRef.current = false;

    debounceTimer.current = setTimeout(() => {
      executeSearchRef.current();
    }, delay);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters, sortBy]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // --- Handlers ---

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setSearchTerm('');
    setSortBy('rating');
    setCurrentPage(1);
    setTotalCount(null);
    setErrorMessage(null);
    immediateSearchRef.current = true;
    trackFilterChange('reset', 'all');
  }, [resetFilters]);

  const handleSortChange = useCallback(
    (newSort: 'rating' | 'price-asc' | 'price-desc') => {
      setSortBy(newSort);
      immediateSearchRef.current = true;
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
