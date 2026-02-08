import React from "react";
import { Calendar, MapPin, User } from "lucide-react";

export const InstructorNextLessonCard = () => {
  return (
    <div className="bg-gradient-to-br from-[#F03D3D] to-[#d62f2f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium mb-3 backdrop-blur-sm">
              Next Lesson
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">Tomorrow, 10:00 AM</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white/60 text-xs sm:text-sm">Student</p>
              <p className="font-semibold">Sarah Johnson</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white/60 text-xs sm:text-sm">Meeting Point</p>
              <p className="font-semibold truncate">Tbilisi Central Station</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#F03D3D] font-bold shrink-0">
              2h
            </div>
            <div>
              <p className="font-medium text-sm">Manual Transmission</p>
              <p className="text-white/60 text-xs">Standard Lesson</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
