import React from "react";
import { UserPlus, CalendarPlus, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";

const actions = [
  { 
    icon: UserPlus, 
    label: "Add Student", 
    desc: "Register new student",
    href: "/dashboard/students/add",
    color: "bg-blue-50 text-blue-600"
  },
  { 
    icon: CalendarPlus, 
    label: "Schedule Lesson", 
    desc: "Book a time slot",
    href: "/dashboard/schedule",
    color: "bg-purple-50 text-purple-600"
  },
  { 
    icon: MessageSquare, 
    label: "Messages", 
    desc: "Chat with students",
    href: "/dashboard/messages",
    color: "bg-orange-50 text-orange-600"
  },
  { 
    icon: DollarSign, 
    label: "Earnings", 
    desc: "View financial report",
    href: "/dashboard/earnings",
    color: "bg-green-50 text-green-600"
  },
];

export const InstructorQuickActions = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, idx) => (
        <Link 
          key={idx} 
          href={action.href}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${action.color}`}>
            <action.icon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900">{action.label}</h4>
          <p className="text-xs text-gray-500">{action.desc}</p>
        </Link>
      ))}
    </div>
  );
};
