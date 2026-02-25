"use client";

import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocaleHref } from "@/hooks/useLocaleHref";

const ModernSuccess = () => {
  const localeHref = useLocaleHref();
  return (
    <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-gray-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 border border-gray-700 shadow-2xl">
        <Check className="w-12 h-12 text-[#F03D3D] animate-in zoom-in duration-700 delay-150" strokeWidth={3} />
      </div>
      
      <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Application Submitted!</h2>
      
      <p className="text-gray-400 max-w-lg mb-10 text-xl leading-relaxed">
        Thank you for applying to join <span className="text-white font-semibold">Instruktori</span>. Our team will review your documents and get back to you within 24-48 hours.
      </p>
      
      <Link
        href={localeHref("/")} 
        className="inline-flex items-center px-8 py-4 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/20 group text-lg"
      >
        Return to Home
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};

export default ModernSuccess;
