"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Dims main content only on desktop — left nav stays clear. Dashboard profile panel. */
export function PageScrim() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setReady(true);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) return null;

  return createPortal(
    <div
      className={`dialog-overlay fixed inset-0 z-[150] ${visible ? "dialog-overlay--visible" : ""}`}
      aria-hidden
    >
      <div className="dialog-scrim-main" />
    </div>,
    document.body
  );
}
