"use client";

import { Badge } from "@/components/motion/badge";
import { Button } from "@/components/ui/button";

export default function CheckoutError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center">
        <Badge tone="alert" />
        <div>
          <h1 className="text-[22px] tracking-tight text-ink">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-muted">We couldn&apos;t load this checkout. Your payment has not been affected.</p>
        </div>
        <Button onClick={() => retry()}>Try again</Button>
      </div>
    </main>
  );
}
