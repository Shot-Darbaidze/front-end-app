"use client";

import React from "react";
import { Clock, ChevronRight } from "lucide-react";

export const InstructorUpcomingLessonCard = () => {
    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-red-400 uppercase">Feb</span>
                    <span className="text-base font-bold text-slate-700 group-hover:text-red-600 leading-none">22</span>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-[#F03D3D] transition-colors">Ana Kobiashvili</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>14:00 - 16:00 &bull; Manual</span>
                    </div>
                </div>
            </div>

            <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#F03D3D] transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </button>
        </div>
    );
};
