"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const pathname = usePathname();
  
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  // Hide footer on specific pages
  if (pathname === "/main1" || pathname?.startsWith("/for-instructors/signup") || pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="relative bg-[#0F172A] text-white pt-20 pb-10 transform-gpu will-change-[transform]">
      <div className="relative max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              Instruktori
            </Link>
            <p className="text-gray-400 leading-relaxed">
              Empowering the next generation of drivers with confidence, safety, and skill. Join Georgia's fastest-growing driving community.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F03D3D] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F03D3D] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F03D3D] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F03D3D] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/find-instructors" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Find Instructors
                </Link>
              </li>
              <li>
                <Link href="/for-instructors" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  For Instructors
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Instructors */}
          <div>
            <h3 className="font-bold text-lg mb-6">For Instructors</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/for-instructors" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Join the Network
                </Link>
              </li>
              <li>
                <Link href="/for-instructors/benefits" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Instructor Benefits
                </Link>
              </li>
              <li>
                <Link href="/for-instructors/success-stories" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 text-[#F03D3D] shrink-0" />
                <span>26 May Square, Tbilisi, Georgia 0171</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-[#F03D3D] shrink-0" />
                <span>+995 32 2 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 text-[#F03D3D] shrink-0" />
                <span>support@instruktori.ge</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Instruktori Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
