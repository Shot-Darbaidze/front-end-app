"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";
import { CITY_EXAM_NAV_ITEMS } from "@/components/city-exam/CityExamNav";

const Footer = () => {
  const pathname = usePathname();
  const localeHref = useLocaleHref();
  const { language } = useLanguage();
  const { user } = useUser();
  const isKa = language === "ka";
  const userType = (user?.publicMetadata?.userType as "student" | "instructor") || "student";
  const quickLinks = [
    { href: "/", label: isKa ? "მთავარი" : "Home" },
    { href: "/find-instructors", label: isKa ? "ინსტრუქტორების ძიება" : "Find Instructors" },
    { href: "/for-instructors", label: isKa ? "ინსტრუქტორებისთვის" : "For Instructors" },
    ...(userType === "student"
      ? [{ href: "/city-exam/monitor", label: isKa ? "ქალაქის გამოცდა" : "City Exam" }]
      : []),
  ];

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
              <span className="text-2xl font-bold tracking-tighter">
                Instruktori
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              {isKa
                ? "იპოვე მართვის ინსტრუქტორი, დაგეგმე გაკვეთილები და მოემზადე გამოცდისთვის ერთ სივრცეში."
                : "Find driving instructors, schedule lessons, and prepare for your exam in one place."}
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
            <h3 className="font-bold text-lg mb-6">{isKa ? "სწრაფი ბმულები" : "Quick Links"}</h3>
            <ul className="space-y-4">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={localeHref(item.href)} className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">{isKa ? "ქალაქის გამოცდა" : "City Exam"}</h3>
            <ul className="space-y-4">
              {CITY_EXAM_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={localeHref(item.href)} className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                    {isKa ? item.label.ka : item.label.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sagency */}
          <div>
            <h3 className="font-bold text-lg mb-6">Sagency</h3>
            <ul className="space-y-4">
              <li>
                <a href="https://www.sa.gov.ge/p/bookingterms" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  {isKa ? "ჯავშანი" : "Reservation"}
                </a>
              </li>
              <li>
                <a href="https://my.sa.gov.ge/drivinglicenses/theoreticalexam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  {isKa ? "თეორიული გამოცდა" : "Theory Exam"}
                </a>
              </li>
              <li>
                <a href="https://my.sa.gov.ge/drivinglicenses/practicalexam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#F03D3D] transition-colors">
                  {isKa ? "ქალაქის გამოცდა" : "City Exam"}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-6">{isKa ? "დაგვიკავშირდი" : "Contact Us"}</h3>
            <ul className="space-y-4">
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
            {isKa
              ? `© ${currentYear} Instruktori Inc. ყველა უფლება დაცულია.`
              : `© ${currentYear} Instruktori Inc. All rights reserved.`}
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href={localeHref("/privacy-policy")} className="hover:text-white transition-colors">
              {isKa ? "კონფიდენციალურობის პოლიტიკა" : "Privacy Policy"}
            </Link>
            <Link href={localeHref("/terms-of-service")} className="hover:text-white transition-colors">
              {isKa ? "მომსახურების პირობები" : "Terms of Service"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
