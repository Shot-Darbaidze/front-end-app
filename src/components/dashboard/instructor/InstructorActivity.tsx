"use client";

import React from "react";
import { UserPlus, CheckCircle2, DollarSign, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const InstructorActivity = () => {
    const { t } = useLanguage();

    const activities = [
        {
            id: 1,
            type: "lesson_completed",
            title: "Lesson Completed",
            subtitle: "with Ana Kobiashvili",
            time: "2 hours ago",
            icon: CheckCircle2,
            gradient: "from-emerald-500 to-teal-600",
            amount: "+₾80",
        },
        {
            id: 2,
            type: "new_student",
            title: "New Student",
            subtitle: "Giorgi Maisuradze booked",
            time: "5 hours ago",
            icon: UserPlus,
            gradient: "from-blue-500 to-indigo-600",
            amount: null,
        },
        {
            id: 3,
            type: "withdrawal",
            title: "Earnings Withdrawn",
            subtitle: "To Bank Account ending in 4211",
            time: "1 day ago",
            icon: Wallet,
            gradient: "from-purple-500 to-violet-600",
            amount: "-₾450",
        },
        {
            id: 4,
            type: "lesson_completed",
            title: "Lesson Completed",
            subtitle: "with Mariam Gelashvili",
            time: "1 day ago",
            icon: CheckCircle2,
            gradient: "from-emerald-500 to-teal-600",
            amount: "+₾80",
        },
    ];

    return (
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full">
            {/* Background glow effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        Latest Activity
                    </h2>
                </div>

                <div className="relative pl-3 space-y-8">
                    {/* Vertical Timeline Line */}
                    <div className="absolute top-2 bottom-2 left-5 w-px bg-slate-200" />

                    {activities.map((activity) => (
                        <div key={activity.id} className="relative flex items-start gap-4 group">
                            {/* Timeline dot/icon */}
                            <div className="relative z-10 w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${activity.gradient}`} />
                                <activity.icon className={`w-4 h-4 text-slate-700 group-hover:text-blue-600 transition-colors drop-shadow-sm`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {activity.title}
                                        </p>
                                        <p className="text-[13px] text-slate-500 truncate mt-0.5">
                                            {activity.subtitle}
                                        </p>
                                    </div>
                                    {activity.amount && (
                                        <span className={`text-sm font-semibold shrink-0 ${activity.amount.startsWith("+") ? "text-emerald-600" : "text-slate-600"
                                            }`}>
                                            {activity.amount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-medium">
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
