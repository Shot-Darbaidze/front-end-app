"use client";

import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Testimonials = () => {
  const { t } = useLanguage();
  
  const TESTIMONIALS = [
    {
      name: "Giorgi B.",
      role: `${t("testimonials.since")} 2023`,
      image: undefined,
      content: t("testimonials.testimonial1"),
      rating: 5
    },
    {
      name: "Nino K.",
      role: `${t("testimonials.since")} 2024`,
      image: undefined,
      content: t("testimonials.testimonial2"),
      rating: 5
    },
    {
      name: "David G.",
      role: `${t("testimonials.since")} 2023`,
      image: undefined,
      content: t("testimonials.testimonial3"),
      rating: 5
    }
  ];

  return (
    <div className="py-20 px-6 bg-[#0F172A]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-gray-400 text-lg">
            {t("testimonials.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
              <Quote className="absolute top-4 right-4 md:top-6 md:right-6 w-6 h-6 md:w-8 md:h-8 text-[#F03D3D]/20 fill-[#F03D3D]/20 md:text-[#F03D3D] md:fill-[#F03D3D]" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
