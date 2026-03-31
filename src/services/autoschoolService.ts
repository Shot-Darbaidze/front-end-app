/**
 * Autoschool API service — typed fetch helpers for the autoschool endpoints.
 *
 * All paths are relative to NEXT_PUBLIC_API_URL (or the backend root).
 * Keeping the base URL configurable means zero-cost swapping between
 * local dev and production.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CoursePackage {
  id: string;
  name: string;
  lessons: number;
  percentage: number;
  popular: boolean;
  description?: string | null;
  /** Lesson mode: "city" or "yard" */
  mode: string;
  /** Transmission scope: "manual", "automatic", or "both" */
  transmission: string;
}

export interface WorkingHours {
  id: string;
  day_label: string;
  hours_label?: string | null;
  is_closed: boolean;
  sort_order: number;
}

export interface WorkingHoursInput {
  day_label: string;
  hours_label?: string | null;
  is_closed: boolean;
}

export interface SchoolInstructor {
  id: string;
  instructor_id: string;
  title: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  rating?: number | null;
  transmission?: string | null;
  language_skills?: string | null;
  /** Effective city price derived from school-level pricing */
  city_price?: number | null;
  /** Effective yard price derived from school-level pricing */
  yard_price?: number | null;
  instructor_type: "independent" | "employee";
  status: string;
}

export interface AutoschoolDetail {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  google_maps_url?: string | null;
  /** CSV e.g. "KA,EN,RU" */
  languages?: string | null;
  /** CSV e.g. "Skoda Rapid,Volkswagen Jetta" */
  fleet?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  image_urls?: string[];
  is_approved: boolean;
  status: string;
  // School-level pricing
  manual_city_price?: number | null;
  manual_yard_price?: number | null;
  automatic_city_price?: number | null;
  automatic_yard_price?: number | null;
  packages: CoursePackage[];
  working_hours: WorkingHours[];
  instructors: SchoolInstructor[];
  created_at: string;
  updated_at: string;
}

export interface AutoschoolSummary {
  id: string;
  name: string;
  city?: string | null;
  logo_url?: string | null;
  rating?: number | null;
  instructor_count: number;
  package_count: number;
  languages?: string | null;
}

export interface AutoschoolInvite {
  id: string;
  autoschool_id: string;
  autoschool_name: string;
  autoschool_city?: string | null;
  autoschool_logo_url?: string | null;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? body?.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** List approved autoschools. */
export async function getAutoschools(params?: {
  city?: string;
  limit?: number;
  offset?: number;
}): Promise<AutoschoolSummary[]> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set("city", params.city);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  return apiFetch<AutoschoolSummary[]>(`/api/autoschools?${qs}`);
}

/** Fetch a single autoschool by UUID. Returns null on 404. */
export async function getAutoschool(id: string): Promise<AutoschoolDetail | null> {
  try {
    return await apiFetch<AutoschoolDetail>(`/api/autoschools/${id}`);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}

/** Submit an autoschool application (multipart form). */
export async function submitAutoschoolApplication(
  formData: FormData,
  token: string,
): Promise<{ id: string; name: string; is_approved: boolean }> {
  return apiFetch(
    "/api/autoschools/apply",
    { method: "POST", body: formData },
    token,
  );
}

/** Fetch the autoschool the current user administers. Returns null if none. */
export async function getMyAutoschool(token: string): Promise<AutoschoolSummary | null> {
  try {
    return await apiFetch<AutoschoolSummary>("/api/me/autoschool", {}, token);
  } catch {
    return null;
  }
}

/** Update autoschool details (admin only). */
export async function updateAutoschool(
  id: string,
  data: Record<string, string | null>,
  token: string,
): Promise<AutoschoolDetail> {
  return apiFetch(
    `/api/autoschools/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

/** Update school-level pricing (4 price fields). */
export async function updateAutoschoolPricing(
  schoolId: string,
  pricing: {
    manual_city_price?: number | null;
    manual_yard_price?: number | null;
    automatic_city_price?: number | null;
    automatic_yard_price?: number | null;
  },
  token: string,
): Promise<AutoschoolDetail> {
  return apiFetch(
    `/api/autoschools/${schoolId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricing),
    },
    token,
  );
}

