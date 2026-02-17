"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const steps = [
  {
    id: "1",
    title: "Search & Filter",
    desc: "Enter your city and filter by transmission (manual/auto), price, and rating.",
  },
  {
    id: "2",
    title: "Compare Profiles",
    desc: "Read verified reviews, check car types, and view instructor pass rates.",
  },
  {
    id: "3",
    title: "Book Instantly",
    desc: "Select a time slot that works for you and pay securely through the platform.",
  },
  {
    id: "4",
    title: "Track Progress",
    desc: "Get digital feedback after every lesson and track your readiness for the test.",
  },
];

const LearningRoadmap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !carRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress: 0 when element top enters viewport, 1 when element bottom leaves
      const progress = Math.min(Math.max((windowHeight/2 - rect.top) / rect.height, 0), 0.90);
      
      // Direct DOM manipulation for smooth performance (bypasses React render cycle)
      carRef.current.style.top = `${progress * 100}%`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          
          {/* Sticky Header */}
          <div className="md:w-1/3 md:sticky md:top-24">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Your Journey to the Driver's Seat</h2>
            <p className="text-lg text-gray-600 mb-8">
              We've streamlined the process so you can focus on driving, not admin.
            </p>
            <Link 
              href="/find-instructors"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
            >
              Start Your Journey
            </Link>
          </div>

          {/* Timeline */}
          <div ref={containerRef} className="md:w-2/3 space-y-12 relative pl-8 pb-12">
            
            {/* The Road */}
            <div className="absolute left-[3.5rem] top-0 bottom-0 w-16 -translate-x-1/2 bg-gray-800 rounded-full border-x-4 border-gray-900 overflow-hidden shadow-inner">
               {/* Center white dashed line - animated */}
               <div className="absolute left-1/2 top-0 bottom-0 w-0 border-l-[4px] border-dashed border-white/40 -translate-x-1/2" />
               
               {/* Animated Car */}
               <div 
                 ref={carRef}
                 className="absolute left-1/2 -translate-x-1/2 w-10 h-16 transition-transform duration-75 ease-out leading-none z-20 will-change-[top]"
                 style={{ top: '0%' }}
               >
                 {/* Red Car SVG - Rounded/Beetle Style - Facing Down */}
                 <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-xl transform rotate-180">
                    
                    {/* Main Body - Very Rounded */}
                    <path d="M15 50 Q15 20 50 20 Q85 20 85 50 L85 150 Q85 185 50 185 Q15 185 15 150 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
                    
                    {/* Cabin/Roof Area - Rounded */}
                    <path d="M20 65 Q20 55 50 55 Q80 55 80 65 L75 135 Q75 145 50 145 Q25 145 25 135 Z" fill="#DC2626" />
                    
                    {/* Windshield - Curved */}
                    <path d="M22 70 Q50 65 78 70 L75 90 Q50 85 25 90 Z" fill="#93C5FD" opacity="0.9" />
                    
                    {/* Rear Window - Curved */}
                    <path d="M28 120 Q50 115 72 120 L70 130 Q50 135 30 130 Z" fill="#1E3A8A" opacity="0.8" />

                    {/* Brake Lights - Oval */}
                    <ellipse cx="25" cy="178" rx="8" ry="4" fill="#7F1D1D" />
                    <ellipse cx="75" cy="178" rx="8" ry="4" fill="#7F1D1D" />
                    
                    {/* Headlights - Round */}
                    <circle cx="25" cy="35" r="8" fill="#FEF08A" />
                    <circle cx="75" cy="35" r="8" fill="#FEF08A" />
                 </svg>
               </div>
            </div>
            
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-24 group">
                <div className="relative bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100 ml-6">
                  {/* Step ID Badge on the box - "Give Way" Sign Shape (Inverted Triangle) */}
                  <div className="absolute top-1/2 -left-7 -translate-y-1/2 w-[3.25rem] h-[3.25rem] flex items-center justify-center transform group-hover:scale-110 transition z-10 drop-shadow-md">
                    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-sm">
                      {/* Inverted Triangle (Give Way Shape) - White Fill, Red Border */}
                      <path d="M5 5 L95 5 L50 90 Z" fill="white" stroke="#F03D3D" strokeWidth="10" strokeLinejoin="round" />
                    </svg>
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85%] -mt-px ml-[0.5px] text-black font-extrabold text-sm">{step.id}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 pl-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed pl-2">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
