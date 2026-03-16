"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function CityExamRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Extract locale from current path (e.g., /en/city-exam -> en)
    const locale = pathname.split("/")[1];
    router.replace(`/${locale}/city-exam/simulations`);
  }, [router, pathname]);

  return null;
}
