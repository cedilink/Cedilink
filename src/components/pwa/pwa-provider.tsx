"use client";

import { RefreshCw, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { applyUpdate, startPwa, usePwa } from "@/lib/pwa/store";

const card = "pointer-events-auto flex items-center gap-3 rounded-2xl bg-white p-3 pl-4 text-sm text-ink shadow-[0_12px_40px_rgba(0,0,0,0.12)]";

/**
 * Registers the service worker and shows the two notices that belong on every page:
 * that the device is offline, and that a new version is ready.
 */
export function PwaProvider() {
  const { offline, updateReady } = usePwa();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    startPwa();
  }, []);

  // A customer in the middle of paying is not asked to reload; they get the new version on their next visit.
  // `updateReady` is only ever true in the browser, so reading the address here is safe.
  const showUpdate = updateReady && !dismissed && !window.location.pathname.startsWith("/c/");
  if (!offline && !showUpdate) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-start gap-2 sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-sm">
      {offline ? (
        <p role="status" className={`${card} pr-4`}>
          <WifiOff className="size-4 shrink-0 text-awaiting" aria-hidden />
          You&apos;re offline. What you see may be out of date.
        </p>
      ) : null}
      {showUpdate ? (
        <div role="status" className={card}>
          <span className="flex-1">A new version of Smartpay is ready.</span>
          <button type="button" onClick={applyUpdate} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-3.5 text-xs font-semibold text-white hover:bg-brand-hover">
            <RefreshCw className="size-3.5" aria-hidden /> Reload
          </button>
          <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="grid size-8 place-items-center rounded-full hover:bg-surface">
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
