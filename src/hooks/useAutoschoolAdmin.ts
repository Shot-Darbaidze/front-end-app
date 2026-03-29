"use client";

import { useEffect, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { getMyAutoschool } from "@/services/autoschoolService";

const SESSION_KEY_PREFIX = "autoschool-admin";
const LOCAL_KEY_PREFIX = "autoschool-admin-v1";

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
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const userId = user?.id;

  useEffect(() => {
    let isMounted = true;

    const resolveAutoschoolAdmin = async () => {
      if (!isLoaded || !isUserLoaded) return;

      if (!userId) {
        if (isMounted) {
          setSchoolId(null);
          setIsLoading(false);
        }
        return;
      }

      const cached = readCachedAdmin(userId);
      if (cached && isMounted) {
        setSchoolId(cached.schoolId);
        setIsLoading(false);
      }

      if (!cached && isMounted) {
        setIsLoading(true);
      }

      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setSchoolId(null);
            setIsLoading(false);
          }
          return;
        }

        const school = await getMyAutoschool(token);
        const nextSchoolId = school?.id ?? null;
        writeCachedAdmin(userId, Boolean(nextSchoolId), nextSchoolId);

        if (isMounted) {
          setSchoolId(nextSchoolId);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setSchoolId(null);
          setIsLoading(false);
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
    isAutoschoolAdmin: Boolean(schoolId),
    isLoading,
  };
}
