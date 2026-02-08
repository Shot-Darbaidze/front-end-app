"use client";

import SearchHeader from "@/components/find-instructors/SearchHeader";
import HorizontalFilterBar from "@/components/find-instructors/HorizontalFilterBar";
import InstructorList from "@/components/find-instructors/InstructorList";
import { useInstructorFilters } from "@/hooks/useInstructorFilters";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type InstructorCardData = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  price: number;
  cityPrice: number | null;
  tags: string[];
  imageUrl?: string;
};

// Mock data (single placeholder until API integration)
const MOCK_INSTRUCTORS: InstructorCardData[] = [
  {
    id: "placeholder-1",
    name: "Giorgi Beridze",
    rating: 4.9,
    reviewCount: 124,
    specialty: "Nervous Students",
    price: 35,
    cityPrice: 35,
    tags: ["Location: Tbilisi", "Manual", "Georgian & English"],
    imageUrl: undefined
  }
];

const PAGE_SIZE = 20;

function FindInstructorsContent() {
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useInstructorFilters();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentInstructors, setCurrentInstructors] = useState<InstructorCardData[]>(MOCK_INSTRUCTORS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUsingPlaceholder, setIsUsingPlaceholder] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const didInitFromQuery = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const DEFAULT_MIN_PRICE = 40;
  const DEFAULT_MAX_PRICE = 100;

  type SearchResult = {
    id: string;
    title?: string | null;
    name: string;
    image_url?: string | null;
    rating?: number | null;
    located_at?: string | null;
    transmission?: string | null;
    hourly_rate?: number | null;
    city_price?: number | null;
    mode_city_available?: boolean | null;
  };

  const mapResults = (results: SearchResult[]): InstructorCardData[] => {
    return results.map((item) => {
      const tags: string[] = [];

      if (item.located_at) {
        tags.push(`Location: ${item.located_at}`);
      }

      if (item.transmission) {
        tags.push(item.transmission.toLowerCase() === 'manual' ? 'Manual' : 'Automatic');
      }

      // Remove instructor name from specialty/title if it's at the beginning
      let specialty = item.title ?? 'Driving Instructor';
      if (specialty.startsWith(item.name)) {
        specialty = specialty.replace(item.name, '').trim();
        // Remove leading separator like " - "
        specialty = specialty.replace(/^[-–—]\s*/, '').trim();
      }
      if (!specialty || specialty === '') {
        specialty = 'Driving Instructor';
      }

      return {
        id: item.id,
        name: item.name,
        rating: Number(item.rating ?? 0),
        reviewCount: 0,
        specialty: specialty,
        price: Number(item.hourly_rate ?? 0),
        cityPrice: item.city_price ?? null,
        tags,
        imageUrl: item.image_url ?? undefined,
      };
    });
  };

  const buildSearchParams = (currentOffset: number = 0): string => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    if (filters.city) {
      params.set('city', filters.city);
    }
    if (filters.transmissionType) {
      params.set('transmission', filters.transmissionType.toLowerCase());
    }
    if (filters.budget[0] !== DEFAULT_MIN_PRICE) {
      params.set('min_price', String(filters.budget[0]));
    }
    if (filters.budget[1] !== DEFAULT_MAX_PRICE) {
      params.set('max_price', String(filters.budget[1]));
    }
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(currentOffset));

    return params.toString();
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setOffset(0);
    setHasMore(true);

    try {
      const query = buildSearchParams(0);
      const endpoint = `/api/posts/search?${query}`;

      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Search failed (${response.status})`);
      }
      const results = (await response.json()) as SearchResult[];
      const mapped = mapResults(results);

      setCurrentInstructors(mapped.length ? mapped : []);
      setIsUsingPlaceholder(false);
      setHasMore(results.length >= PAGE_SIZE);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to load instructors');
      setCurrentInstructors(MOCK_INSTRUCTORS);
      setIsUsingPlaceholder(true);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextOffset = offset + PAGE_SIZE;

    try {
      const query = buildSearchParams(nextOffset);
      const endpoint = `/api/posts/search?${query}`;

      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Load more failed (${response.status})`);
      }
      const results = (await response.json()) as SearchResult[];
      const mapped = mapResults(results);

      if (mapped.length > 0) {
        setCurrentInstructors((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = mapped.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
        setOffset(nextOffset);
      }
      setHasMore(results.length >= PAGE_SIZE);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to load more instructors');
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters, searchTerm, offset, isLoadingMore, hasMore]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, isLoadingMore]);

  const showBothPrices = true;

  useEffect(() => {
    if (didInitFromQuery.current) return;
    const cityParam = searchParams.get("city");
    const searchParam = searchParams.get("search");

    if (cityParam) {
      updateFilter("city", cityParam);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }

    didInitFromQuery.current = true;
  }, [searchParams, updateFilter]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <SearchHeader
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        <HorizontalFilterBar 
            filters={filters}
            updateFilter={updateFilter}
          onSearch={handleSearch}
            resetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
        />

        {/* Results Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div>
            <h2 className="text-lg font-bold text-gray-900">Available Instructors</h2>
            <p className="text-sm text-gray-500">
              {hasMore 
                ? `Showing ${currentInstructors.length}+ instructors matching your criteria`
                : `Found ${currentInstructors.length} instructors matching your criteria`
              }
            </p>
            {isUsingPlaceholder && (
              <p className="text-xs text-[#F03D3D] font-semibold mt-1">
                Placeholder data (static) — API fallback.
              </p>
            )}
            {isLoading && (
              <p className="text-xs text-gray-400 mt-1">Loading instructors...</p>
            )}
            {errorMessage && (
              <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
            )}
            </div>
        </div>

        <InstructorList instructors={currentInstructors} showBothPrices={showBothPrices} />

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading more instructors...</span>
            </div>
          )}
          {!hasMore && currentInstructors.length > 0 && !isUsingPlaceholder && (
            <p className="text-gray-400 text-sm">You&apos;ve seen all instructors</p>
          )}
        </div>

        {/* Manual load more button */}
        {hasMore && !isLoadingMore && !isLoading && currentInstructors.length > 0 && !isUsingPlaceholder && (
          <div className="flex justify-center pb-8">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-[#5850EC] text-white rounded-xl font-medium hover:bg-[#4840dc] transition-colors shadow-sm"
            >
              Load More Instructors
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FindInstructorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    }>
      <FindInstructorsContent />
    </Suspense>
  );
}
