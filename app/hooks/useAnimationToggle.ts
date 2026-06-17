"use client";

import { useEffect, useState } from "react";

export const ANIMATION_TOGGLE_EVENT = "alleycorp:animation-toggle";
const STORAGE_KEY = "alleycorp-animation";

export function useAnimationToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setEnabled(stored === null ? false : stored === "true");
  }, []);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(new CustomEvent(ANIMATION_TOGGLE_EVENT, { detail: { enabled: next } }));
      return next;
    });
  };

  return { enabled, toggle };
}
