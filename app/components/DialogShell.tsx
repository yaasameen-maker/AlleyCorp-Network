"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DialogShellProps {
  onClose: () => void;
  children: ReactNode;
  ariaLabelledBy: string;
}

const DISMISS_THRESHOLD = 120;

/**
 * Full-screen dialog shell with dimmed page behind.
 * Rendered via portal on document.body so the scrim is not clipped by .app-shell.
 * Tune scrim darkness in globals.css → --dialog-backdrop
 */
export function DialogShell({ onClose, children, ariaLabelledBy }: DialogShellProps) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setReady(true);
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (dragOffset > DISMISS_THRESHOLD) onClose();
    setDragOffset(0);
    touchStartY.current = null;
  };

  if (!ready) return null;

  return createPortal(
    <div
      className={`dialog-overlay fixed inset-0 z-[200] flex flex-col max-md:justify-end md:justify-center md:items-center ${
        visible ? "dialog-overlay--visible" : ""
      }`}
      onClick={onClose}
    >
      <div className="dialog-scrim absolute inset-0 z-0" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined }}
        className={`dialog-panel relative z-10 flex flex-col w-full bg-mist text-ink overflow-hidden safe-x max-md:max-h-[90dvh] max-md:rounded-t-[1.25rem] max-md:border-t max-md:border-line md:w-[min(92vw,52rem)] md:max-h-[min(92dvh,52rem)] md:rounded-2xl md:border md:border-line ${
          visible && dragOffset === 0 ? "max-md:animate-sheet-up md:animate-dialog-in" : ""
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
