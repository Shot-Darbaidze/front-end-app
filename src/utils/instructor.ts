/**
 * Instructor utility functions
 * Centralized logic for instructor-related operations
 */

/**
 * Builds a full name from first and last name parts
 * @param firstName - Instructor's first name
 * @param lastName - Instructor's last name
 * @param fallback - Fallback text if no name parts available
 * @returns Formatted full name or fallback
 */
export const buildInstructorName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback = "Instructor"
): string => {
  const parts = [firstName, lastName]
    .map((part) => (part || "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(" ") : fallback;
};

/**
 * Extracts city name from location string
 * @param location - Full location string (e.g., "Tbilisi, Georgia")
 * @returns City name or fallback
 */
export const extractCityName = (
  location?: string | null,
  fallback = "Location unavailable"
): string => {
  if (!location) return fallback;
  return location.split(",")[0].trim() || fallback;
};

/**
 * Formats language codes into readable labels
 */
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ka: "Georgian",
  ru: "Russian",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  tr: "Turkish",
  ar: "Arabic",
};

/**
 * Normalizes comma-separated language codes
 * @param value - Comma-separated language codes
 * @returns Array of normalized lowercase codes
 */
export const normalizeLanguageCodes = (value?: string | null): string[] =>
  (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

/**
 * Formats language codes into readable names
 * @param value - Comma-separated language codes
 * @returns Array of readable language names
 */
export const formatLanguages = (value?: string | null): string[] =>
  normalizeLanguageCodes(value).map((code) => LANGUAGE_LABELS[code] || code);

/**
 * Picks the first non-null price from an array of prices
 * @param values - Array of potential prices
 * @returns First valid price or null
 */
export const pickFirstValidPrice = (
  values: Array<number | null | undefined>
): number | null => {
  const found = values.find((value) => value !== null && value !== undefined);
  return found !== undefined && found !== null ? Number(found) : null;
};

/**
 * Builds vehicle display strings
 * @param brand - Vehicle brand
 * @param year - Vehicle year
 * @returns Array of vehicle info strings
 */
export const buildVehicleInfo = (
  brand?: string | null,
  year?: number | null
): string[] => {
  const brandStr = (brand || "").trim();
  const yearStr = year ? String(year) : "";
  
  if (brandStr && yearStr) return [`${brandStr} (${yearStr})`];
  if (brandStr) return [brandStr];
  if (yearStr) return [`Vehicle (${yearStr})`];
  return ["Vehicle info unavailable"];
};
