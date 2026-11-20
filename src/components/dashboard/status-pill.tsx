import { Ban, CircleAlert, CircleCheck, CircleDashed, CircleX, Clock, LoaderCircle, TimerOff } from "lucide-react";
import type { DisplayStatus, Payment, Transfer } from "@/lib/api/client";

const base = "inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium";

const DISPLAY = {
  confirmed: { label: "Confirmed", className: "bg-paid-tint text-paid", Icon: CircleCheck },
  pending: { label: "Pending", className: "bg-brand-tint text-brand", Icon: Clock },
  flagged: { label: "Flagged", className: "bg-failed-tint text-failed", Icon: CircleAlert },
  failed: { label: "Failed", className: "bg-failed-tint text-failed", Icon: CircleAlert },
  expired: { label: "Expired", className: "bg-line text-heading", Icon: TimerOff },
  cancelled: { label: "Cancelled", className: "bg-line text-heading", Icon: Ban },
} as const satisfies Record<DisplayStatus, unknown>;

/** The merchant-facing status of a payment request: Pending, Confirmed, Flagged, Failed, Expired or Cancelled. */
export function StatusPill({
  payment,
}: {
  payment: Pick<Payment, "displayStatus"> & { pendingStage?: Payment["pendingStage"] };
}) {
  const style = DISPLAY[payment.displayStatus];
  // A pending request whose transaction is being confirmed says so.
  const confirming = payment.displayStatus === "pending" && payment.pendingStage === "confirming";
  const Icon = confirming ? LoaderCircle : style.Icon;
  return (
    <span className={`${base} ${style.className}`}>
      <Icon className="size-3.5" strokeWidth={1.8} aria-hidden />
      {confirming ? "Confirming" : style.label}
    </span>
  );
}

const TRANSFER = {
  matched: { label: "Matched", className: "bg-paid-tint text-paid", Icon: CircleCheck },
  flagged: { label: "Flagged", className: "bg-failed-tint text-failed", Icon: CircleAlert },
  unmatched: { label: "Unmatched", className: "bg-line text-heading", Icon: CircleDashed },
  failed: { label: "Failed", className: "bg-failed-tint text-failed", Icon: CircleX },
} as const;

/** Reconciliation state of one transfer; a resolved one shows the decision instead. */
export function TransferPill({ transfer }: { transfer: Pick<Transfer, "state" | "resolution"> }) {
  if (transfer.resolution) {
    const accepted = transfer.resolution.action === "accepted";
    const Icon = accepted ? CircleCheck : CircleX;
    return (
      <span className={`${base} ${accepted ? "bg-paid-tint text-paid" : "bg-line text-heading"}`}>
        <Icon className="size-3.5" strokeWidth={1.8} aria-hidden />
        {accepted ? "Accepted as paid" : "Dismissed"}
      </span>
    );
  }
  const style = TRANSFER[transfer.state];
  return (
    <span className={`${base} ${style.className}`}>
      <style.Icon className="size-3.5" strokeWidth={1.8} aria-hidden />
      {style.label}
    </span>
  );
}
