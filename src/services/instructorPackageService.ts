import type {
  CoursePackage,
  CoursePackageCreateInput,
  CoursePackageUpdateInput,
} from "@/services/autoschoolService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(
  path: string,
  init: RequestInit,
  token: string,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? body?.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function createMyPackage(
  data: CoursePackageCreateInput,
  token: string,
): Promise<CoursePackage> {
  return apiFetch<CoursePackage>(
    "/api/posts/mine/packages",
    {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateMyPackage(
  packageId: string,
  data: CoursePackageUpdateInput,
  token: string,
): Promise<CoursePackage> {
  return apiFetch<CoursePackage>(
    `/api/posts/mine/packages/${packageId}`,
    {
      method: "PATCH",
      cache: "no-store",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function deleteMyPackage(
  packageId: string,
  token: string,
): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(
    `/api/posts/mine/packages/${packageId}`,
    {
      method: "DELETE",
      cache: "no-store",
    },
    token,
  );
}