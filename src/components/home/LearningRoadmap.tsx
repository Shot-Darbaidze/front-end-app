const steps = [
  {
    id: "01",
    title: "Search & Filter",
    desc: "Enter your city and filter by transmission (manual/auto), price, and rating.",
  },
  {
    id: "02",
    title: "Compare Profiles",
    desc: "Read verified reviews, check car types, and view instructor pass rates.",
  },
  {
    id: "03",
    title: "Book Instantly",
    desc: "Select a time slot that works for you and pay securely through the platform.",
  },
  {
    id: "04",
    title: "Track Progress",
    desc: "Get digital feedback after every lesson and track your readiness for the test.",
  },
];

const LearningRoadmap = () => {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          
          {/* Sticky Header */}
          <div className="md:w-1/3 md:sticky md:top-24">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Your Journey to the Driver's Seat</h2>
            <p className="text-lg text-gray-600 mb-8">
              We've streamlined the process so you can focus on driving, not admin.
            </p>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition">
              Start Your Journey
            </button>
          </div>

          {/* Timeline */}
          <div className="md:w-2/3 space-y-12 relative">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100" />
            
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-20 group">
                {/* Number Bubble */}
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-white border-2 border-gray-100 text-gray-400 font-bold flex items-center justify-center group-hover:border-[#F03D3D] group-hover:text-[#F03D3D] transition duration-300 z-10">
                  {step.id}
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
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
