/**
 * Type definitions for Find Instructors feature
 */

export interface InstructorCardData {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  price: number;
  cityPrice: number | null;
  yardPrice: number | null;
  tags: string[];
  imageUrl?: string;
}

export interface SearchResult {
  id: string;
  title?: string | null;
  name: string;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  located_at?: string | null;
  license_category?: string | null;
  transmission?: string | null;
  hourly_rate?: number | null;
  city_price?: number | null;
  yard_price?: number | null;
}
