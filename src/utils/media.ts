import { API_CONFIG } from "@/config/constants";

/**
 * Resolve potentially relative media URLs returned by backend APIs.
 */
export function resolveMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = API_CONFIG.BASE_URL;
  if (!baseUrl) return trimmed;

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
}
