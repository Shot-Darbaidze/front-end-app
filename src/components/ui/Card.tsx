import React from "react";
import Link from "next/link";
import { cn } from "@/utils/tailwind";

type CardPadding = "sm" | "md" | "lg";

// Supported HTML elements for the Card wrapper
type CardElement = "div" | "section" | "article";

export type CardProps = React.PropsWithChildren<{
  href?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement | HTMLAnchorElement>;
  className?: string;
  padding?: CardPadding;
  interactive?: boolean; // adds hover shadow and cursor-pointer
  as?: CardElement;
  role?: string;
  // Accessibility: custom aria-label when the whole card is clickable
  ariaLabel?: string;
}>;

const paddingMap: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const isExternalHref = (href: string) =>
  /^(https?:)?\/\//.test(href) ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:");

/**
 * Generic reusable Card container used across pages. It centralizes the
 * rounded, shadowed, bordered styling so all cards stay consistent.
 */
const Card: React.FC<CardProps> = ({
  href,
  onClick,
  className,
  padding = "md",
  interactive,
  as: Element = "div",
  role,
  ariaLabel,
  children,
}) => {
  const base = cn(
    "bg-white rounded-xl shadow-sm border border-gray-200",
    paddingMap[padding],
    (interactive || !!href) &&
      "hover:shadow-md transition-shadow cursor-pointer",
    "h-full",
    className
  );

  const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500";

  if (href) {
    // Cast onClick to the proper anchor type for href cases
    const handleAnchorClick = onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined;
    
    if (isExternalHref(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAnchorClick}
          className={cn(base, focusClasses)}
          aria-label={ariaLabel}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        onClick={handleAnchorClick}
        aria-label={ariaLabel}
        className={cn(base, focusClasses, "block")}
      >
        {children}
      </Link>
    );
  }

  // For non-link cards, onClick is for div elements
  const handleDivClick = onClick as React.MouseEventHandler<HTMLDivElement> | undefined;
  
  return (
    <Element
      className={cn(base, focusClasses)}
      onClick={handleDivClick}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Element>
  );
};

export default Card;
