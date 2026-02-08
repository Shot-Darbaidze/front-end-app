/**
 * Tailwind CSS Utility Functions
 * Reusable class combinations for consistent styling across the app
 * Reduces duplication and ensures design consistency
 */

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const buttonStyles = {
  // Primary button
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
  primarySmall: 'px-3 py-2 text-sm rounded-md font-medium',
  primaryMedium: 'px-4 py-2 rounded-lg font-semibold',
  primaryLarge: 'px-6 py-3 text-lg rounded-lg font-bold',

  // Secondary button
  secondary: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900',
  secondarySmall: 'px-3 py-2 text-sm rounded-md font-medium',
  secondaryMedium: 'px-4 py-2 rounded-lg font-semibold',
  secondaryLarge: 'px-6 py-3 text-lg rounded-lg font-bold',

  // Danger button
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
  dangerSmall: 'px-3 py-2 text-sm rounded-md font-medium',
  dangerMedium: 'px-4 py-2 rounded-lg font-semibold',

  // Success button
  success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white',
  successSmall: 'px-3 py-2 text-sm rounded-md font-medium',

  // Ghost button
  ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-900',
  ghostSmall: 'px-3 py-2 text-sm rounded-md font-medium',

  // Disabled state
  disabled: 'opacity-50 cursor-not-allowed',

  // Base
  base: 'inline-flex items-center justify-center gap-2 transition-colors duration-200 font-medium',
  baseSmall: 'px-3 py-2 text-sm rounded-md',
  baseMedium: 'px-4 py-2.5 rounded-lg',
  baseLarge: 'px-6 py-3 rounded-lg text-lg',
  baseFullWidth: 'w-full',
} as const;

