"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { apiLogin } from "@/lib/api";
import { getRoleHomePath } from "@/lib/role-access";

export function StandardLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiLogin(email, password);
      if (rememberMe) localStorage.setItem("avenorhub-remember-email", email);
      router.replace(getRoleHomePath(result.user, result.roleConfig));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F3F4F6] text-gray-900 dark:bg-[#111111] dark:text-gray-100 transition-colors">
      {/* Top Bar with Logo and Theme Toggle */}
      <header className="w-full border-b border-[#E5E7EB] bg-white dark:border-gray-800 dark:bg-[#202124] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
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
              href="/admin/login"
              className="text-xs font-medium text-gray-600 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E] hidden sm:flex items-center gap-1"
            >
              <Shield className="h-3.5 w-3.5 text-[#0F766E]" />
              Super Admin
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Centered Login Card */}
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
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sign in to manage your Nigerian business workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Work Email
              </label>
              <div className="relative mt-1.5 rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#111111] dark:text-gray-100 dark:placeholder:text-gray-600"
                  placeholder="you@business.com"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              </p>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <Link
                  href="#forgot-password"
                  className="text-xs font-medium text-[#0F766E] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5 rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#111111] dark:text-gray-100 dark:placeholder:text-gray-600"
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E] dark:border-gray-700 dark:bg-gray-800"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs text-gray-600 dark:text-gray-400"
              >
                Remember me on this browser
              </label>
            </div>

            {/* Teal Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 dark:focus:ring-offset-[#202124] disabled:opacity-70"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Links to /register and /admin/login */}
          <div className="mt-6 border-t border-[#E5E7EB] pt-4 space-y-3 dark:border-gray-800 text-center text-xs">
            <p className="text-gray-600 dark:text-gray-400">
              New business on AvenorHub?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#0F766E] hover:underline"
              >
                Register Business
              </Link>
            </p>

            <div className="pt-1">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0F766E] dark:text-gray-400 dark:hover:text-[#0F766E]"
              >
                <Shield className="h-3.5 w-3.5 text-[#0F766E]" />
                <span>Super Admin Portal Login &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-[#202124] py-3 text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 AvenorHub Nigeria. Enterprise POS & Business Management.</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]"></span>
            Multi-Tenant Operational Hub
          </span>
        </div>
      </footer>
    </div>
  );
}

export default StandardLogin;
