"use client";

import { useEffect, useState } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  // Read preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("alleycorp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    // Reading localStorage is only possible in the browser (mount), so setState here is correct.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("alleycorp-theme", next ? "dark" : "light");
      return next;
    });
  };

  return { dark, toggle };
}
