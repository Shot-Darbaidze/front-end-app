"use client";

import React from "react";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">Dashboard</h1>
        <div className="relative max-w-md w-full ml-8 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search students, lessons..."
            className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F03D3D] rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-gray-900">{user?.name || "Instructor"}</div>
            <div className="text-xs text-gray-500">Pro Instructor</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F03D3D] flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
            {user?.name?.[0] || "I"}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
};
