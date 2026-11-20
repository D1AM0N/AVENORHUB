"use client";

import React, { useEffect, useState } from "react";
import { useTheme, type Theme } from "./theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] p-1 bg-white dark:bg-[#202124] dark:border-gray-800 h-9 w-[108px] ${className}`}
      />
    );
  }

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: "light",
      label: "Light",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      value: "system",
      label: "System",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon className="h-4 w-4" />,
    },
  ];

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={`inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-1 text-gray-600 dark:border-gray-800 dark:bg-[#202124] dark:text-gray-300 ${className}`}
    >
      {options.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={`Switch to ${option.label} theme`}
            title={`Switch to ${option.label} theme${
              option.value === "system" ? ` (currently ${resolvedTheme})` : ""
            }`}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              isActive
                ? "bg-[#0F766E] text-white shadow-xs"
                : "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800/80 dark:hover:text-white"
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
