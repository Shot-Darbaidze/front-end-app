import React from "react";
import { Users, Clock, Calendar, DollarSign } from "lucide-react";

export const InstructorStats = () => {
  // Mock data - replace with real data later
  const stats = [
    {
      label: "Active Students",
      value: "8",
      subtext: "Currently teaching",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Hours Taught",
      value: "124h",
      subtext: "Total time",
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Upcoming",
      value: "5",
      subtext: "Scheduled lessons",
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Earnings",
      value: "$1,250",
      subtext: "This month",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-start transition-all hover:shadow-md"
        >
          <div className={`p-3 rounded-xl ${stat.bg} mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h4 className="text-2xl font-bold text-gray-900">{stat.value}</h4>
            <p className="text-xs text-gray-400">{stat.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
