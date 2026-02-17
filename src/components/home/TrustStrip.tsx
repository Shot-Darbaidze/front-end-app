import { Shield, Users, Trophy, Clock } from "lucide-react";

const stats = [
  { label: "Active Students", value: "12k+", icon: Users },
  { label: "Pass Rate", value: "94%", icon: Trophy },
  { label: "Verified Instructors", value: "850+", icon: Shield },
  { label: "Lesson Hours", value: "50k+", icon: Clock },
];

const TrustStrip = () => {
  return (
    <section className="bg-gray-100 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3 sm:gap-4 group cursor-default">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#F03D3D]/10 flex items-center justify-center shrink-0 group-hover:bg-[#F03D3D]/20 group-hover:scale-110 transition duration-300">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#F03D3D] transition-colors" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
