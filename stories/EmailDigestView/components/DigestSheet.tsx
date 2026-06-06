"use client";

import type { ReactNode } from "react";
import { DialogShell } from "@/app/components/DialogShell";

interface DigestSheetProps {
  onClose: () => void;
  children: ReactNode;
}

export function DigestSheet({ onClose, children }: DigestSheetProps) {
  return (
    <DialogShell onClose={onClose} ariaLabelledBy="digest-title">
      <div className="flex justify-center pt-3 pb-1 max-md:flex md:hidden safe-top" aria-hidden>
        <div className="w-10 h-1 rounded-full bg-line" />
      </div>
      {children}
    </DialogShell>
  );
}
