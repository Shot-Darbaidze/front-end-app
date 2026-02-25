"use client";

import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocaleHref } from "@/hooks/useLocaleHref";

const InstructorHero = () => {
  const { t } = useLanguage();
  const localeHref = useLocaleHref();
  
  const handleCalculatorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("instructor-cta");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative bg-[#0F172A] pt-32 pb-16 px-6 overflow-hidden">
       {/* Abstract Background Shapes - Matching Home Page */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 -left-32 sm:-left-10 md:left-0 w-2/3 sm:w-1/2 md:w-1/3 h-1/2 bg-blue-500/5 -skew-x-12 transform origin-bottom-left" />
      
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            {t("hero.title")} <span className="text-[#F03D3D]">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
            {t("hero.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={localeHref("/for-instructors/signup")} 
                className="px-8 py-4 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {t("hero.becomeInstructor")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#instructor-cta"
                onClick={handleCalculatorClick}
                className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet className="w-5 h-5 text-[#F03D3D]" />
                {t("hero.calculator")}
              </a>
            </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorHero;
