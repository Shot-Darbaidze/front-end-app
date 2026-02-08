"use client";

import React from "react";
import { Calendar, ChevronDown } from "lucide-react";

type FieldType = "input" | "select" | "textarea";

export type SettingsFieldProps = {
  label: string;
  required?: boolean;
  labelRight?: React.ReactNode; // e.g., Verify email badge
  as?: FieldType;
  type?: string; // for input
  name?: string;
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<{ value: string; label: string }>; // for select
  rightIcon?: "chevron" | "calendar" | React.ReactNode; // adornment inside the field on the right
  rows?: number; // for textarea
  containerClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
};

/**
 * SettingsField: A compact, reusable form field used in Account Settings.
 * - Supports input/select/textarea
 * - Optional right label badge and right-side icon (chevron/calendar)
 * - Preserves existing visual style used across the settings page
 */
export default function SettingsField({
  label,
  required,
  labelRight,
  as = "input",
  type = "text",
  name,
  id,
  placeholder,
  value,
  onChange,
  options,
  rightIcon,
  rows = 4,
  containerClassName,
  inputClassName,
  disabled,
}: SettingsFieldProps) {
  const generatedId = React.useId();
  const fieldId = id || name || generatedId;
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const baseInputClasses =
    "focus:outline-none focus:ring-2 focus:ring-[#F03D3D] text-gray-700 w-full";
  const baseStyle: React.CSSProperties = {
    fontFamily: "Inter",
    fontWeight: 400,
    padding: "12px 18px",
    width: "100%",
    height: as === "textarea" ? undefined : "48px",
    border: "1px solid #CAD0D9",
    borderRadius: "8px",
  };

  // Build className string
  const fieldClassName = [
    baseInputClasses,
    as === "select" ? "text-gray-500 appearance-none" : "",
    rightIcon === "calendar" && as === "input" ? "dc-date-custom" : "",
    inputClassName || "",
  ].filter(Boolean).join(" ");

  // Shared handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => onChange?.(e.target.value);

  const renderRightIcon = () => {
    if (!rightIcon) return null;
    if (rightIcon === "chevron") {
      return (
        <ChevronDown
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-[#F03D3D]"
          size={16}
        />
      );
    }
    if (rightIcon === "calendar") {
      return (
        <button
          type="button"
          aria-label="Open date picker"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F03D3D] transition-colors"
          onMouseDown={(e) => {
            // Keep control of focus to ensure picker opens reliably
            e.preventDefault();
          }}
          onClick={() => {
            const el = inputRef.current as HTMLInputElement | null;
            if (!el) return;
            // Always attempt to open the native picker when available
            // @ts-ignore
            if (typeof el.showPicker === "function") {
              // @ts-ignore
              el.showPicker();
              el.focus();
            } else {
              el.focus();
              el.click();
            }
          }}
        >
          <Calendar size={18} />
        </button>
      );
    }
    return <>{rightIcon}</>;
  };

  return (
    <div className={containerClassName}>
      <div className="flex items-center gap-2 mb-2">
        <label
          htmlFor={fieldId}
          className="text-gray-900 text-base"
          style={{ fontFamily: "Inter", fontWeight: 500 }}
        >
          {label}
          {required ? " *" : ""}
        </label>
        {labelRight}
      </div>

      {/* Field wrapper for right adornments */}
      <div className="relative group">
        {as === "textarea" && (
          <textarea
            id={fieldId}
            name={name}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            rows={rows}
            onChange={handleChange}
            className={`${fieldClassName} resize-none`}
            style={baseStyle}
          />
        )}
        {as === "input" && (
          <input
            ref={rightIcon === "calendar" ? inputRef : undefined}
            type={type}
            id={fieldId}
            name={name}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onChange={handleChange}
            className={fieldClassName}
            style={baseStyle}
          />
        )}
        {as === "select" && (
          <select
            id={fieldId}
            name={name}
            value={value}
            disabled={disabled}
            onChange={handleChange}
            className={fieldClassName}
            style={baseStyle}
          >
            {(options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {renderRightIcon()}
      </div>
    </div>
  );
}
