/**
 * Analytics utility for tracking user interactions
 * Can be integrated with Google Analytics, Mixpanel, etc.
 */

import { logger } from './secureLogger';

type AnalyticsEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
};

/**
 * Track an analytics event
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
): void => {
  if (typeof window === 'undefined') return;

  // Log in development using secure logger
  if (process.env.NODE_ENV === 'development') {
    logger.info('Analytics Event:', { eventName, ...properties });
  }

  // TODO: Integrate with your analytics service
  // Examples:
  // - Google Analytics: gtag('event', eventName, properties)
  // - Mixpanel: mixpanel.track(eventName, properties)
  // - Segment: analytics.track(eventName, properties)
  
  try {
    // Google Analytics integration (if available)
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, properties);
    }
  } catch (error) {
    // Silently fail - don't break app if analytics fails
  }
};

/**
 * Track page view
 */
export const trackPageView = (url: string): void => {
  trackEvent('page_view', { page_path: url });
};

/**
 * Track search events
 */
export const trackSearch = (searchTerm: string, filters: Record<string, any>): void => {
  trackEvent('search', {
    search_term: searchTerm,
    filters: JSON.stringify(filters),
  });
};

/**
 * Track filter changes
 */
export const trackFilterChange = (filterName: string, filterValue: any): void => {
  trackEvent('filter_change', {
    filter_name: filterName,
    filter_value: String(filterValue),
  });
};

/**
 * Track instructor card clicks
 */
export const trackInstructorClick = (instructorId: string, position: number): void => {
  trackEvent('instructor_click', {
    instructor_id: instructorId,
    list_position: position,
  });
};

/**
 * Track favorite actions
 */
export const trackFavoriteToggle = (instructorId: string, isFavorited: boolean): void => {
  trackEvent(isFavorited ? 'favorite_add' : 'favorite_remove', {
    instructor_id: instructorId,
  });
};
