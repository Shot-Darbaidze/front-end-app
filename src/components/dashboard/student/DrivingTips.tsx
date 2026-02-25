"use client";

import React, { useState, useCallback } from "react";
import { Lightbulb, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const tips = [
    {
        category: "Exam Prep",
        title: "Mirror Check Habit",
        body: "Before every turn or lane change, practice the sequence: interior mirror → side mirror → blind spot. Examiners watch for this specifically.",
        accent: "bg-blue-100 text-blue-600 border-blue-200",
    },
    {
        category: "City Driving",
        title: "Scanning Intersections",
        body: "Approach every intersection looking left-right-left, even on green. Most urban accidents happen at intersections from cross traffic.",
        accent: "bg-emerald-100 text-emerald-600 border-emerald-200",
    },
    {
        category: "Parking",
        title: "Reference Points Matter",
        body: "When parallel parking, align your side mirror with the other car's rear bumper before turning. This gives you the perfect entry angle every time.",
        accent: "bg-purple-100 text-purple-600 border-purple-200",
    },
    {
        category: "Safety",
        title: "The 3-Second Rule",
        body: "Pick a fixed point on the road. When the car ahead passes it, count '1-Mississippi, 2-Mississippi, 3-Mississippi.' If you pass it before finishing, you're too close.",
        accent: "bg-orange-100 text-orange-600 border-orange-200",
    },
    {
        category: "Confidence",
        title: "Smooth Braking",
        body: "Start braking gently, increase pressure in the middle, then ease off just before stopping. This avoids the jerky stop that makes passengers uncomfortable.",
        accent: "bg-red-50 text-[#F03D3D] border-red-200",
    },
];

export const DrivingTips = () => {
    const [currentTip, setCurrentTip] = useState(0);

    const nextTip = useCallback(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
    }, []);

    const prevTip = useCallback(() => {
        setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);
    }, []);

    const tip = tips[currentTip];

    return (
        <div className="relative bg-white rounded-3xl p-6 overflow-hidden shadow-xl border border-slate-200 group h-[290px] flex flex-col">
            {/* Subtle background glow */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-full blur-3xl opacity-60 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-amber-600 tracking-widest uppercase block">
                            Driving Tip
                        </span>
                        <p className="text-[11px] text-slate-400">
                            {currentTip + 1} of {tips.length}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={prevTip}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={nextTip}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Category badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${tip.accent}`}>
                <Sparkles className="w-3 h-3" />
                {tip.category}
            </div>

            {/* Tip content */}
            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{tip.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{tip.body}</p>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center gap-1.5 mt-auto pt-5">
                {tips.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentTip(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentTip
                            ? "w-6 bg-[#F03D3D]"
                            : "w-1.5 bg-slate-200 hover:bg-slate-300"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
