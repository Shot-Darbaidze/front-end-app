import { Search, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const BlogHero = () => {
  return (
    <section className="relative bg-[#0F172A] text-white overflow-hidden pt-32 pb-20">
      {/* Abstract Background Shapes - Inspired by Main Page */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/5 -skew-x-12 transform origin-bottom-left" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 mb-6">
              <Sparkles className="w-4 h-4 fill-blue-200" />
              <span>New Articles Weekly</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Driving Knowledge <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F03D3D] to-orange-500">
                Simplified
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
              From passing your theory test to mastering parallel parking. Get the expert advice you need to become a confident driver.
            </p>

            <div className="bg-white/5 p-2 rounded-2xl border border-white/10 max-w-md flex items-center gap-2 backdrop-blur-sm">
              <Search className="ml-3 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 outline-none h-10"
              />
              <button className="px-6 py-2 bg-[#F03D3D] hover:bg-red-600 text-white rounded-xl font-medium transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Right Featured Card - Inspired by HeroModern's card */}
          <div className="relative">
            <div className="relative z-10 bg-gray-800/50 border border-gray-700 rounded-3xl p-8 backdrop-blur-xl hover:border-[#F03D3D]/50 transition duration-500 group">
              <div className="absolute top-6 right-6 bg-[#F03D3D] text-white text-xs font-bold px-3 py-1 rounded-full">
                FEATURED
              </div>
              
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                <Sparkles className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold mb-4 group-hover:text-[#F03D3D] transition-colors">
                10 Essential Tips to Pass Your Driving Test First Time
              </h2>
              
              <p className="text-gray-400 mb-6 line-clamp-3">
                Nervous about your upcoming driving test? We've compiled the ultimate guide to help you prepare, stay calm, and impress your examiner.
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600" />
                  <span className="text-sm text-gray-300">Sarah Jenkins</span>
                </div>
                <Link href="/blog/post-1" className="flex items-center text-[#F03D3D] font-medium hover:gap-2 transition-all">
                  Read Article <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
            
            {/* Glow effects */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F03D3D] rounded-full blur-3xl opacity-10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10" />
          </div>

        </div>
      </div>
    </section>
  );
};

export default BlogHero;
