"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : `Copy ${label}`}
      className="-m-1.5 inline-grid size-7 place-items-center rounded-md text-ink/70 transition-colors hover:bg-black/5 hover:text-ink"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access denied; nothing useful to show.
        }
      }}
    >
      {copied ? <Check className="size-4 text-paid" /> : <Copy className="size-4" />}
    </button>
  );
}
