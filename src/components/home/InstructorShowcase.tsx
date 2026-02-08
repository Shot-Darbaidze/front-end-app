import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";

const InstructorShowcase = () => {
  return (
    <section className="relative py-24 px-6 bg-[#0F172A] text-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Top Instructors</h2>
            <p className="text-gray-400">Highly rated professionals ready to teach you.</p>
          </div>
          <Link href="/find-instructors" className="hidden md:flex items-center text-[#F03D3D] hover:text-white transition">
            View all instructors <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-[#F03D3D]/50 transition group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-600" />
                <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-lg border border-gray-700">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold">4.9</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-1">Giorgi Beridze</h3>
              <p className="text-sm text-gray-400 mb-4">Specializes in Nervous Students</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-gray-700 text-xs text-gray-300">Manual</span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-xs text-gray-300">Georgian & English</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div>
                  <span className="text-lg font-bold">₾35</span>
                  <span className="text-sm text-gray-500">/hr</span>
                </div>
                <button className="text-sm font-medium text-[#F03D3D] group-hover:text-white transition">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link href="/find-instructors" className="inline-flex items-center text-[#F03D3D]">
            View all instructors <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default InstructorShowcase;
