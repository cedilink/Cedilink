import { CircleAlert, CircleCheck, Clock, Copy, LoaderCircle, TimerOff } from "lucide-react";
import type { Payment } from "@/lib/api/client";

const STYLES = {
  awaiting: { label: "Awaiting payment", className: "bg-awaiting-tint text-awaiting", Icon: Clock },
  confirming: { label: "Confirming", className: "bg-confirming-tint text-confirming", Icon: LoaderCircle },
  paid: { label: "Paid", className: "bg-paid-tint text-paid", Icon: CircleCheck },
  failed: { label: "Failed", className: "bg-failed-tint text-failed", Icon: CircleAlert },
  expired: { label: "Expired", className: "bg-failed-tint text-failed", Icon: TimerOff },
  duplicate: { label: "Duplicate payment flagged", className: "bg-awaiting-tint text-awaiting", Icon: Copy },
} as const;

export function StatusPill({ payment }: { payment: Pick<Payment, "tab" | "flag"> }) {
  const style = STYLES[payment.flag === "DUPLICATE" ? "duplicate" : payment.tab];
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${style.className}`}>
      <style.Icon className="size-3.5" strokeWidth={1.8} />
      {style.label}
    </span>
  );
}
