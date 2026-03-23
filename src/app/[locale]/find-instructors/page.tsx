"use client";

import { useEffect } from "react";
import SearchHeader from "@/components/find-instructors/SearchHeader";
import HorizontalFilterBar from "@/components/find-instructors/HorizontalFilterBar";
import InstructorList from "@/components/find-instructors/InstructorList";
import EmptyState from "@/components/find-instructors/EmptyState";
import InstructorCardSkeleton from "@/components/find-instructors/InstructorCardSkeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useFindInstructors } from "@/hooks/useFindInstructors";
import { LIMITS } from "@/config/constants";
import { trackInstructorClick } from "@/utils/analytics";
import { useLanguage } from "@/contexts/LanguageContext";

function FindInstructorsContent() {
  const { language } = useLanguage();
  const isKa = language === "ka";
  const {
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
    handleSearch,
    handleResetFilters,
    handleSortChange,
    handleFilterUpdate,
    goToPage,
  } = useFindInstructors();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#y=")) return;

    const targetY = Number(hash.slice(3));
    if (!Number.isFinite(targetY) || targetY < 0) return;

    let attempts = 0;
    const maxAttempts = 12;

    const tryRestoreScroll = () => {
      window.scrollTo({ top: targetY, behavior: "auto" });

      attempts += 1;
      if (attempts >= maxAttempts || window.scrollY >= targetY || document.body.scrollHeight > targetY + window.innerHeight) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        return;
      }

      window.setTimeout(tryRestoreScroll, 75);
    };

    window.setTimeout(tryRestoreScroll, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <SearchHeader
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
        isLoading={isLoading}
        instructorType={filters.instructorType}
        onInstructorTypeChange={(type) => handleFilterUpdate('instructorType', type)}
      />
      
      <div id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <HorizontalFilterBar
            filters={filters}
            updateFilter={handleFilterUpdate}
            resetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            isLoading={isLoading}
        />

        {/* Results Header */}
        {hasSearched && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isKa ? "ხელმისაწვდომი ინსტრუქტორები" : "Available Instructors"}</h2>
              <p className="text-sm text-gray-500">
                {totalCount !== null
                  ? isKa
                    ? `ნაპოვნია ${totalCount >= LIMITS.MAX_PAGE_SIZE ? `${LIMITS.MAX_PAGE_SIZE}+` : totalCount} შედეგი თქვენი ფილტრების მიხედვით`
                    : `Found ${totalCount >= LIMITS.MAX_PAGE_SIZE ? `${LIMITS.MAX_PAGE_SIZE}+` : totalCount} instructor${totalCount !== 1 ? 's' : ''} matching your criteria`
                  : isKa ? 'იფილტრება...' : 'Filtering...'
                }
              </p>
              {errorMessage && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-red-500">{errorMessage}</p>
                  <button
                    onClick={handleSearch}
                    className="text-xs font-medium text-[#F03D3D] hover:text-[#d62f2f] underline"
                  >
                    {isKa ? "ხელახლა ცდა" : "Retry"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <InstructorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && hasSearched && currentInstructors.length === 0 && (
          <EmptyState
            title={isKa ? "ინსტრუქტორები ვერ მოიძებნა" : "No instructors found"}
            description={isKa ? "სცადე ფილტრების ან საძიებო პარამეტრების შეცვლა, რათა მეტი შედეგი ნახო." : "Try adjusting your filters or search criteria to find more instructors."}
            onReset={handleResetFilters}
            showResetButton={hasActiveFilters || searchTerm.length > 0}
          />
        )}

        {/* Results List */}
        {!isLoading && currentInstructors.length > 0 && (
          <InstructorList 
            instructors={currentInstructors} 
            onInstructorClick={trackInstructorClick}
          />
        )}

        {/* Pagination */}
        {hasSearched && !isLoading && currentInstructors.length > 0 && (
          <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={isKa ? "წინა გვერდზე გადასვლა" : "Go to previous page"}
            >
              <span className="hidden sm:inline">{isKa ? "წინა" : "Previous"}</span>
              <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            {(() => {
              const start = Math.max(1, currentPage - 1);
              const end = hasMore ? currentPage + 1 : currentPage;
              const pages: number[] = [];
              for (let p = start; p <= end; p++) pages.push(p);

              const showFirst = start > 1;
              const showEllipsis = start > 2;

              return (
                <>
                  {showFirst && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label={isKa ? "გადასვლა გვერდზე 1" : "Go to page 1"}
                      >
                        1
                      </button>
                      {showEllipsis && (
                        <span className="w-8 text-center text-gray-400 text-sm select-none">…</span>
                      )}
                    </>
                  )}
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      aria-label={isKa ? `გადასვლა გვერდზე ${page}` : `Go to page ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-bold transition-colors ${
                        page === currentPage
                          ? 'bg-[#F03D3D] text-white shadow-md shadow-red-200'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </>
              );
            })()}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={!hasMore}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={isKa ? "შემდეგ გვერდზე გადასვლა" : "Go to next page"}
            >
              <span className="hidden sm:inline">{isKa ? "შემდეგი" : "Next"}</span>
              <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default function FindInstructorsPage() {
  return (
    <ErrorBoundary>
      <FindInstructorsContent />
    </ErrorBoundary>
  );
}
