"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";

const Footer = () => {
  const pathname = usePathname();
  const localeHref = useLocaleHref();
  
  if (pathname?.includes('/dashboard')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  // Hide footer on specific pages
  if (pathname?.includes("/for-instructors/signup")) {
    return null;
  }

  return (
    <footer className="relative bg-[#0F172A] text-white pt-20 pb-10 transform-gpu will-change-[transform]">
      <div className="relative max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href={localeHref("/")} className="text-2xl font-bold tracking-tighter">
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
                <Link href={localeHref("/find-instructors")} className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Find Instructors
                </Link>
              </li>
              <li>
                <Link href={localeHref("/city-exam")} className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  City Exam
                </Link>
              </li>
            </ul>
          </div>

          {/* For Instructors */}
          <div>
            <h3 className="font-bold text-lg mb-6">For Instructors</h3>
            <ul className="space-y-4">
              <li>
                <Link href={localeHref("/for-instructors")} className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Why Instruktori
                </Link>
              </li>
              <li>
                <Link href={localeHref("/for-instructors/signup")} className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Become an Instructor
                </Link>
              </li>
            </ul>
          </div>

          {/* Sagency */}
          <div>
            <h3 className="font-bold text-lg mb-6">Sagency</h3>
            <ul className="space-y-4">
              <li>
                <a href="https://www.sa.gov.ge/p/bookingterms" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Reservation
                </a>
              </li>
              <li>
                <a href="https://my.sa.gov.ge/drivinglicenses/theoreticalexam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  Theory Exam
                </a>
              </li>
              <li>
                <a href="https://my.sa.gov.ge/drivinglicenses/practicalexam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  City Exam
                </a>
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
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
