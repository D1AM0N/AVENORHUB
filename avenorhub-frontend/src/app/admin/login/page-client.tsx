"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { apiLogin, clearSession } from "@/lib/api";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiLogin(email, password);
      if (result.user.role !== "super_admin") {
        clearSession();
        throw new Error("This account does not have Super Admin access.");
      }
      router.replace("/admin/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F3F4F6] text-gray-900 dark:bg-[#111111] dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="w-full border-b border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin/login" className="flex items-center gap-2.5">
            <img
              src="/avenor-logo.jpg"
              alt="AvenorHub"
              className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen"
            />
            <span className="font-semibold text-base text-gray-900 dark:text-gray-100">
              Avenor<span className="text-[#0F766E]">Hub</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-gray-600 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E] flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Standard Login
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-6 sm:p-8 dark:border-gray-800 dark:bg-[#202124] shadow-xs">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-3">
              <img
                src="/avenor-logo.jpg"
                alt="AvenorHub"
                className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen"
              />
            </div>

            {/* Platform Administration Pill Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-semibold text-[#0F766E]">
              <Shield className="h-3.5 w-3.5" />
              Platform Administration
            </span>

            {/* Super Admin Portal Heading */}
            <h1 className="mt-3 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Super Admin Portal
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Root control center for enterprise tenant management
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            {/* Admin Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Admin Email
              </label>
              <div className="relative mt-1.5 rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#111111] dark:text-gray-100"
                  placeholder="administrator@platform.com"
                />
              </div>
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative mt-1.5 rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-10 text-sm text-gray-900 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#111111] dark:text-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Access Platform Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 dark:focus:ring-offset-[#202124] disabled:opacity-70"
            >
              <span>{loading ? "Authenticating..." : "Access Platform"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Return to standard login link */}
          <div className="mt-6 border-t border-[#E5E7EB] pt-4 text-center dark:border-gray-800">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to standard login</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-[#202124] py-3 text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 AvenorHub Nigeria Platform Operations.</span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-[#0F766E]" />
            Restricted Infrastructure Access
          </span>
        </div>
      </footer>
    </div>
  );
}
