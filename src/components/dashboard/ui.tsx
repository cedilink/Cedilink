"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Badge, Spinner } from "../motion/badge";
import { Button } from "../ui/button";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl tracking-tight text-ink">{title}</h1>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-2xl bg-white ${className}`} {...props} />;
}

const pill =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const pillVariants = {
  brand: "bg-brand text-white hover:bg-brand-hover",
  white: "bg-white text-ink hover:bg-line",
  soft: "bg-surface text-ink hover:bg-line",
} as const;

export function PillButton({ variant = "brand", className = "", ...props }: { variant?: keyof typeof pillVariants } & ComponentProps<"button">) {
  return <button type="button" className={`${pill} ${pillVariants[variant]} ${className}`} {...props} />;
}

export function PillLink({ variant = "brand", className = "", ...props }: { variant?: keyof typeof pillVariants } & ComponentProps<typeof Link>) {
  return <Link className={`${pill} ${pillVariants[variant]} ${className}`} {...props} />;
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-failed">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-subtle focus:border-brand read-only:bg-surface read-only:text-muted aria-[invalid=true]:border-failed";

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-24 text-muted" role="status" aria-label={label}>
      <Spinner className="size-6" />
    </div>
  );
}

/** Design "Generic error": shown when a page's data cannot be loaded. */
export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <Badge tone="alert" />
      <div>
        <h2 className="text-lg text-ink">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted">We couldn&apos;t load {what}. Please try again.</p>
      </div>
      <Button variant="brand" full={false} onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
