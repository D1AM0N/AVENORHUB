"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Shield, Menu, LogOut, ChevronDown, User } from "lucide-react";
import { clearSession, getStoredSession, type StoredSession } from "@/lib/api";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setSession(getStoredSession()));
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [userMenuOpen]);

  function signOut() {
    clearSession();
    router.replace("/admin/login");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124] transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand / Sidebar toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              type="button"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <img
              src="/avenor-logo.jpg"
              alt="AvenorHub"
              className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100 hidden sm:inline">
                Avenor<span className="text-[#0F766E]">Hub</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[#0F766E]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                <Shield className="h-3 w-3" />
                Super Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <ThemeToggle />

          {/* User profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              type="button"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F766E] text-white text-xs font-semibold">
                {session?.user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden text-left text-xs md:block">
                <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {session?.user.name}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                  {session?.user.email}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div role="menu" className="absolute right-0 mt-2 z-50 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#202124]">
                  <div className="px-2 py-1.5 border-b border-[#E5E7EB] dark:border-gray-800 mb-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {session?.user.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {session?.user.email}
                    </p>
                    <p className="mt-1 text-[11px] capitalize text-gray-500 dark:text-gray-400">
                      {session?.user.role.replaceAll("_", " ")}
                    </p>
                    <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-[#0F766E]/10 px-2 py-1 text-[11px] font-semibold text-[#0F766E]">
                      {session?.tenant?.name ?? "Platform-wide"}
                    </span>
                  </div>
                  <Link
                    role="menuitem"
                    href="/admin/dashboard#settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <User className="h-3.5 w-3.5" />
                    Security Settings
                  </Link>
                  <div className="border-t border-[#E5E7EB] dark:border-gray-800 mt-1 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#0F766E] hover:bg-[#0F766E]/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
