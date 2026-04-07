"use client";

import { useEffect, useMemo, useState } from "react";
import BookingSidebar, {
  type BookingSidebarLessonMode,
} from "@/components/instructor-profile/BookingSidebar";
import InstructorPackagesCard, {
  type CoursePackage,
  type InstructorPrices,
} from "@/components/instructor-profile/InstructorPackagesCard";
import { getPackagePriceBreakdown, normalizeInstructorTransmission } from "@/utils/packages";

interface InstructorBookingPanelProps {
  cityPrice: number | null;
  yardPrice: number | null;
  instructorId: string | number;
  autoschoolId?: string | null;
  allowedModes?: "city" | "yard" | "both" | null;
  packages: CoursePackage[];
  pricing: InstructorPrices;
}

function normalizeMode(mode?: string | null): BookingSidebarLessonMode {
  return mode === "yard" ? "yard" : "city";
}

function getPackageLessonPrice(
  pricing: InstructorPrices,
  mode: BookingSidebarLessonMode,
): number | null {
  const transmission = normalizeInstructorTransmission(pricing.transmission);

  if (mode === "city") {
    return transmission === "automatic"
      ? (pricing.automatic_city_price ?? pricing.manual_city_price ?? null)
      : (pricing.manual_city_price ?? pricing.automatic_city_price ?? null);
  }

  return transmission === "automatic"
    ? (pricing.automatic_yard_price ?? pricing.manual_yard_price ?? null)
    : (pricing.manual_yard_price ?? pricing.automatic_yard_price ?? null);
}

export default function InstructorBookingPanel({
  cityPrice,
  yardPrice,
  instructorId,
  autoschoolId,
  allowedModes,
  packages,
  pricing,
}: InstructorBookingPanelProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  // Respect allowed_modes when choosing the default mode.
  // null/undefined = NOT bookable; only explicit 'both'/'city'/'yard' enables booking.
  const cityAllowed = allowedModes === "both" || allowedModes === "city";
  const fallbackMode: BookingSidebarLessonMode =
    cityPrice != null && cityAllowed ? "city" : "yard";
  const [selectedMode, setSelectedMode] = useState<BookingSidebarLessonMode>(
    selectedPackage ? normalizeMode(selectedPackage.mode) : fallbackMode,
  );

  useEffect(() => {
    if (!selectedPackage) {
      return;
    }

    const packageMode = normalizeMode(selectedPackage.mode);
    setSelectedMode((currentMode) => currentMode === packageMode ? currentMode : packageMode);
  }, [selectedPackage]);

  useEffect(() => {
    if (selectedPackageId && !packages.some((pkg) => pkg.id === selectedPackageId)) {
      setSelectedPackageId(null);
    }
  }, [packages, selectedPackageId]);

  const selectedPackagePricing = useMemo(() => {
    if (!selectedPackage) {
      return null;
    }

    return getPackagePriceBreakdown(
      getPackageLessonPrice(pricing, normalizeMode(selectedPackage.mode)),
      selectedPackage.lessons,
      selectedPackage.percentage,
    );
  }, [pricing, selectedPackage]);

  return (
    <>
      <BookingSidebar
        cityPrice={cityPrice}
        yardPrice={yardPrice}
        instructorId={instructorId}
        autoschoolId={autoschoolId}
        allowedModes={allowedModes}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        selectedPackage={selectedPackage}
        originalPricePerLesson={selectedPackagePricing?.baseLessonPrice ?? null}
        discountedPricePerLesson={selectedPackagePricing?.discountedLessonPrice ?? null}
        onClearPackage={() => setSelectedPackageId(null)}
      />
      {packages.length > 0 && (
        <InstructorPackagesCard
          packages={packages}
          instructorId={instructorId}
          autoschoolId={autoschoolId}
          post={pricing}
          selectedPackageId={selectedPackageId}
          onSelectPackage={setSelectedPackageId}
        />
      )}
    </>
  );
}