"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Shield, User } from "lucide-react";
import { clearSession, getStoredSession, type StoredSession } from "@/lib/api";
import { getRoleHomePath } from "@/lib/role-access";
import { ThemeToggle } from "./theme-toggle";

interface TenantHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function TenantHeader({ onToggleSidebar }: TenantHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setSession(getStoredSession()));
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [isMenuOpen]);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124]">
      <div className="flex h-14 items-center justify-between px-3 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onToggleSidebar && <button onClick={onToggleSidebar} type="button" className="min-h-10 min-w-10 rounded-lg p-1.5 text-[#202124] hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 md:hidden" aria-label="Toggle navigation sidebar"><Menu className="h-5 w-5" /></button>}
          <Link href={session ? getRoleHomePath(session.user, session.roleConfig) : "/login"} className="shrink-0">
            <img src="/avenor-logo.jpg" alt="AvenorHub" className="h-8 w-auto rounded-sm object-contain dark:invert dark:mix-blend-screen" />
          </Link>
          <div className="min-w-0 border-l border-[#E5E7EB] pl-3 dark:border-gray-700">
            <p className="truncate text-sm font-bold text-[#202124] dark:text-white">{session?.tenant?.name}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#0F766E]">Business workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsMenuOpen((open) => !open)} type="button" aria-expanded={isMenuOpen} aria-haspopup="menu" className="flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F766E] text-xs font-semibold text-white">{session?.user.name.slice(0, 1).toUpperCase()}</span>
              <span className="hidden max-w-48 text-left md:block">
                <span className="block truncate text-xs font-semibold text-[#202124] dark:text-white">{session?.user.name}</span>
                <span className="block truncate text-[10px] text-gray-500 dark:text-gray-400">{session?.user.email}</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {isMenuOpen && <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#202124]">
                <div className="border-b border-[#E5E7EB] px-2 py-1.5 dark:border-gray-800">
                  <p className="truncate text-xs font-semibold text-[#202124] dark:text-white">{session?.user.name}</p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{session?.user.email}</p>
                  <p className="mt-1 text-[11px] capitalize text-gray-500 dark:text-gray-400">{session?.user.role.replaceAll("_", " ")}</p>
                  <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-[#0F766E]/10 px-2 py-1 text-[11px] font-semibold text-[#0F766E]">{session?.tenant?.name}</span>
                </div>
                {session?.user.role === "tenant_admin" && <Link role="menuitem" href="/roles" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Shield className="h-3.5 w-3.5" />Roles &amp; permissions</Link>}
                {session?.user.role === "tenant_admin" && <Link role="menuitem" href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><User className="h-3.5 w-3.5" />Settings</Link>}
                <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); signOut(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><LogOut className="h-3.5 w-3.5" />Logout</button>
              </div>}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TenantHeader;
