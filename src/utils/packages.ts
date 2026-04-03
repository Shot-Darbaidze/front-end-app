export const MIN_PACKAGE_DISCOUNT_PERCENTAGE = 1;
export const MAX_PACKAGE_DISCOUNT_PERCENTAGE = 99;
export const DEFAULT_PACKAGE_DISCOUNT_PERCENTAGE = 10;

export type PackageTransmission = "manual" | "automatic" | "both";

export type PackagePriceBreakdown = {
  baseLessonPrice: number;
  discountedLessonPrice: number;
  baseTotalPrice: number;
  discountedTotalPrice: number;
};

function normalizePercentage(value?: number | string | null): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(Number(value).toFixed(2));
}

export function normalizeInstructorTransmission(value?: string | null): "manual" | "automatic" {
  const normalized = (value || "").trim().toLowerCase();
  return normalized.startsWith("auto") ? "automatic" : "manual";
}

export function normalizePackageTransmission(value?: string | null): PackageTransmission {
  const normalized = (value || "manual").trim().toLowerCase();
  if (normalized === "automatic" || normalized === "both") {
    return normalized;
  }

  return "manual";
}

export function isPackageTransmissionCompatible(
  packageTransmission?: string | null,
  instructorTransmission?: string | null,
  options?: { allowBoth?: boolean },
): boolean {
  const normalizedPackage = normalizePackageTransmission(packageTransmission);
  const normalizedInstructor = normalizeInstructorTransmission(instructorTransmission);

  if (normalizedPackage === "both") {
    return options?.allowBoth !== false;
  }

  return normalizedPackage === normalizedInstructor;
}

export function clampPackageDiscountPercentage(value: number): number {
  return Math.min(
    MAX_PACKAGE_DISCOUNT_PERCENTAGE,
    Math.max(MIN_PACKAGE_DISCOUNT_PERCENTAGE, Math.round(value)),
  );
}

export function getPackageDiscountPercentage(value?: number | null): number | null {
  const normalized = normalizePercentage(value);
  if (normalized == null || normalized <= 0) {
    return null;
  }

  return normalized;
}

export function formatPackageAdjustment(value?: number | null): string | null {
  const adjustment = getPackageDiscountPercentage(value);
  if (adjustment == null) {
    return null;
  }

  const normalized = Number.isInteger(adjustment)
    ? adjustment.toFixed(0)
    : adjustment.toFixed(2).replace(/\.?0+$/, "");

  return `-${normalized}%`;
}

export function applyPackagePercentage(basePrice: number, value?: number | null): number {
  const discount = normalizePercentage(value);
  if (discount == null) {
    return Number(basePrice.toFixed(2));
  }

  const safeDiscount = Math.min(100, Math.max(0, discount));
  return Number((basePrice * (1 - safeDiscount / 100)).toFixed(2));
}

export function formatPackagePrice(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) {
    return "0";
  }

  const normalized = Number(Number(value).toFixed(2));
  return Number.isInteger(normalized)
    ? normalized.toFixed(0)
    : normalized.toFixed(2).replace(/\.?0+$/, "");
}

export function getPackagePriceBreakdown(
  baseLessonPrice?: number | null,
  lessons = 1,
  percentage?: number | null,
): PackagePriceBreakdown | null {
  if (baseLessonPrice == null || Number.isNaN(Number(baseLessonPrice)) || lessons < 1) {
    return null;
  }

  const normalizedLessonPrice = Number(Number(baseLessonPrice).toFixed(2));
  const baseTotalPrice = Number((normalizedLessonPrice * lessons).toFixed(2));

  return {
    baseLessonPrice: normalizedLessonPrice,
    discountedLessonPrice: applyPackagePercentage(normalizedLessonPrice, percentage),
    baseTotalPrice,
    discountedTotalPrice: applyPackagePercentage(baseTotalPrice, percentage),
  };
}