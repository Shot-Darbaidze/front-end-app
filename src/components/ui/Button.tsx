"use client";

import React from "react";

type Variant = "primary" | "outline" | "subtle";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  asChild?: boolean; // render child element with button styles
}

const COLORS = {
  primary: {
    base: "bg-[#F03D3D] border border-[#F03D3D] text-white hover:opacity-90",
    disabled:
      "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
  },
  outline: {
    base: "bg-transparent border border-[#F03D3D] text-[#F03D3D] hover:bg-[#F03D3D]/5",
    disabled:
      "bg-transparent border border-gray-200 text-gray-400 cursor-not-allowed",
  },
  subtle: {
    base: "bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200",
    disabled:
      "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
  },
} as const;

const SIZES: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3",
};

export default function Button({
  variant = "primary",
  size = "md",
  block,
  disabled,
  asChild,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const color = disabled ? COLORS[variant].disabled : COLORS[variant].base;
  const width = block ? "w-full" : "";
  const classes = [
    "rounded-lg font-medium transition-colors",
    color,
    SIZES[size],
    width,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // If asChild is set, clone the child element and merge classes/handlers
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const mergedClass = [classes, child.props?.className]
      .filter(Boolean)
      .join(" ");
    const { onClick } = props;
    return React.cloneElement(child, {
      className: mergedClass,
      onClick,
      role: child.props?.role || "button",
    });
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
