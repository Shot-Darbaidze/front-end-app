import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import Image from 'next/image';

const benefits = [
  "Grow your student base",
  "Set your own schedule",
  "Guaranteed payments",
  "Professional tools"
];

const InstructorCTA = () => {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-[85rem] mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-[#F03D3D] font-semibold text-sm">
                For Instructors
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F03D3D] to-orange-500">
                  Want to become an instructor?
                </span> <br/>
                Start teaching today.
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
                Join the fastest-growing driving school platform. We handle the marketing and booking, so you can focus on teaching.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-md mx-auto lg:mx-0 lg:max-w-none justify-items-center lg:justify-items-start">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 w-fit">
                  <CheckCircle2 className="w-5 h-5 text-[#F03D3D] shrink-0" />
                  <span className="font-medium text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/for-instructors"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#0F172A] text-white rounded-xl font-bold hover:bg-[#1E293B] transition shadow-lg shadow-gray-900/20 group"
              >
                Become an Instructor
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/for-instructors"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative lg:h-[500px] hidden lg:block">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-red-50 to-orange-50 rounded-full blur-3xl -z-10" />

             <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition duration-500">
               <Image
                 src="https://images.unsplash.com/photo-1580273916550-e323be2ebcc6?auto=format&fit=crop&w=800&q=80"
                 alt="Instructor teaching student"
                 fill
                 sizes="(max-width: 1024px) 0px, 50vw"
                 className="object-cover"
               />

               <div className="absolute bottom-8 left-8 bg-white p-4 rounded-xl shadow-lg flex items-center gap-4">
                 <div className="bg-red-50 p-2 rounded-lg text-[#F03D3D]">
                   <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 font-semibold uppercase">Monthly Earnings</p>
                   <p className="text-lg font-bold text-gray-900">₾4,500+</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorCTA;
