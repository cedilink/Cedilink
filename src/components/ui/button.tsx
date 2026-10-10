import type { ComponentProps } from "react";

const variants = {
  ink: "bg-ink text-white hover:bg-black",
  brand: "bg-brand text-white hover:bg-brand-hover",
  outline: "border border-ink/25 bg-white text-ink hover:border-ink/60",
  soft: "bg-surface text-ink hover:bg-line",
} as const;

type Props = { variant?: keyof typeof variants; full?: boolean };

const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function buttonClass({ variant = "ink", full = true }: Props = {}) {
  return `${base} ${variants[variant]} ${full ? "w-full" : ""}`;
}

export function Button({ variant, full, className = "", ...props }: Props & ComponentProps<"button">) {
  return <button type="button" className={`${buttonClass({ variant, full })} ${className}`} {...props} />;
}
