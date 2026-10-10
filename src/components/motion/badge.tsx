"use client";

import { motion, useReducedMotion } from "motion/react";

const SCALLOP =
  "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z";

/**
 * The scalloped status badge from the designs. With `animated`, the circle springs in,
 * the outline draws itself, then the mark inside is drawn.
 */
export function Badge({ tone, animated = false }: { tone: "success" | "alert"; animated?: boolean }) {
  const still = useReducedMotion();
  const play = animated && !still;
  const draw = (delay: number, duration: number) =>
    play
      ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { delay, duration, ease: "easeInOut" as const } }
      : {};

  return (
    <motion.div
      className={`grid size-[72px] place-items-center rounded-full ${tone === "success" ? "bg-paid-tint text-paid" : "bg-surface text-ink"}`}
      initial={play ? { scale: 0 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
    >
      <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <motion.path d={SCALLOP} {...draw(0.15, 0.7)} />
        {tone === "success" ? (
          <motion.path d="m9 12 2 2 4-4" {...draw(0.75, 0.3)} />
        ) : (
          <>
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </>
        )}
      </svg>
    </motion.div>
  );
}

export function Spinner({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}
