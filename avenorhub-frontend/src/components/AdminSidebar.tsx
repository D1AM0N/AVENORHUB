"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearSession } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  Settings,
  LogOut,
  PlusCircle,
} from "lucide-react";

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className = "" }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Businesses", href: "/admin/businesses", icon: Building2 },
    { name: "Administrators", href: "/admin/administrators", icon: Users },
    { name: "Platform Activity", href: "/admin/activity", icon: Activity },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside
      className={`flex w-64 flex-col border-r border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124] shrink-0 transition-colors ${className}`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-[#E5E7EB] dark:border-gray-800">
        <img
          src="/avenor-logo.jpg"
          alt="AvenorHub"
          className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen"
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100">
            Avenor<span className="text-[#0F766E]">Hub</span>
          </span>
          <span className="text-[10px] font-semibold text-[#0F766E]">
            Control Center
          </span>
        </div>
      </div>

      {/* Quick Action */}
      <div className="p-3">
        <Link
          href="/admin/businesses/create"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-3 py-2 text-xs font-medium text-white hover:bg-teal-800 transition-colors shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Business</span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Super Admin Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#0F766E] text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/80 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-[#E5E7EB] p-2 dark:border-gray-800">
        <Link
          href="/admin/login"
          onClick={clearSession}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[#0F766E] hover:bg-[#0F766E]/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout Portal</span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
