"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Shield, User } from "lucide-react";
import { clearSession } from "@/lib/api";
import { getStoredSession, type StoredSession } from "@/lib/api";

export default function TenantIdentity({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  if (!session) return null;

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="relative" ref={profileRef}>
      <button type="button" aria-expanded={isMenuOpen} aria-haspopup="menu" onClick={() => setIsMenuOpen((open) => !open)} className="flex min-h-10 min-w-10 items-center justify-center gap-3 rounded-lg p-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800">
        {!compact && <span className="max-w-48 text-right">
          <span className="block truncate text-sm font-semibold text-[#202124] dark:text-white">{session.tenant?.name}</span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{session.user.name} · {session.user.email}</span>
        </span>}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-sm font-bold text-white">
          {session.user.name.slice(0, 1).toUpperCase()}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {isMenuOpen && <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#202124]">
        <div className="border-b border-[#E5E7EB] px-2 py-1.5 dark:border-gray-800">
          <p className="truncate text-xs font-semibold text-[#202124] dark:text-white">{session.user.name}</p>
          <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{session.user.email}</p>
          <p className="mt-1 text-[11px] capitalize text-gray-500 dark:text-gray-400">{session.user.role.replaceAll("_", " ")}</p>
          <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-[#0F766E]/10 px-2 py-1 text-[11px] font-semibold text-[#0F766E]">{session.tenant?.name}</span>
        </div>
        {session.user.role === "tenant_admin" && <Link role="menuitem" href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><User className="h-3.5 w-3.5" />Settings</Link>}
        {session.user.role === "tenant_admin" && <Link role="menuitem" href="/roles" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Shield className="h-3.5 w-3.5" />Roles &amp; permissions</Link>}
        <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); signOut(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-[#0F766E] hover:bg-[#0F766E]/10"><LogOut className="h-3.5 w-3.5" />Logout</button>
      </div>}
    </div>
  );
}
