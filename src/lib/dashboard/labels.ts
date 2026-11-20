import type { Transfer } from "@/lib/api/client";

type Reason = NonNullable<Transfer["reason"]>;

/** Short label for a reason code, used in pills and table cells. */
export const REASON_LABELS: Record<Reason, string> = {
  FAILED_ON_CHAIN: "Failed on Stellar",
  NO_REFERENCE: "No reference",
  UNKNOWN_REFERENCE: "Unknown reference",
  REFERENCE_MISMATCH: "Different reference",
  ALREADY_PAID: "Already paid",
  REQUEST_CANCELLED: "Link cancelled",
  REQUEST_EXPIRED: "Link expired",
  WRONG_RECIPIENT: "Wrong wallet",
  WRONG_ASSET: "Wrong asset",
  UNDERPAID: "Underpaid",
  OVERPAID: "Overpaid",
  UNVERIFIED: "Not verified",
};

export const reasonLabel = (reason: Transfer["reason"]) => (reason ? REASON_LABELS[reason] : "Matches");

/** "90 → 100" or "75 XLM → 75 USDC": expected, then received; the asset is shown only when they differ. */
export function expectedVsReceived(t: Pick<Transfer, "expected" | "received">): string {
  const trim = (a: string) => a.replace(/\.00$/, "");
  if (!t.expected) return `— → ${trim(t.received.amount)} ${t.received.asset}`;
  if (t.expected.asset !== t.received.asset) {
    return `${trim(t.expected.amount)} ${t.expected.asset} → ${trim(t.received.amount)} ${t.received.asset}`;
  }
  return `${trim(t.expected.amount)} → ${trim(t.received.amount)}`;
}

/** The four check rows of the designs, as sentences. */
export function checkRows(t: Transfer): { label: string; text: string; ok: boolean | null }[] {
  const c = t.checks;
  const exp = t.expected;
  const r = t.received;
  return [
    {
      label: "Recipient",
      ok: c?.recipient ?? null,
      text: c?.recipient ? `Matches receiving wallet ${short(t.toAddress)}` : exp?.destination ? `${short(t.toAddress)} is not ${short(exp.destination)}` : `Sent to ${short(t.toAddress)}`,
    },
    {
      label: "Asset",
      ok: c?.asset ?? null,
      text: exp ? `${r.asset}${c?.asset ? " matches " : " is not "}${exp.asset}` : `${r.asset} received`,
    },
    {
      label: "Amount",
      ok: c?.amount ?? null,
      text: exp ? `${exp.amount} expected · ${r.amount} received${c?.amount ? "" : " — mismatch"}` : `${r.amount} received`,
    },
    {
      label: "Reference",
      ok: c?.reference ?? null,
      text: t.memo ? (c?.reference ? `${t.memo} matches request reference` : `${t.memo} does not match`) : "No reference in the memo",
    },
  ];
}

export function short(address: string) {
  return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}
