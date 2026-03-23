import { useState, useCallback, useMemo } from 'react';
import { PRICING } from '@/config/constants';

export interface FilterOptions {
  budget: [number, number];
  transmissionType: string;
  city: string;
  instructorType: 'all' | 'solo' | 'school';
}

const getInitialFilters = (): FilterOptions => ({
  budget: [PRICING.MIN_PRICE_FILTER, PRICING.MAX_PRICE_FILTER],
  transmissionType: '',
  city: '',
  instructorType: 'all',
});

export const useInstructorFilters = (initialValues?: Partial<FilterOptions>) => {
  const [filters, setFilters] = useState<FilterOptions>(() => ({
    ...getInitialFilters(),
    ...initialValues,
  }));

  const updateFilter = useCallback(<K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getInitialFilters());
  }, []);

  const hasActiveFilters = useMemo(() => {
    const defaultFilters = getInitialFilters();
    return (
      filters.budget[0] !== defaultFilters.budget[0] ||
      filters.budget[1] !== defaultFilters.budget[1] ||
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
