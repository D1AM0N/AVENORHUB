"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

export const STORAGE_KEY = "avenor-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeScript() {
  const scriptContent = `
    (function() {
      try {
        var key = '${STORAGE_KEY}';
        var stored = localStorage.getItem(key);
        var theme = stored || 'system';
        var isDark = false;
        if (theme === 'dark') {
          isDark = true;
        } else if (theme === 'system') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((activeTheme: Theme) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let isDark = false;

    if (activeTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = activeTheme === "dark";
    }

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    setResolvedTheme(isDark ? "dark" : "light");
  }, []);

  // Initialize from localStorage once mounted
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) as Theme | null;
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        setThemeState(saved);
        applyTheme(saved);
        return;
      }
    } catch {
      // Ignore localStorage read errors
    }
    applyTheme(defaultTheme);
  }, [storageKey, defaultTheme, applyTheme]);

  // Handle system preference changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // Ignore localStorage write errors
      }
      setThemeState(newTheme);
      applyTheme(newTheme);
    },
    [storageKey, applyTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
