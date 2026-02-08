import { useState, useCallback, useMemo } from 'react';
import { PRICING } from '@/config/constants';

export interface FilterOptions {
  budget: [number, number];
  transmissionType: string;
  city: string;
}

const initialFilters: FilterOptions = {
  budget: [PRICING.MIN_PRICE_FILTER, PRICING.MAX_PRICE_FILTER],
  transmissionType: '',
  city: '',
};

export const useInstructorFilters = () => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.budget[0] !== initialFilters.budget[0] ||
      filters.budget[1] !== initialFilters.budget[1] ||
      filters.transmissionType !== '' ||
      filters.city !== ''
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
};
