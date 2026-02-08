import { useMemo } from 'react';

/**
 * Hook for memoized filtering operations
 * Prevents expensive filtering recalculations on every render
 */
export function useMemoFilter<T>(
  items: T[],
  predicate: (item: T) => boolean,
  dependencies: any[] = [items]
) {
  return useMemo(() => items.filter(predicate), dependencies);
}

/**
 * Hook for memoized search with multiple fields
 */
export function useMemoSearch<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
) {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
      searchFields.some(field =>
        String(item[field]).toLowerCase().includes(lowerSearchTerm)
      )
    );
  }, [items, searchTerm, searchFields]);
}

/**
 * Hook for memoized sorting
 */
export function useMemoSort<T extends Record<string, any>>(
  items: T[],
  sortKey: keyof T | null,
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  return useMemo(() => {
    if (!sortKey) return items;
    
    const sorted = [...items].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [items, sortKey, sortOrder]);
}

/**
 * Hook for memoized grouping
 */
export function useMemoGroup<T extends Record<string, any>>(
  items: T[],
  groupBy: keyof T
) {
  return useMemo(() => {
    const grouped: Record<string, T[]> = {};
    
    items.forEach(item => {
      const key = String(item[groupBy]);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  }, [items, groupBy]);
}

/**
 * Hook for memoized calculations (e.g., totals, averages)
 */
export function useMemoCalculate<T extends Record<string, any>, R>(
  items: T[],
  calculator: (items: T[]) => R
) {
  return useMemo(() => calculator(items), [items, calculator]);
}
