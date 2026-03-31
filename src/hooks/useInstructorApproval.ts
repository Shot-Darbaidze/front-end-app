"use client";

import { useEffect, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";

const APPROVAL_SESSION_KEY_PREFIX = "instructor-approval";
const APPROVAL_LOCAL_KEY_PREFIX = "instructor-approval-v2";

type ApprovalPayload = {
  user_id: string;
  is_approved?: boolean | null;
  instructor_type?: string | null;
  timestamp?: number;
};

function sessionKey(userId: string) {
  return `${APPROVAL_SESSION_KEY_PREFIX}:${userId}`;
}

function localKey(userId: string) {
  return `${APPROVAL_LOCAL_KEY_PREFIX}:${userId}`;
}

function readCachedApproval(userId: string): { isApproved: boolean; instructorType: string | null } | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionRaw = window.sessionStorage.getItem(sessionKey(userId));
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as ApprovalPayload;
      if (typeof parsed?.is_approved === "boolean") {
        return { isApproved: parsed.is_approved, instructorType: parsed.instructor_type ?? null };
      }
    }
  } catch {
    window.sessionStorage.removeItem(sessionKey(userId));
  }

  try {
    const localRaw = window.localStorage.getItem(localKey(userId));
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as ApprovalPayload;
      if (typeof parsed?.is_approved === "boolean") {
        return { isApproved: parsed.is_approved, instructorType: parsed.instructor_type ?? null };
      }
    }
  } catch {
    window.localStorage.removeItem(localKey(userId));
  }

  return null;
}

function writeCachedApproval(userId: string, isApproved: boolean, instructorType: string | null) {
  if (typeof window === "undefined") return;

  const payload: ApprovalPayload = { user_id: userId, is_approved: isApproved, instructor_type: instructorType, timestamp: Date.now() };
  window.sessionStorage.setItem(sessionKey(userId), JSON.stringify(payload));
  window.localStorage.setItem(localKey(userId), JSON.stringify(payload));
}

export function useInstructorApproval() {
  const { getToken, isLoaded } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const userId = user?.id;

  useEffect(() => {
    let isMounted = true;

    const checkApproval = async () => {
      if (!isLoaded || !isUserLoaded) {
        return;
      }

      if (!userId) {
        if (isMounted) {
          setIsInstructor(false);
          setIsEmployee(false);
          setIsLoading(false);
        }
        return;
      }

      const cached = readCachedApproval(userId);
      if (cached !== null && isMounted) {
        setIsInstructor(cached.isApproved);
        setIsEmployee(cached.instructorType === "employee");
        setIsLoading(false);
      }

      if (isMounted && cached === null) {
        setIsLoading(true);
      }

      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setIsInstructor(false);
            setIsEmployee(false);
            setIsLoading(false);
          }
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (isMounted) {
            setIsInstructor(false);
            setIsEmployee(false);
            setIsLoading(false);
          }
          return;
        }

        const result: ApprovalPayload = await response.json();
        const approved = Boolean(result?.is_approved);
        const instrType = (result as ApprovalPayload & { instructor_type?: string }).instructor_type ?? null;
        writeCachedApproval(userId, approved, instrType);

        if (isMounted) {
          setIsInstructor(approved);
          setIsEmployee(instrType === "employee");
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void checkApproval();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isUserLoaded, userId]);

  return { isInstructor, isEmployee, isLoading };
}
