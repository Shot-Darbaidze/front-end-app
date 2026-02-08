import { Calendar, Wallet, Users, Shield, TrendingUp } from "lucide-react";

const BenefitsGrid = () => {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-[#F03D3D] font-medium text-sm mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>Grow Your Business</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Everything you need to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F03D3D] to-orange-600">run your driving school</span>
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Stop chasing payments and scheduling via text. We provide the professional tools you need to focus on what you do best—teaching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          
          {/* Card 1: Earnings (Large) */}
          <div className="md:col-span-2 bg-gray-900 rounded-3xl p-8 md:p-10 relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#F03D3D] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6">
                  <Wallet className="w-7 h-7" />
                </div>
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                  +45% Revenue
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold mb-4">Keep more of what you earn</h3>
                <p className="text-gray-400 text-lg max-w-lg mb-8">
                  Set your own hourly rates. We handle payments automatically, so you never have to ask a student for cash again.
                </p>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white">0%</span>
                    <span className="text-sm text-gray-400">Hidden Fees</span>
                  </div>
                  <div className="w-px bg-gray-700" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white">24h</span>
                    <span className="text-sm text-gray-400">Payout Time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Smart Scheduling (Tall) */}
          <div className="md:row-span-2 bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-[#F03D3D] mb-6">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Scheduling</h3>
              <p className="text-gray-500 mb-8">
                Set your working hours and let students book open slots instantly. Syncs with Google Calendar.
              </p>
              
              {/* Mock Calendar UI */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-900">Today</span>
                  <span className="text-xs text-gray-400">Oct 24</span>
                </div>
                <div className="space-y-3">
                  {[
                    { time: "09:00", student: "Nika G.", type: "Manual", color: "bg-blue-50 border-blue-100 text-blue-700" },
                    { time: "11:30", student: "Mariam K.", type: "Auto", color: "bg-orange-50 border-orange-100 text-orange-700" },
                    { time: "14:00", student: "Luka M.", type: "Manual", color: "bg-blue-50 border-blue-100 text-blue-700" },
                  ].map((slot, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${slot.color} flex justify-between items-center text-sm`}>
                      <span className="font-medium">{slot.time}</span>
                      <span>{slot.student}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Student Acquisition */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-[#F03D3D]/20 hover:shadow-lg transition-all duration-300 group">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Student Pipeline</h3>
            <p className="text-gray-500">
              We spend thousands on marketing so you don't have to. Get a steady stream of new students.
            </p>
          </div>

          {/* Card 4: Protection */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-[#F03D3D]/20 hover:shadow-lg transition-all duration-300 group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Cancellation Protection</h3>
            <p className="text-gray-500">
              Get paid even if a student cancels last minute. Our strict policy protects your time and income.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BenefitsGrid;
