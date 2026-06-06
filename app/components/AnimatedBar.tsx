"use client";

import { useEffect, useState } from "react";

interface AnimatedBarProps {
  /** Target width 0–100 */
  value: number;
  color?: string;
  heightClass?: string;
  delay?: number;
  duration?: number;
  trackClassName?: string;
  /** When false, bar stays at 0 until true */
  active?: boolean;
}

export function AnimatedBar({
  value,
  color = "rgba(240, 242, 245, 0.9)",
  heightClass = "h-2",
  delay = 0,
  duration = 900,
  trackClassName = "bg-paper",
  active = true,
}: AnimatedBarProps) {
  const target = Math.min(100, Math.max(0, value));
  const [width, setWidth] = useState(0);
  const displayWidth = active ? width : 0;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let raf = 0;
    let timeout: number | undefined;

    raf = requestAnimationFrame(() => {
      if (cancelled) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setWidth(target);
        return;
      }

      setWidth(0);
      timeout = window.setTimeout(() => {
        if (!cancelled) setWidth(target);
      }, delay);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [target, delay, active]);

  return (
    <div className={`${heightClass} ${trackClassName} rounded-full overflow-hidden`}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${displayWidth}%`,
          backgroundColor: color,
          transition:
            displayWidth === 0
              ? "none"
              : `width ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      />
    </div>
  );
}

interface AnimatedNumberProps {
  value: number;
  delay?: number;
  duration?: number;
  suffix?: string;
  className?: string;
  active?: boolean;
}

export function AnimatedNumber({
  value,
  delay = 0,
  duration = 900,
  suffix = "",
  className,
  active = true,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const displayValue = active ? display : 0;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let raf = 0;
    let tickRaf = 0;
    let timeout: number | undefined;

    raf = requestAnimationFrame(() => {
      if (cancelled) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setDisplay(value);
        return;
      }

      setDisplay(0);
      timeout = window.setTimeout(() => {
        if (cancelled) return;

        const start = performance.now();
        const tick = (now: number) => {
          if (cancelled) return;
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - (1 - progress) ** 3;
          setDisplay(Math.round(value * eased));
          if (progress < 1) tickRaf = requestAnimationFrame(tick);
          else setDisplay(value);
        };

        tickRaf = requestAnimationFrame(tick);
      }, delay);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tickRaf);
      window.clearTimeout(timeout);
    };
  }, [value, delay, duration, active]);

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}
