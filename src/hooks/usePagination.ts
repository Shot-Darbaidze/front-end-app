import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, pageSize = 12) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => (prev > 1 ? prev - 1 : 1));
  }, []);

  const getTotalPages = useCallback((totalItems: number) => {
    return Math.ceil(totalItems / pageSize);
  }, [pageSize]);

  const getOffset = useCallback(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    handlePageChange,
    goToNextPage,
    goToPreviousPage,
    getTotalPages,
    getOffset,
  };
};
