import { Zap, ShieldCheck, Wallet, Map } from "lucide-react";

const BentoFeatures = () => {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Everything you need to pass</h2>
          <p className="text-xl text-gray-600">Smart tools for modern learners</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          {/* Large Feature - Left */}
          <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition duration-500" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Instant Booking System</h3>
                <p className="text-gray-600 max-w-md">
                  No more back-and-forth texts. View real-time availability and book your slots instantly. Syncs directly with your calendar.
                </p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Tall Feature - Right */}
          <div className="md:row-span-2 bg-[#0F172A] rounded-3xl p-8 shadow-sm text-white relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Verified & Vetted</h3>
              <p className="text-gray-400 mb-8">
                Every instructor undergoes a rigorous 15-point verification process including:
              </p>
              <ul className="space-y-4 text-gray-300 flex-1">
                {['Background Checked', 'Certified Instructor', 'Identity Verified', 'Vehicle Insured', 'Reviews Audited'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F03D3D]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Small Feature 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-[#F03D3D]/30 transition group">
            <Wallet className="w-10 h-10 text-[#F03D3D] mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-bold mb-2">Transparent Pricing</h3>
            <p className="text-gray-600 text-sm">Pay per lesson or save with bulk packages. No hidden fees.</p>
          </div>

          {/* Small Feature 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-[#F03D3D]/30 transition group">
            <Map className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-bold mb-2">Local Experts</h3>
            <p className="text-gray-600 text-sm">Instructors who know the test routes in Tbilisi, Batumi, and Kutaisi.</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;
