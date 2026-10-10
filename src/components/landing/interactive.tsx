"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import walletBase from "@/assets/illustrations/wallet-layers/base.png";
import walletFloat1 from "@/assets/illustrations/wallet-layers/float-1.png";
import walletFloat2 from "@/assets/illustrations/wallet-layers/float-2.png";

// ── Layered wallet illustration ─────────────────────────────────────────────────

function useDepth(pointer: MotionValue<number>, amount: number) {
  return useTransform(pointer, [-1, 1], [-amount, amount]);
}

/**
 * The wallet artwork, split into a base and two floating pieces. The coins bob on
 * out-of-step loops, and every layer follows the pointer by a different amount, which
 * gives the flat drawing depth.
 */
export function WalletArt() {
  const still = useReducedMotion();
  const x = useSpring(0, { stiffness: 60, damping: 14 });
  const y = useSpring(0, { stiffness: 60, damping: 14 });
  const layers = [
    { src: walletBase, dx: useDepth(x, 6), dy: useDepth(y, 4), bob: 0, duration: 0, delay: 0 },
    { src: walletFloat1, dx: useDepth(x, 26), dy: useDepth(y, 18), bob: 16, duration: 4.4, delay: 0 },
    { src: walletFloat2, dx: useDepth(x, 40), dy: useDepth(y, 26), bob: 22, duration: 5.6, delay: 0.8 },
  ];

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (still || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - box.left) / box.width) * 2 - 1);
    y.set(((event.clientY - box.top) / box.height) * 2 - 1);
  };

  return (
    <div
      className="relative mx-auto aspect-[982/1054] w-full max-w-[420px]"
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      aria-hidden
    >
      {layers.map((layer, index) => (
        <motion.div key={index} className="absolute inset-0" style={{ x: layer.dx, y: layer.dy }}>
          <motion.div
            className="absolute inset-0"
            animate={still || !layer.bob ? undefined : { y: [0, -layer.bob, 0], rotate: [0, index === 1 ? 4 : -5, 0] }}
            transition={{ duration: layer.duration, delay: layer.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image src={layer.src} alt="" fill sizes="420px" />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Magnetic wrapper ────────────────────────────────────────────────────────────

/** Pulls its child a little toward the cursor while the pointer is over it. */
export function Magnetic({ children }: { children: ReactNode }) {
  const still = useReducedMotion();
  const node = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 180, damping: 14 });
  const y = useSpring(0, { stiffness: 180, damping: 14 });
  return (
    <motion.div
      ref={node}
      className="inline-block p-4 -m-4"
      style={{ x, y }}
      onPointerMove={(event) => {
        if (still || event.pointerType !== "mouse" || !node.current) return;
        const box = node.current.getBoundingClientRect();
        x.set((event.clientX - (box.left + box.width / 2)) * 0.3);
        y.set((event.clientY - (box.top + box.height / 2)) * 0.3);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────────

export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question} className="border-b border-line" data-fade>
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`faq-${index}`}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg tracking-tight text-ink sm:text-xl"
              >
                {item.question}
                <motion.span animate={{ rotate: expanded ? 0 : 90 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="shrink-0 text-brand">
                  {expanded ? <Minus className="size-5" /> : <Plus className="size-5" />}
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  id={`faq-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-6 text-sm leading-relaxed text-muted">{item.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
