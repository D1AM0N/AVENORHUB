"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface LoginCardProps {
  redirectOnSuccess?: boolean;
}

export function LoginCard({ redirectOnSuccess = false }: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatusMessage({
        type: "error",
        text: "Please enter both email and password.",
      });
      return;
    }

    setStatusMessage({
      type: "success",
      text: "Authenticated successfully. Redirecting to workspace...",
    });
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-6 sm:p-8 dark:border-gray-800 dark:bg-[#202124] shadow-xs">
      {/* Header with Logo */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center p-2">
          <img
            src="/avenor-logo.jpg"
            alt="AvenorHub"
            className="h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen"
          />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Sign in to AvenorHub
        </h1>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Enterprise operational hub & administrative controls
        </p>
      </div>

      {/* Status banner if triggered */}
      {statusMessage && (
        <div
          className={`mt-5 flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
            statusMessage.type === "success"
              ? "border-[#16A34A]/20 bg-[#16A34A]/10 text-[#16A34A]"
              : statusMessage.type === "warning"
              ? "border-[#D97706]/20 bg-[#D97706]/10 text-[#D97706]"
              : "border-[#DC2626]/20 bg-[#DC2626]/10 text-[#DC2626]"
          }`}
          role="alert"
        >
          {statusMessage.type === "success" && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
          )}
          {statusMessage.type === "warning" && (
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706]" />
          )}
          {statusMessage.type === "error" && (
            <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <div className="relative mt-1.5 rounded-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#111111] dark:text-gray-100 dark:placeholder:text-gray-600"
              placeholder="you@business.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <a
              href="#forgot-password"
              className="text-xs font-medium text-[#0F766E] hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative mt-1.5 rounded-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] dark:border-gray-800 dark:bg-[#111111] dark:text-gray-100 dark:placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E] dark:border-gray-700 dark:bg-gray-800"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-xs text-gray-600 dark:text-gray-400"
            >
              Remember this device
            </label>
          </div>
        </div>

        {/* Primary Accent Button */}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 dark:focus:ring-offset-[#202124]"
        >
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 border-t border-[#E5E7EB] pt-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        Need technical access?{" "}
        <a href="#support" className="font-medium text-[#0F766E] hover:underline">
          Contact workspace administrator
        </a>
      </div>
    </div>
  );
}

export default LoginCard;
