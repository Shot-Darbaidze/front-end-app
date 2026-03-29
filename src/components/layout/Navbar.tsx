"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Languages, Bell, Home, Search, Briefcase, Building2, Car, ChevronRight, ChevronDown, LogOut, Settings, Handshake } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useClerk
} from "@clerk/nextjs";
import { useDashboardNotifications } from "@/hooks/useDashboardNotifications";
import Button from "@/components/ui/Button";
import NotificationsDropdown from "@/components/navbar-components/NotificationsDropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { removeLocaleFromPathname } from "@/lib/i18n";

const Navbar = () => {
  const MOBILE_MENU_ANIMATION_MS = 300;
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [isMobilePartnerExpanded, setIsMobilePartnerExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const partnerDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isBurgerOnLightBg, setIsBurgerOnLightBg] = useState(false);
  const [isMobileCloseIconExpanded, setIsMobileCloseIconExpanded] = useState(false);
  const [isMobileDrawerAnimatedOpen, setIsMobileDrawerAnimatedOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Helper to prefix links with current locale
  const localeHref = (path: string) => `/${language}${path === "/" ? "" : path}`;

  const handleLanguageToggle = () => {
    const newLang = language === "en" ? "ka" : "en";
    setLanguage(newLang);
    // Navigate to the same page with the new locale
    const pathWithoutLocale = removeLocaleFromPathname(pathname);
    router.push(`/${newLang}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`);
  };

  // Determine user type from Clerk metadata (default to "student")
  const userType = (user?.publicMetadata?.userType as "student" | "instructor") || "student";
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useDashboardNotifications({
    enabled: mounted && isLoaded && Boolean(user),
    localeHref,
  });

  // Prevent hydration mismatch by only rendering auth content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const clearMobileMenuCloseTimeout = () => {
    if (mobileMenuCloseTimeoutRef.current) {
      clearTimeout(mobileMenuCloseTimeoutRef.current);
      mobileMenuCloseTimeoutRef.current = null;
    }
  };

  const openMobileMenu = () => {
    clearMobileMenuCloseTimeout();
    setIsMobileMenuVisible(true);
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    clearMobileMenuCloseTimeout();
    setIsMobileCloseIconExpanded(false);
    setIsMobileDrawerAnimatedOpen(false);
    setIsMobileMenuOpen(false);

    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsMobileMenuVisible(false);
      mobileMenuCloseTimeoutRef.current = null;
    }, MOBILE_MENU_ANIMATION_MS);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
      return;
    }

    openMobileMenu();
  };

  // Close mobile menu on route change
  useEffect(() => {
    clearMobileMenuCloseTimeout();
    setIsMobileMenuOpen(false);
    setIsMobileMenuVisible(false);
    setIsMobileCloseIconExpanded(false);
    setIsMobileDrawerAnimatedOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile menu is visible (including close animation)
  useEffect(() => {
    if (isMobileMenuVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuVisible]);

  useEffect(() => {
    if (!isMobileMenuVisible) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      setIsMobileCloseIconExpanded(true);
      setIsMobileDrawerAnimatedOpen(true);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobileMenuVisible]);

  useEffect(() => {
    return () => {
      clearMobileMenuCloseTimeout();
    };
  }, []);

  const isDashboard = pathname?.includes('/dashboard') || pathname?.includes('/city-exam');

  const parseBackgroundColor = (color: string) => {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
    if (!match) {
      return null;
    }

    return {
      red: Number(match[1]),
      green: Number(match[2]),
      blue: Number(match[3]),
      alpha: match[4] ? Number(match[4]) : 1,
    };
  };

  const getRelativeLuminance = (red: number, green: number, blue: number) => {
    const channels = [red, green, blue].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const detectBurgerBackground = () => {
    if (!mobileMenuButtonRef.current) {
      return;
    }

    const buttonRect = mobileMenuButtonRef.current.getBoundingClientRect();
    const pointX = buttonRect.left + buttonRect.width / 2;
    const pointY = buttonRect.top + buttonRect.height / 2;
    const elements = document.elementsFromPoint(pointX, pointY) as HTMLElement[];

    const backgroundElement = elements.find((element) => {
      if (mobileMenuButtonRef.current?.contains(element)) {
        return false;
      }

      if (navRef.current?.contains(element)) {
        return false;
      }

      const parsedColor = parseBackgroundColor(window.getComputedStyle(element).backgroundColor);
      return parsedColor !== null && parsedColor.alpha > 0.05;
    });

    if (!backgroundElement) {
      setIsBurgerOnLightBg(true);
      return;
    }

    const parsedColor = parseBackgroundColor(window.getComputedStyle(backgroundElement).backgroundColor);

    if (!parsedColor) {
      setIsBurgerOnLightBg(true);
      return;
    }

    const luminance = getRelativeLuminance(parsedColor.red, parsedColor.green, parsedColor.blue);
    setIsBurgerOnLightBg(luminance > 0.5);
  };

  useEffect(() => {
    const updateBurgerContrast = () => {
      requestAnimationFrame(detectBurgerBackground);
    };

    updateBurgerContrast();
    window.addEventListener("scroll", updateBurgerContrast, { passive: true });
    window.addEventListener("resize", updateBurgerContrast);

    return () => {
      window.removeEventListener("scroll", updateBurgerContrast);
      window.removeEventListener("resize", updateBurgerContrast);
    };
  }, [pathname, isScrolled, isMobileMenuVisible]);

  // Close partner dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(e.target as Node)) {
        setIsPartnerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar on signup pages
  if (pathname?.endsWith('/for-instructors/signup') || pathname?.endsWith('/for-instructors/invite-signup')) {
    return null;
  }

  const navLinks = [
    { href: "/", label: language === "ka" ? "მთავარი" : "Home" },
    { href: "/find-instructors", label: language === "ka" ? "ინსტრუქტორების ძებნა" : "Find Instructors" },
    ...(userType === "student" ? [{ href: "/city-exam/monitor", label: language === "ka" ? "ქალაქის გამოცდა" : "City Exam" }] : []),
  ];

  const partnerLinks = [
    { href: "/for-instructors", label: language === "ka" ? "ინსტრუქტორებისთვის" : "For Instructors", icon: <Briefcase className="w-4 h-4" /> },
    { href: "/for-autoschools", label: language === "ka" ? "აუტოსკოლებისთვის" : "For Autoschools", icon: <Building2 className="w-4 h-4" /> },
  ];

  const partnerDropdownLabel = language === "ka" ? "შემოგვიერთდით" : "Partners";
  const isPartnerActive = pathname?.includes("/for-instructors") || pathname?.includes("/for-autoschools");

  const mobileNavItems = navLinks.map((link) => {
    const icon =
      link.href === "/"
        ? <Home className="w-5 h-5" />
        : link.href === "/find-instructors"
          ? <Search className="w-5 h-5" />
          : <Car className="w-5 h-5" />;

    return { ...link, icon };
  });

  return (
    <>
      <nav
        ref={navRef}
        className={`${isDashboard ? "absolute" : "fixed"} top-0 left-0 right-0 z-50 ${!isDashboard ? "transition-all duration-300" : ""} ${
          !isDashboard && isScrolled
            ? "bg-white/90 backdrop-blur-md py-3 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">

          {/* Logo */}
          <Link href={localeHref("/")} className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center transform group-hover:rotate-12 transition duration-300">
              <Image
                src="/icon.svg"
                alt="Instruktori Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-600">
              Instruktori
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={localeHref(link.href)}
                className={`text-sm font-medium transition-colors hover:text-[#F03D3D] whitespace-nowrap ${
                  pathname === localeHref(link.href) ? "text-[#F03D3D]" : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Partners Dropdown */}
            <div ref={partnerDropdownRef} className="relative">
              <button
                onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                className={`text-sm font-medium transition-colors hover:text-[#F03D3D] flex items-center gap-1 whitespace-nowrap ${
                  isPartnerActive ? "text-[#F03D3D]" : "text-gray-600"
                }`}
              >
                {partnerDropdownLabel}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPartnerDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isPartnerDropdownOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] z-50">
                  {partnerLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={localeHref(link.href)}
                      onClick={() => setIsPartnerDropdownOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${
                        pathname === localeHref(link.href) ? "text-[#F03D3D] bg-red-50/50" : "text-gray-700"
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Auth/User */}
          <div className="hidden md:flex items-center gap-4">
            {!mounted ? (
              // Placeholder while hydrating to prevent mismatch
              <div className="flex items-center gap-3">
                <button
                  className="p-2 text-gray-600 opacity-0"
                  aria-label="Change language"
                  disabled
                >
                  <Languages className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <SignedIn>
                  <div className="flex items-center gap-3">
                <button
                  onClick={handleLanguageToggle}
                  className="p-2 text-gray-600 hover:text-[#F03D3D] transition-colors"
                  aria-label="Change language"
                >
                  <Languages className="w-5 h-5" />
                </button>

                <NotificationsDropdown
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  onToggle={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsUserMenuOpen(false);
                  }}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onRemove={removeNotification}
                />

                <Link
                  href={localeHref("/dashboard")}
                  className="p-2 text-gray-600 hover:text-[#F03D3D] transition-colors rounded-full hover:bg-gray-50"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>

                {/* Clerk UserButton - provides access to profile management */}
                <UserButton
                  afterSignOutUrl={localeHref("/")}
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                      userButtonPopoverCard: "shadow-xl rounded-xl",
                      userButtonPopoverActionButton: "hover:bg-gray-50",
                      userButtonPopoverActionButtonText: "text-gray-700",
                      userButtonPopoverActionButtonIcon: "text-gray-500",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
                  userProfileMode="navigation"
                  userProfileUrl={localeHref("/dashboard/settings")}
                />
              </div>
            </SignedIn>
            <SignedOut>
              <>
                <button
                  onClick={handleLanguageToggle}
                  className="p-2 text-gray-600 hover:text-[#F03D3D] transition-colors"
                  aria-label="Change language"
                >
                  <Languages className="w-5 h-5" />
                </button>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-[#F03D3D] transition-colors cursor-pointer">
                    {language === "ka" ? "შესვლა" : "Log In"}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="rounded-full px-6 shadow-lg shadow-red-500/20">
                    {language === "ka" ? "დაწყება" : "Get Started"}
                  </Button>
                </SignUpButton>
              </>
            </SignedOut>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuButtonRef}
            className={`group md:hidden p-2 transition-colors ${
              isScrolled || isMobileMenuOpen ? "text-gray-900" : isBurgerOnLightBg ? "text-black" : "text-white"
            }`}
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? (language === "ka" ? "მენიუს დახურვა" : "Close menu") : (language === "ka" ? "მენიუს გახსნა" : "Open menu")}
          >
            <svg
              className="pointer-events-none w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 12L20 12"
                className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
              />
              <path
                d="M4 12H20"
                className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
              />
              <path
                d="M4 12H20"
                className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuVisible && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              isMobileDrawerAnimatedOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMobileMenu}
          />
          <button
            onClick={closeMobileMenu}
            className={`group absolute right-6 p-2 text-gray-900 transition-colors z-10 ${
              isScrolled ? "top-3" : "top-5"
            }`}
            aria-expanded={isMobileCloseIconExpanded}
            aria-label={language === "ka" ? "მენიუს დახურვა" : "Close menu"}
          >
            <svg
              className="pointer-events-none w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 12L20 12"
                className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
              />
              <path
                d="M4 12H20"
                className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
              />
              <path
                d="M4 12H20"
                className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
              />
            </svg>
          </button>
          <div
            className={`absolute inset-y-0 right-0 w-[84%] max-w-[340px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out will-change-transform ${
              isMobileDrawerAnimatedOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="px-4 pt-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {language === "ka" ? "მენიუ" : "Menu"}
                </p>
                <h2 className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {language === "ka" ? "ნავიგაცია" : "Navigation"}
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              <div className="space-y-2">
                {mobileNavItems.map((link) => {
                  const isActive = pathname === localeHref(link.href);

                  return (
                    <Link
                      key={`list-${link.href}`}
                      href={localeHref(link.href)}
                      className={`w-full rounded-xl px-2.5 py-3 flex items-center gap-2.5 transition-colors ${
                        isActive
                          ? "bg-red-50 text-[#F03D3D]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#F03D3D]"
                      }`}
                    >
                      <span className="text-current">{link.icon}</span>
                      <span className="flex-1 text-sm font-medium">{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  );
                })}

                {/* Partners expandable section in mobile */}
                <div>
                  <button
                    onClick={() => setIsMobilePartnerExpanded(!isMobilePartnerExpanded)}
                    className={`w-full rounded-xl px-2.5 py-3 flex items-center gap-2.5 transition-colors ${
                      isPartnerActive
                        ? "bg-red-50 text-[#F03D3D]"
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#F03D3D]"
                    }`}
                  >
                    <Handshake className="w-5 h-5" />
                    <span className="flex-1 text-sm font-medium text-left">{partnerDropdownLabel}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMobilePartnerExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isMobilePartnerExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                      {partnerLinks.map((link) => {
                        const isActive = pathname === localeHref(link.href);
                        return (
                          <Link
                            key={`partner-${link.href}`}
                            href={localeHref(link.href)}
                            className={`w-full rounded-lg px-2.5 py-2.5 flex items-center gap-2.5 transition-colors ${
                              isActive
                                ? "bg-red-50 text-[#F03D3D]"
                                : "text-gray-600 hover:bg-gray-50 hover:text-[#F03D3D]"
                            }`}
                          >
                            {link.icon}
                            <span className="text-sm font-medium">{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3">
                <button
                  onClick={handleLanguageToggle}
                  className="w-full flex items-center justify-between text-gray-700 hover:text-[#F03D3D] transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Languages className="w-5 h-5" />
                    <span>{language === "ka" ? "ენის შეცვლა" : "Change language"}</span>
                  </span>
                  <span className="text-xs font-semibold text-gray-400">{language === "ka" ? "EN" : "KA"}</span>
                </button>
              </div>

              {mounted && (
                <SignedIn>
                  <div className="rounded-xl border border-gray-200 p-3 space-y-1">
                    <Link
                      href={localeHref("/dashboard")}
                      className={`w-full rounded-lg px-2 py-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                        pathname === localeHref("/dashboard")
                          ? "bg-red-50 text-[#F03D3D]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#F03D3D]"
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>{language === "ka" ? "დაფა" : "Dashboard"}</span>
                    </Link>
                    <Link
                      href={localeHref("/dashboard/notifications")}
                      className={`w-full rounded-lg px-2 py-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                        pathname === localeHref("/dashboard/notifications")
                          ? "bg-red-50 text-[#F03D3D]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#F03D3D]"
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                      <span>{language === "ka" ? "შეტყობინებები" : "Notifications"}</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-[#F03D3D] text-white text-xs font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href={localeHref("/dashboard/settings")}
                      className={`w-full rounded-lg px-2 py-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                        pathname === localeHref("/dashboard/settings")
                          ? "bg-red-50 text-[#F03D3D]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#F03D3D]"
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span>{language === "ka" ? "პარამეტრები" : "Settings"}</span>
                    </Link>
                    <button
                      onClick={() => signOut({ redirectUrl: localeHref("/") })}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{language === "ka" ? "გამოსვლა" : "Log Out"}</span>
                    </button>
                  </div>
                </SignedIn>
              )}
            </div>

            {mounted && (
              <SignedOut>
                <div className="border-t border-gray-100 p-5 space-y-3">
                  <SignInButton mode="modal">
                    <button className="w-full py-3 rounded-xl border border-gray-200 font-semibold text-gray-900 cursor-pointer">
                      {language === "ka" ? "შესვლა" : "Log In"}
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full py-3 rounded-xl bg-[#F03D3D] text-white font-semibold shadow-lg shadow-red-500/20 cursor-pointer">
                      {language === "ka" ? "დაწყება" : "Get Started"}
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
