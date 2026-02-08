"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Languages, Bell, Heart } from "lucide-react";
import { 
  SignInButton, 
  SignUpButton, 
  SignedIn, 
  SignedOut, 
  UserButton,
  useUser,
  useClerk
} from "@clerk/nextjs";
import { useNotifications } from "@/hooks";
import Button from "@/components/ui/Button";
import NotificationsDropdown from "@/components/navbar-components/NotificationsDropdown";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const pathname = usePathname();

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "ka" : "en");
  };

  // Determine user type from Clerk metadata (default to "student")
  const userType = (user?.publicMetadata?.userType as "student" | "instructor") || "student";

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications(userType);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  const isDashboard = pathname?.startsWith('/dashboard');

  // Hide navbar on signup pages
  if (pathname === '/for-instructors/signup') {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/find-instructors", label: "Find Instructors" },
    { href: "/for-instructors", label: "For Instructors" },
    { href: "/blog", label: "Blog" },
    ...(userType === "student" ? [{ href: "/city-exam", label: "City Exam" }] : []),
  ];

  return (
    <>
      <nav 
        className={`${isDashboard ? "absolute" : "fixed"} top-0 left-0 right-0 z-50 ${!isDashboard ? "transition-all duration-300" : ""} ${
          (!isDashboard && isScrolled) || isMobileMenuOpen
            ? "bg-white/90 backdrop-blur-md py-3 shadow-sm" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
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
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#F03D3D] ${
                  pathname === link.href ? "text-[#F03D3D]" : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth/User */}
          <div className="hidden md:flex items-center gap-4">
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
                  href="/dashboard/favorites" 
                  className="p-2 text-gray-600 hover:text-[#F03D3D] transition-colors rounded-full hover:bg-gray-50"
                  aria-label="Favorites"
                >
                  <Heart className="w-5 h-5" />
                </Link>

                <Link 
                  href="/dashboard" 
                  className="p-2 text-gray-600 hover:text-[#F03D3D] transition-colors rounded-full hover:bg-gray-50"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
                
                {/* Clerk UserButton - provides access to profile management */}
                <UserButton 
                  afterSignOutUrl="/"
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
                  userProfileUrl="/dashboard/settings"
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
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="rounded-full px-6 shadow-lg shadow-red-500/20">
                    Get Started
                  </Button>
                </SignUpButton>
              </>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden animate-in slide-in-from-top-10 duration-300">
          <div className="flex flex-col gap-6 text-center">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-xl font-bold text-gray-900 hover:text-[#F03D3D]"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-gray-100 my-2" />
            
            <button onClick={handleLanguageToggle} className="flex items-center justify-center gap-2 text-lg font-medium text-gray-600 hover:text-[#F03D3D] mx-auto">
               <Languages className="w-5 h-5" />
               <span>Language</span>
            </button>

            <div className="h-px bg-gray-100 my-2" />
            
            <SignedIn>
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center justify-center gap-2 text-lg font-medium text-gray-600 hover:text-[#F03D3D]"
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#F03D3D] text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link 
                  href="/dashboard/favorites" 
                  className="flex items-center justify-center gap-2 text-lg font-medium text-gray-600 hover:text-[#F03D3D]"
                >
                  <Heart className="w-5 h-5" />
                  <span>Favorites</span>
                </Link>
                <Link href="/dashboard" className="text-lg font-medium text-gray-600">Dashboard</Link>
                <button onClick={() => signOut({ redirectUrl: '/' })} className="text-lg font-bold text-red-600">Log Out</button>
              </>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col gap-4 mt-4">
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-xl border border-gray-200 font-bold text-gray-900 cursor-pointer">
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full py-3 rounded-xl bg-[#F03D3D] text-white font-bold shadow-lg shadow-red-500/20 cursor-pointer">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
