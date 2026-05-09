"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme: theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative h-8 w-15 rounded-full border border-border bg-secondary hover:border-muted-foreground"
    >
      <div
        className="absolute top-0 bottom-0 my-auto size-7 rounded-full bg-foreground transition-all! duration-200 left-0.5 dark:left-7"
      >
        <span className="sr-only">Toggle theme</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-between px-2.5">
        <svg className="size-3 text-background dark:text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
        <svg className="size-3 dark:text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </button>
  );
}
