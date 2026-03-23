"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface BackToInstructorsButtonProps {
  fallbackHref: string;
  className?: string;
  label?: string;
}

const RETURN_URL_KEY = "lastFindInstructorsReturnUrl";

export default function BackToInstructorsButton({
  fallbackHref,
  className = "",
  label,
}: BackToInstructorsButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isKa = pathname?.startsWith("/ka");

  const handleBack = () => {
    const storedHref = typeof window !== "undefined"
      ? window.sessionStorage.getItem(RETURN_URL_KEY)
      : null;

    if (storedHref && storedHref.startsWith("/")) {
      router.push(storedHref);
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button onClick={handleBack} className={className} type="button">
      <ChevronLeft className="w-4 h-4 mr-1" />
      {label ?? (isKa ? "ინსტრუქტორებთან დაბრუნება" : "Back to Instructors")}
    </button>
  );
}
