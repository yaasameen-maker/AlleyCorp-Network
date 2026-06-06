"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Dims main content only on desktop — left nav stays clear. Dashboard profile panel. */
export function PageScrim() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Client-mount gate: the portal targets document.body, which doesn't exist
    // during SSR, so we only render after mount. The synchronous setState is the
    // canonical, intentional mount pattern here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
