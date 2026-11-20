"use client";

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { ShieldCheck, LogIn, ExternalLink } from "lucide-react";

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124] transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo section */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-md"
          >
            <img
              src="/avenor-logo.jpg"
              alt="AvenorHub"
              className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen"
            />
            <span className="font-semibold text-lg tracking-tight text-gray-900 dark:text-gray-100">
              Avenor<span className="text-[#0F766E]">Hub</span>
            </span>
          </Link>

          {showNav && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              <Link
                href="/#tokens"
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Design Tokens
              </Link>
              <Link
                href="/#components"
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Components
              </Link>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Auth Screen
              </Link>
            </nav>
          )}
        </div>

        {/* Right utilities: Theme Toggle & Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 dark:focus:ring-offset-[#202124]"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
