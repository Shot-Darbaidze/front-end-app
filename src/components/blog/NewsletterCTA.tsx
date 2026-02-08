import { Mail, Sparkles } from "lucide-react";

const NewsletterCTA = () => {
  return (
    <section className="py-20 px-6 bg-[#0F172A]">
      <div className="max-w-4xl mx-auto relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#F03D3D] to-orange-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 md:p-16 text-center border border-gray-800 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F03D3D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-2xl mb-8 border border-gray-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-8 h-8 text-[#F03D3D]" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Don't Miss a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F03D3D] to-orange-500">Gear Shift</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join 15,000+ learners getting weekly driving tips, test updates, and exclusive discounts delivered straight to their inbox.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <div className="flex-grow relative">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full px-6 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-[#F03D3D] focus:ring-1 focus:ring-[#F03D3D] transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="px-8 py-4 bg-[#F03D3D] hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Subscribe
              </button>
            </form>
            
            <p className="text-gray-500 text-sm mt-6">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
