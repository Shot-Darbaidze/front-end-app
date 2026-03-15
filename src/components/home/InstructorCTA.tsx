"use client";

import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useLanguage } from "@/contexts/LanguageContext";

const InstructorCTA = () => {
  const localeHref = useLocaleHref();
  const { t } = useLanguage();

  const benefits = [
    t("home.instructorCta.benefit1"),
    t("home.instructorCta.benefit2"),
    t("home.instructorCta.benefit3"),
    t("home.instructorCta.benefit4"),
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-[85rem] mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-[#F03D3D] font-semibold text-sm">
                {t("home.instructorCta.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F03D3D] to-orange-500">
                  {t("home.instructorCta.title")}
                </span> <br/>
                {t("home.instructorCta.titleLine2")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
                {t("home.instructorCta.description")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-y-4 gap-x-2 text-left max-w-md mx-auto lg:mx-0 lg:max-w-lg justify-items-center lg:justify-items-start">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 w-fit">
                  <CheckCircle2 className="w-5 h-5 text-[#F03D3D] shrink-0" />
                  <span className="font-medium text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <Link
                href={localeHref("/for-instructors")}
                className="inline-flex items-center justify-center px-8 py-4 bg-[#0F172A] text-white rounded-xl font-bold hover:bg-[#1E293B] transition shadow-lg shadow-gray-900/20 group"
              >
                {t("home.instructorCta.becomeInstructor")}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={localeHref("/for-instructors")}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                {t("home.instructorCta.learnMore")}
              </Link>
            </div>
          </div>

          <div className="relative lg:h-[500px] hidden lg:block">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-red-50 to-orange-50 rounded-full blur-3xl -z-10" />

             <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition duration-500">
               <Image
                 src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80"
                 alt="Instructor teaching student"
                 fill
                 sizes="(max-width: 1024px) 0px, 50vw"
                 className="object-cover"
               />

               <div className="absolute bottom-8 left-8 bg-white p-4 rounded-xl shadow-lg flex items-center gap-4">
                 <div className="bg-red-50 p-2 rounded-lg text-[#F03D3D]">
                   <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 font-semibold uppercase">{t("home.instructorCta.monthlyEarnings")}</p>
                   <p className="text-lg font-bold text-gray-900">₾4,500+</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorCTA;
