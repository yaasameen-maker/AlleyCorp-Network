"use client";

import type { ReactNode } from "react";
import { DialogShell } from "@/app/components/DialogShell";
import { SheetHandle } from "./SheetHandle";

interface ProfileModalProps {
  onClose: () => void;
  children: ReactNode;
  layout?: "modal" | "panel";
}

export function ProfileModal({ onClose, children, layout = "modal" }: ProfileModalProps) {
  if (layout === "panel") {
    return (
      <div className="flex flex-col h-full min-h-0 bg-mist text-ink overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <DialogShell onClose={onClose} ariaLabelledBy="profile-title">
      <SheetHandle />
      {children}
    </DialogShell>
  );
}
