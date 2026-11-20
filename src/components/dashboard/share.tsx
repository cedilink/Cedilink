"use client";

import { Check } from "lucide-react";
import { useState } from "react";

const small = "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-tint px-4 text-sm text-brand transition-colors hover:bg-brand-wash";

export function CopyLinkButton({ url, label = "Copy" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={small}
      onClick={async () => {
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : null}
      {copied ? "Copied" : label}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}

/** The phone's share sheet where there is one; otherwise copies the link. */
export function ShareLinkButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={small}
      onClick={async () => {
        if (typeof navigator.share === "function") {
          try {
            await navigator.share({ title, text: `Pay for ${title}`, url });
            return;
          } catch (error) {
            // The customer closed the sheet; nothing to do.
            if ((error as Error).name === "AbortError") return;
          }
        }
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Share"}
    </button>
  );
}
