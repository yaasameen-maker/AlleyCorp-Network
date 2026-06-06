"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollContainer } from "@/app/context/ScrollContainerContext";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  /** When false, treat element as always in view */
  enabled?: boolean;
  /** Scroll container; defaults to ScrollContainerContext on mobile */
  root?: Element | null;
}

export function useInView({
  threshold = 0.15,
  rootMargin = "0px 0px 0px 0px",
  enabled = true,
  root: rootProp,
}: UseInViewOptions = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const scrollContainer = useScrollContainer();
  const root = rootProp ?? scrollContainer?.current ?? null;

  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let raf = 0;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      raf = requestAnimationFrame(() => {
        if (!cancelled) setInView(true);
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin, root: root ?? undefined }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, root]);

  return { ref, inView: enabled ? inView : true };
}