/** Upload/remove logo, cover, and gallery images (admin only). */
export async function updateAutoschoolMedia(
  schoolId: string,
  formData: FormData,
  token: string,
): Promise<AutoschoolDetail> {
  const res = await fetch(`${API_BASE}/api/autoschools/${schoolId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? body?.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

/** Replace autoschool working hours rows (admin only). */
export async function updateAutoschoolWorkingHours(
  schoolId: string,
  hours: WorkingHoursInput[],
  token: string,
): Promise<Array<{ id: string; day_label: string }>> {
  return apiFetch(
    `/api/autoschools/${schoolId}/hours`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hours),
    },
    token,
  );
}

/** Send an invite to a user (admin only). */
export async function inviteInstructor(
  schoolId: string,
  targetClerkUserId: string,
  token: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(
    `/api/autoschools/${schoolId}/invite/${targetClerkUserId}`,
    { method: "POST" },
    token,
  );
}

/** Get pending autoschool invites for the authenticated user. */
export async function getMyInvites(token: string): Promise<AutoschoolInvite[]> {
  return apiFetch<AutoschoolInvite[]>("/api/me/autoschool-invites", {}, token);
}

/** Accept or decline an invite. */
export async function respondToInvite(
  inviteId: string,
  accept: boolean,
  token: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(
    `/api/me/autoschool-invites/${inviteId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    },
    token,
  );
}

/** List all instructors for a school (admin view). */
export async function getSchoolInstructors(
  schoolId: string,
  token: string,
): Promise<SchoolInstructor[]> {
  return apiFetch<SchoolInstructor[]>(
    `/api/autoschools/${schoolId}/instructors`,
    {},
    token,
  );
}

/** Kick (remove) an instructor from the autoschool.
 *  Returns 400 if the instructor has upcoming booked lessons. */
export async function kickInstructor(
  schoolId: string,
  instructorPostId: string,
  token: string,
): Promise<{ detail: string }> {
  return apiFetch(
    `/api/autoschools/${schoolId}/instructors/${instructorPostId}`,
    { method: "DELETE" },
    token,
  );
}

/** Update an instructor's status (admin only). Prices are set at school level. */
export async function updateSchoolInstructor(
  schoolId: string,
  instructorPostId: string,
  data: { status?: "active" | "inactive" },
  token: string,
): Promise<SchoolInstructor> {
  return apiFetch(
    `/api/autoschools/${schoolId}/instructors/${instructorPostId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Package CRUD (individual, production-safe)
// ─────────────────────────────────────────────────────────────────────────────

export interface CoursePackageCreateInput {
  name: string;
  lessons: number;
  percentage: number;
  popular?: boolean;
  description?: string | null;
  /** Lesson mode: "city" or "yard" */
  mode: string;
  /** Transmission scope: "manual", "automatic", or "both" */
  transmission: string;
}

export interface CoursePackageUpdateInput {
  name?: string;
  lessons?: number;
  percentage?: number;
  popular?: boolean;
  description?: string | null;
  mode?: string;
  transmission?: string;
}

export async function createPackage(
  schoolId: string,
  data: CoursePackageCreateInput,
  token: string,
): Promise<CoursePackage> {
  return apiFetch(
    `/api/autoschools/${schoolId}/packages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updatePackage(
  schoolId: string,
  packageId: string,
  data: CoursePackageUpdateInput,
  token: string,
): Promise<CoursePackage> {
  return apiFetch(
    `/api/autoschools/${schoolId}/packages/${packageId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function deletePackage(
  schoolId: string,
  packageId: string,
  token: string,
): Promise<{ detail: string }> {
  return apiFetch(
    `/api/autoschools/${schoolId}/packages/${packageId}`,
    { method: "DELETE" },
    token,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Autoschool finances
// ─────────────────────────────────────────────────────────────────────────────

export interface AutoschoolInstructorFinances {
  post_id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  total_earned: number;
  available_to_withdraw: number;
  pending_release: number;
}

export interface AutoschoolFinancesData {
  total_earned: number;
  total_withdrawn: number;
  available_to_withdraw: number;
  pending_release: number;
  instructors: AutoschoolInstructorFinances[];
}

export async function getAutoschoolFinances(
  schoolId: string,
  token: string,
): Promise<AutoschoolFinancesData> {
  return apiFetch<AutoschoolFinancesData>(
    `/api/autoschools/${schoolId}/finances`,
    {},
    token,
  );
}

export interface AutoschoolWithdrawResult {
  withdrawn_amount: number;
  withdrawn_bookings_count: number;
  instructors_processed: number;
  status: string;
}

export async function withdrawAutoschoolEarnings(
  schoolId: string,
  instructorPostIds?: string[],
  token?: string,
): Promise<AutoschoolWithdrawResult> {
  return apiFetch(
    `/api/autoschools/${schoolId}/finances/withdraw`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructor_post_ids: instructorPostIds ?? null }),
    },
    token,
  );
}