// Combined button utilities
export const getButtonClasses = (
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium',
  fullWidth: boolean = false,
  disabled: boolean = false
): string => {
  const variants: Record<string, string> = {
    primary: buttonStyles.primary,
    secondary: buttonStyles.secondary,
    danger: buttonStyles.danger,
    success: buttonStyles.success,
    ghost: buttonStyles.ghost,
  };

  const sizes: Record<string, string> = {
    small: buttonStyles.baseSmall,
    medium: buttonStyles.baseMedium,
    large: buttonStyles.baseLarge,
  };

  return [
    buttonStyles.base,
    variants[variant],
    sizes[size],
    fullWidth ? buttonStyles.baseFullWidth : '',
    disabled ? buttonStyles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ');
};

// ============================================================================
// CARD STYLES
// ============================================================================

export const cardStyles = {
  // Base card
  base: 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
  baseSmall: 'rounded-md border border-gray-200 bg-white p-4 shadow-sm',
  baseLarge: 'rounded-xl border border-gray-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-200',

  // Elevated card
  elevated: 'rounded-lg border-0 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow duration-200',

  // Flat card
  flat: 'rounded-lg bg-gray-50 border border-gray-100 p-6',

  // Interactive card
  interactive:
    'rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200',

  // Hover effect
  hover: 'hover:shadow-lg hover:scale-105 transition-transform duration-200',

  // Disabled state
  disabled: 'opacity-50 cursor-not-allowed',
} as const;

export const getCardClasses = (
  variant: 'base' | 'elevated' | 'flat' | 'interactive' = 'base',
  size: 'small' | 'medium' | 'large' = 'medium',
  disabled: boolean = false
): string => {
  const variants: Record<string, string> = {
    base: cardStyles.base,
    elevated: cardStyles.elevated,
    flat: cardStyles.flat,
    interactive: cardStyles.interactive,
  };

  const sizes: Record<string, string> = {
    small: cardStyles.baseSmall,
    medium: cardStyles.base,
    large: cardStyles.baseLarge,
  };

  return [variants[variant], sizes[size], disabled ? cardStyles.disabled : ''].filter(Boolean).join(' ');
};

// ============================================================================
// INPUT STYLES
// ============================================================================

export const inputStyles = {
  // Base input
  base: 'w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',

  // Small input
  small: 'px-3 py-1.5 text-sm rounded-md',

  // Large input
  large: 'px-5 py-3 text-lg rounded-lg',

  // Error state
  error: 'border-red-500 focus:ring-red-500',

  // Success state
  success: 'border-green-500 focus:ring-green-500',

  // Disabled state
  disabled: 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60',

  // Readonly state
  readonly: 'bg-gray-50 text-gray-700 cursor-not-allowed',

  // Textarea
  textarea: 'resize-vertical min-h-24',

  // Search input
  search: 'pl-10',
} as const;

export const getInputClasses = (
  size: 'small' | 'medium' | 'large' = 'medium',
  state: 'normal' | 'error' | 'success' | 'disabled' | 'readonly' = 'normal',
  type: 'input' | 'textarea' = 'input'
): string => {
  const sizes: Record<string, string> = {
    small: inputStyles.small,
    medium: '',
    large: inputStyles.large,
  };

  const states: Record<string, string> = {
    normal: '',
    error: inputStyles.error,
    success: inputStyles.success,
    disabled: inputStyles.disabled,
    readonly: inputStyles.readonly,
  };

  const types: Record<string, string> = {
    input: '',
    textarea: inputStyles.textarea,
  };

  return [inputStyles.base, sizes[size], states[state], types[type]]
    .filter(Boolean)
    .join(' ');
};

// ============================================================================
// BADGE & LABEL STYLES
// ============================================================================

export const badgeStyles = {
  // Base badge
  base: 'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',

  // Blue badge
  blue: 'bg-blue-100 text-blue-800',

  // Green badge
  green: 'bg-green-100 text-green-800',

  // Red badge
  red: 'bg-red-100 text-red-800',

  // Yellow badge
  yellow: 'bg-yellow-100 text-yellow-800',

  // Gray badge
  gray: 'bg-gray-100 text-gray-800',

  // Pill variant
  pill: 'rounded-full',
} as const;

export const getBadgeClasses = (
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' = 'blue'
): string => {
  const colors: Record<string, string> = {
    blue: badgeStyles.blue,
    green: badgeStyles.green,
    red: badgeStyles.red,
    yellow: badgeStyles.yellow,
    gray: badgeStyles.gray,
  };

  return [badgeStyles.base, colors[color]].join(' ');
};

// ============================================================================
// GRID & LAYOUT STYLES
// ============================================================================

export const layoutStyles = {
  // Grid layouts
  grid2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  grid4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',

  // Flex layouts
  flexBetween: 'flex items-center justify-between',
  flexCenter: 'flex items-center justify-center',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',

  // Container
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSmall: 'w-full max-w-2xl mx-auto px-4',
  containerLarge: 'w-full px-4 sm:px-6 lg:px-8',

  // Spacing
  sectionPadding: 'py-12 px-4 sm:px-6 lg:px-8',
  sectionPaddingSmall: 'py-8 px-4',
  sectionPaddingLarge: 'py-16 px-4 sm:px-6 lg:px-8',

  // Divider
  divider: 'border-t border-gray-200',
  dividerVertical: 'border-l border-gray-200',
} as const;

// ============================================================================
// TEXT & TYPOGRAPHY STYLES
// ============================================================================

export const typographyStyles = {
  // Headings
  h1: 'text-4xl font-bold text-gray-900',
  h2: 'text-3xl font-bold text-gray-900',
  h3: 'text-2xl font-bold text-gray-900',
  h4: 'text-xl font-semibold text-gray-900',
  h5: 'text-lg font-semibold text-gray-900',
  h6: 'text-base font-semibold text-gray-900',

  // Body text
  body: 'text-base text-gray-700',
  bodySm: 'text-sm text-gray-600',
  bodyXs: 'text-xs text-gray-500',

  // Emphasized text
  muted: 'text-gray-500',
  mutedSm: 'text-sm text-gray-500',

  // Links
  link: 'text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors duration-200',
  linkNoUnderline: 'text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200',

  // Truncate
  truncate: 'truncate',
  truncate2: 'line-clamp-2',
  truncate3: 'line-clamp-3',
} as const;

// ============================================================================
// COMMON PATTERNS
// ============================================================================

export const patterns = {
  // Form groups
  formGroup: 'space-y-2',
  formLabel: 'block text-sm font-medium text-gray-700',
  formErrorMessage: 'text-xs text-red-600 mt-1',
  formHintMessage: 'text-xs text-gray-500 mt-1',

  // List items
  listItem: 'px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors',

  // Modal/Dialog
  modalBackdrop: 'fixed inset-0 bg-black/50 flex items-center justify-center',
  modalContent: 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4',

  // Transitions
  transitionFast: 'transition-all duration-150',
  transitionNormal: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',

  // Focus ring
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',

  // Accessibility
  srOnly: 'sr-only',
} as const;

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export const responsive = {
  // Hidden on mobile
  hideOnMobile: 'hidden sm:block',

  // Hidden on desktop
  hideOnDesktop: 'sm:hidden',

  // Show on mobile only
  mobileOnly: 'sm:hidden',

  // Responsive text
  responsiveText: 'text-sm sm:text-base md:text-lg lg:text-xl',

  // Responsive padding
  responsivePadding: 'p-4 sm:p-6 md:p-8 lg:p-10',

  // Responsive margin
  responsiveMargin: 'm-4 sm:m-6 md:m-8 lg:m-10',

  // Responsive width
  responsiveWidth: 'w-full sm:w-3/4 md:w-2/3 lg:w-1/2',
} as const;

// ============================================================================
// HELPER FUNCTIONS FOR CLASS COMPOSITION
// ============================================================================

/**
 * Combines multiple class strings, filtering out falsy values
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Conditionally applies classes based on a condition
 */
export const conditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string => {
  return condition ? trueClass : falseClass;
};

/**
 * Merges multiple style objects into a single className string
 */
export const mergeStyles = (...styles: (Record<string, string> | string)[]): string => {
  return styles
    .map((style) => (typeof style === 'string' ? style : Object.values(style).join(' ')))
    .filter(Boolean)
    .join(' ');
};

export default {
  buttonStyles,
  getButtonClasses,
  cardStyles,
  getCardClasses,
  inputStyles,
  getInputClasses,
  badgeStyles,
  getBadgeClasses,
  layoutStyles,
  typographyStyles,
  patterns,
  responsive,
  cn,
  conditionalClass,
  mergeStyles,
};
