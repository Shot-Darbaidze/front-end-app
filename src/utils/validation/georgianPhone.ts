/** Strip all non-digit characters. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validate a Georgian mobile number.
 * Must be exactly 9 digits and start with '5' (e.g. 555123456).
 * Returns an error string or null if valid.
 * Pass `required: false` to allow empty values.
 */
export function validateGeorgianPhone(
  value: string,
  options: { required?: boolean } = {},
): string | null {
  const digits = normalizePhone(value);
  if (!digits) {
    return options.required ? "Phone number is required" : null;
  }
  if (digits.length === 9 && digits[0] === "5") return null;
  return "Enter a valid Georgian phone number (e.g. 555 123 456)";
}
