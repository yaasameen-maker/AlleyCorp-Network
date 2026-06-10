"use client";

import { useState } from "react";
import { AskPanel } from "./AskPanel";
import { getInvestors } from "@/app/data/investors";
import { useEffect } from "react";
import type { Investor } from "@/lib/investors";

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

export function AskFAB() {
  const [open, setOpen] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);

  useEffect(() => {
    getInvestors()
      .then(setInvestors)
      .catch(() => {});
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask the network"
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#0EA5D6] text-white shadow-xl hover:bg-[#0891B2] active:scale-95 transition-all duration-150 flex items-center justify-center"
      >
        <ChatIcon />
      </button>

      {open && (
        <AskPanel
          investors={investors}
          onSelectInvestor={() => {}}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
