"use client";

import { MapPin, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

const cityOptions = ["Tbilisi", "Batumi", "Kutaisi", "Rustavi"];

const HeroModern = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  const handleFindInstructors = () => {
    const trimmed = searchInput.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      const matchedCity = cityOptions.find(
        (city) => city.toLowerCase() === trimmed.toLowerCase()
      );
      if (matchedCity) {
        params.set("city", matchedCity);
      } else {
        params.set("search", trimmed);
      }
    }
    const query = params.toString();
    router.push(query ? `/find-instructors?${query}` : "/find-instructors");
  };
  return (
    <section className="relative bg-[#0F172A] text-white overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 -left-32 sm:-left-10 md:left-0 w-2/3 sm:w-1/2 md:w-1/3 h-1/2 bg-blue-500/5 -skew-x-12 transform origin-bottom-left" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-center lg:items-start space-y-8 text-center lg:text-left">
            <div className="mt-6 sm:mt-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200">
              <Star className="w-4 h-4 fill-blue-200" />
              <span>#1 Rated Driving Platform in 2025</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              Master the Road <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F03D3D] to-orange-500">
                With Confidence
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Ditch the anxiety. Connect with elite, patient instructors who tailor every lesson to your learning style. Your license is just a few clicks away.
            </p>

            {/* Search Box */}
            <div className="bg-white p-2 rounded-2xl shadow-xl max-w-[95%] sm:max-w-xl mx-auto lg:mx-0 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by city or instructor" 
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleFindInstructors();
                    }
                  }}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F03D3D]/20"
                />
              </div>
              <Button
                size="lg"
                className="rounded-xl shadow-lg shadow-red-500/20"
                onClick={handleFindInstructors}
              >
                Find Instructors
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#0F172A]" />
                ))}
              </div>
              <p>Join 10,000+ students learning today</p>
            </div>
          </div>

          {/* Right Image/Graphic */}
          <div className="relative hidden lg:block">
            <div className="relative z-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700 shadow-2xl transform rotate-2 hover:rotate-0 transition duration-500">
              {/* Mock UI Card */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-700" />
                <div>
                  <h3 className="text-xl font-bold">Nino Kalandadze</h3>
                  <p className="text-[#F03D3D]">Top Rated Instructor</p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
              <div className="mt-6 flex gap-3">
                <div className="px-4 py-2 rounded-lg bg-[#F03D3D]/10 text-[#F03D3D] text-sm font-medium">Automatic</div>
                <div className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium">Weekend Availability</div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#F03D3D] rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20" />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroModern;
