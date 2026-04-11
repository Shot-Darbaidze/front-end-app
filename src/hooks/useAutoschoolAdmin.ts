"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { getMyAutoschool } from "@/services/autoschoolService";
import { isExpectedAuthTransitionError } from "@/utils/authTransitions";

const SESSION_KEY_PREFIX = "autoschool-admin-v2";
const LOCAL_KEY_PREFIX = "autoschool-admin-v2";

type AutoschoolAdminCachePayload = {
  user_id: string;
  is_admin: boolean;
  school_id: string | null;
  timestamp?: number;
};

function sessionKey(userId: string) {
  return `${SESSION_KEY_PREFIX}:${userId}`;
}

function localKey(userId: string) {
  return `${LOCAL_KEY_PREFIX}:${userId}`;
}

function readCachedAdmin(userId: string): { isAdmin: boolean; schoolId: string | null } | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionRaw = window.sessionStorage.getItem(sessionKey(userId));
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as AutoschoolAdminCachePayload;
      if (typeof parsed?.is_admin === "boolean") {
        return { isAdmin: parsed.is_admin, schoolId: parsed.school_id ?? null };
      }
    }
  } catch {
    window.sessionStorage.removeItem(sessionKey(userId));
  }

  try {
    const localRaw = window.localStorage.getItem(localKey(userId));
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as AutoschoolAdminCachePayload;
      if (typeof parsed?.is_admin === "boolean") {
        return { isAdmin: parsed.is_admin, schoolId: parsed.school_id ?? null };
      }
    }
  } catch {
    window.localStorage.removeItem(localKey(userId));
  }

  return null;
}

function writeCachedAdmin(userId: string, isAdmin: boolean, schoolId: string | null) {
  if (typeof window === "undefined") return;

  const payload: AutoschoolAdminCachePayload = {
    user_id: userId,
    is_admin: isAdmin,
    school_id: schoolId,
    timestamp: Date.now(),
  };

  window.sessionStorage.setItem(sessionKey(userId), JSON.stringify(payload));
  window.localStorage.setItem(localKey(userId), JSON.stringify(payload));
}

export function useAutoschoolAdmin() {
  const { getToken, isLoaded } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const userId = user?.id;

  // Read from cache synchronously on the render where userId becomes available.
  const fromCache = useMemo(() => {
    if (!userId || typeof window === "undefined") return null;
    return readCachedAdmin(userId);
  }, [userId]);

  // API result — keyed by userId so stale data from a previous account is never used
  const [fromApi, setFromApi] = useState<{ userId: string; isAdmin: boolean; schoolId: string | null } | null>(null);

  const relevantFromApi = fromApi?.userId === userId ? fromApi : null;
  const resolved = relevantFromApi ?? fromCache;

  const schoolId = resolved?.isAdmin ? (resolved?.schoolId ?? null) : null;
  const isAutoschoolAdmin = Boolean(resolved?.isAdmin);
  const isLoading = !isLoaded || !isUserLoaded || (!!userId && resolved === null);

  useEffect(() => {
    let isMounted = true;

    const resolveAutoschoolAdmin = async () => {
      if (!isLoaded || !isUserLoaded || !userId) return;

      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        const school = await getMyAutoschool(token);
        const nextSchoolId = school?.id ?? null;
        writeCachedAdmin(userId, Boolean(nextSchoolId), nextSchoolId);

        if (isMounted) setFromApi({ userId, isAdmin: Boolean(nextSchoolId), schoolId: nextSchoolId });
      } catch (err) {
        if (!isExpectedAuthTransitionError(err)) {
          console.error("[useAutoschoolAdmin] API error:", err);
        }
        if (isMounted && resolved === null) {
          setFromApi({ userId, isAdmin: false, schoolId: null });
        }
      }
    };

    void resolveAutoschoolAdmin();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isUserLoaded, userId]);

  return {
    schoolId,
    isAutoschoolAdmin,
    isLoading,
  };
}
