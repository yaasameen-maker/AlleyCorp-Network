"use client";

import { useState } from "react";

interface SendDigestButtonProps {
  onSend: () => void;
}

export function SendDigestButton({ onSend }: SendDigestButtonProps) {
  const [sent, setSent] = useState(false);

  const handleClick = () => {
    onSend();
    setSent(true);
    window.setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="shrink-0 border-t border-line bg-mist/95 backdrop-blur safe-bottom px-4 py-3">
      <button
        type="button"
        onClick={handleClick}
        className="touch-press w-full py-3 rounded-xl border border-line bg-paper text-sm font-medium text-ink"
      >
        {sent ? "Digest email queued" : "Send digest email"}
      </button>
      <p className="text-[10px] text-muted text-center mt-2">
        Sends to AlleyCorp partner inboxes · preview only in demo
      </p>
    </div>
  );
}
