"use client";

import { useEffect } from "react";

/**
 * Reads the stored theme preference from localStorage and applies the `dark`
 * class to <html> before the first paint. Placed in the root layout so it
 * runs on every page — including /portfolio which has no AppSidebar.
 */
export function DarkModeInit() {
  useEffect(() => {
    const stored = localStorage.getItem("alleycorp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return null;
}
