"use client";

import { ChevronRight, Globe, Puzzle, Smartphone, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { ALBEDO_ENABLED, type WalletId } from "@/lib/wallets";
import { Spinner } from "../motion/badge";
import { Note } from "./parts";

function Option({
  icon,
  name,
  kind,
  onSelect,
  busy,
  comingSoon,
  className = "",
}: {
  icon: ReactNode;
  name: string;
  kind: string;
  onSelect?: () => void;
  busy?: boolean;
  comingSoon?: boolean;
  className?: string;
}) {
  const disabled = comingSoon || !onSelect;
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left transition-colors enabled:hover:bg-brand-wash disabled:cursor-default ${className}`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-surface ${disabled ? "text-subtle" : "text-ink"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${disabled ? "text-muted" : "text-ink"}`}>{name}</span>
        <span className="block text-xs text-muted">{kind}</span>
        {comingSoon ? (
          <span className="mt-2 inline-block rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-ink">Coming soon</span>
        ) : null}
      </span>
      {busy ? <Spinner className="size-4" /> : disabled ? null : <ChevronRight className="size-4 text-ink" strokeWidth={1.6} />}
    </button>
  );
}

/** Design 03: a centred dialog on desktop, a bottom sheet that can be swiped away on mobile. */
export function WalletPicker({
  open,
  connecting,
  onSelect,
  onClose,
}: {
  open: boolean;
  connecting: WalletId | null;
  onSelect: (wallet: WalletId) => void;
  onClose: () => void;
}) {
  const still = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panel.current) return;
      // Keep keyboard focus inside the dialog while it is open.
      const focusable = panel.current.querySelectorAll<HTMLElement>("button:not(:disabled)");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-picker-title"
            tabIndex={-1}
            className="relative w-full rounded-t-[28px] bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none sm:max-w-[420px] sm:rounded-[28px] sm:bg-white sm:p-5"
            initial={still ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={still ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            drag={still ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/80 sm:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2 id="wallet-picker-title" className="text-lg tracking-tight text-ink">
                Connect your Stellar wallet
              </h2>
              <button type="button" aria-label="Close" onClick={onClose} className="-m-2 grid size-9 place-items-center rounded-full hover:bg-black/5">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 sm:[&>button]:bg-surface sm:[&>button:enabled:hover]:bg-brand-wash">
              <Option
                icon={<Puzzle className="size-4" strokeWidth={1.6} />}
                name="Freighter"
                kind="Browser extension"
                busy={connecting === "freighter"}
                onSelect={() => onSelect("freighter")}
              />
              <Option
                icon={<Globe className="size-4" strokeWidth={1.6} />}
                name="Albedo"
                kind="Web wallet"
                busy={connecting === "albedo"}
                comingSoon={!ALBEDO_ENABLED}
                onSelect={() => onSelect("albedo")}
              />
              <Option
                className="sm:hidden"
                icon={<Smartphone className="size-4" strokeWidth={1.6} />}
                name="Open in wallet app"
                kind="On your phone"
                comingSoon
              />
            </div>
            <div className="mt-2.5 [&>p]:bg-white sm:[&>p]:bg-surface">
              <Note>Make sure your wallet contains enough Stellar USDC and XLM to complete the transaction.</Note>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
