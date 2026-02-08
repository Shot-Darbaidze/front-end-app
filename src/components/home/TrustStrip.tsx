import { Shield, Users, Trophy, Clock } from "lucide-react";

const stats = [
  { label: "Active Students", value: "12k+", icon: Users },
  { label: "Pass Rate", value: "94%", icon: Trophy },
  { label: "Verified Instructors", value: "850+", icon: Shield },
  { label: "Lesson Hours", value: "50k+", icon: Clock },
];

const TrustStrip = () => {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-4 justify-center md:justify-start group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#F03D3D]/10 group-hover:scale-110 transition duration-300">
                <stat.icon className="w-6 h-6 text-gray-400 group-hover:text-[#F03D3D] transition-colors" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
