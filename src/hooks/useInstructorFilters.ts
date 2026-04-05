import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_LICENSE_CATEGORY, PRICING, type LicenseCategory } from '@/config/constants';

export interface FilterOptions {
  budget: [number, number];
  transmissionType: string;
  languageCodes: string[];
  licenseCategory: LicenseCategory;
  city: string;
  instructorType: 'all' | 'solo' | 'school';
  mode: '' | 'city' | 'yard';
}

const getInitialFilters = (): FilterOptions => ({
  budget: [PRICING.MIN_PRICE_FILTER, PRICING.MAX_PRICE_FILTER],
  transmissionType: '',
  languageCodes: [],
  licenseCategory: DEFAULT_LICENSE_CATEGORY,
  city: '',
  instructorType: 'all',
  mode: '',
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
      filters.languageCodes.length > 0 ||
      filters.licenseCategory !== defaultFilters.licenseCategory ||
      filters.city !== '' ||
      filters.mode !== ''
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
};
