"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PageScrimProps {
  onClose: () => void;
}

/** Dims the page behind inline panels (e.g. desktop profile). */
export function PageScrim({ onClose }: PageScrimProps) {
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
      onClick={onClose}
      aria-hidden
    >
      <div className="dialog-scrim absolute inset-0" />
    </div>,
    document.body
  );
}
