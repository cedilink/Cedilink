"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** Counts up to `value` once, on first appearance. `format` turns the running number into text. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const node = useRef<HTMLSpanElement>(null);
  const still = useReducedMotion();
  const played = useRef(false);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    if (still || played.current || value === 0) {
      element.textContent = format(value);
      return;
    }
    played.current = true;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => (element.textContent = format(latest)),
    });
    return () => controls.stop();
  }, [value, format, still]);

  return <span ref={node}>{format(value)}</span>;
}
