"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import EarningsCalculator from "./EarningsCalculator";
import { useLanguage } from "@/contexts/LanguageContext";

const InstructorCTA = () => {
  const { t } = useLanguage();
  
  return (
    <section id="instructor-cta" className="py-24 px-6 bg-[#0F172A] relative">
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Calculator Section */}
          <div className="order-2 lg:order-1">
            <EarningsCalculator />
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              {t("cta.description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/for-instructors/signup" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                {t("cta.button")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorCTA;
