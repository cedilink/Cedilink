"use client";

import { CircleAlert, CircleCheck, CircleDashed, CircleX, Search, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CancelDialog, CheckTransactionDialog, ResolveDialog } from "@/components/dashboard/reconcile";
import { CopyLinkButton } from "@/components/dashboard/share";
import { StatusPill, TransferPill } from "@/components/dashboard/status-pill";
import { Card, LoadError, Loading, PageHeader, PillButton } from "@/components/dashboard/ui";
import { CopyButton } from "@/components/ui/copy-button";
import { ApiError, type Payment, type Transfer } from "@/lib/api/client";
import { reasonLabel } from "@/lib/dashboard/labels";
import { useCancelPayment, usePayment } from "@/lib/dashboard/queries";
import { formatDateTime, truncateAddress, truncateHash } from "@/lib/format";

function InfoRow({ label, children, copy }: { label: string; children: ReactNode; copy?: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-line py-3 text-sm last:border-0 max-sm:flex-wrap max-sm:gap-y-1">
      <dt className="w-40 shrink-0 text-muted max-sm:w-full">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-ink">{children}</dd>
      {copy ? <CopyButton value={copy} label={label.toLowerCase()} /> : null}
    </div>
  );
}

function ExpectedReceived({ payment, latest }: { payment: Payment; latest?: Transfer }) {
  const rows: [string, string, string | null, boolean | null][] = [
    ["Amount", `${payment.amount} ${payment.asset}`, latest ? `${latest.received.amount} ${latest.received.asset}` : null, latest?.checks?.amount ?? null],
    ["Asset", payment.asset, latest ? latest.received.asset : null, latest?.checks?.asset ?? null],
    ["Recipient", truncateAddress(payment.destinationAddress), latest ? truncateAddress(latest.toAddress) : null, latest?.checks?.recipient ?? null],
    ["Reference", payment.paymentId, latest ? (latest.memo ?? "None") : null, latest?.checks?.reference ?? null],
  ];
  return (
    <Card className="p-5">
      <h2 className="text-base text-ink">Expected vs received</h2>
      {!latest ? (
        <p className="mt-3 text-sm text-muted">
          Nothing received yet. Expecting {payment.amount} {payment.asset} to {truncateAddress(payment.destinationAddress)} with memo {payment.paymentId}.
        </p>
      ) : (
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-3 font-normal">Check</th>
              <th className="py-2 pr-3 font-normal">Expected</th>
              <th className="py-2 pr-3 font-normal">Received</th>
              <th className="w-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, expected, received, ok]) => (
              <tr key={label} className="border-t border-line">
                <td className="py-3 pr-3 text-ink">{label}</td>
                <td className="py-3 pr-3 text-ink">{expected}</td>
                <td className={`py-3 pr-3 ${ok === false ? "font-medium text-failed" : "text-ink"}`}>
                  {received}
                  {label === "Amount" && ok === false && latest.reason ? ` · ${reasonLabel(latest.reason).toLowerCase()}` : ""}
                </td>
                <td>
                  <span className={`block size-2 rounded-full ${ok === false ? "bg-failed" : ok ? "bg-paid" : "bg-subtle"}`} role="img" aria-label={ok === false ? "Mismatch" : ok ? "Matches" : "Not checked"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

const CHECKS = [
  ["transactionExists", "Transaction exists"],
  ["transactionSuccessful", "Transaction successful"],
  ["destinationMatches", "Destination matches"],
  ["assetMatches", "Asset matches"],
  ["amountMatches", "Amount matches"],
  ["referenceMatches", "Payment reference matches"],
] as const;

function Verification({ payment, latest }: { payment: Payment; latest?: Transfer }) {
  // Until the request is paid, show the checks of the latest payment that arrived for it.
  const c = latest?.checks;
  const result =
    payment.verification ??
    (c
      ? {
          transactionExists: true,
          transactionSuccessful: c.successful,
          destinationMatches: c.recipient,
          assetMatches: c.asset,
          amountMatches: c.amount,
          referenceMatches: c.reference,
          checkedAt: latest!.ledgerClosedAt,
        }
      : null);
  return (
    <Card className="p-5">
      <h2 className="mb-1 text-base text-ink">Verification</h2>
      <ul>
        {CHECKS.map(([key, label]) => {
          // No result yet means nothing has been checked; that is different from a failed check.
          const state = !result ? "pending" : result[key] ? "passed" : "failed";
          const Icon = state === "passed" ? CircleCheck : state === "failed" ? CircleX : CircleDashed;
          return (
            <li key={key} className="flex items-center gap-2.5 py-2.5 text-sm">
              <Icon className={`size-4 shrink-0 ${state === "passed" ? "text-paid" : state === "failed" ? "text-failed" : "text-subtle"}`} strokeWidth={1.8} aria-hidden />
              <span className={state === "pending" ? "text-muted" : state === "failed" ? "text-failed" : "text-ink"}>{label}</span>
              <span className="sr-only">{state === "passed" ? "passed" : state === "failed" ? "failed" : "not checked yet"}</span>
            </li>
          );
        })}
      </ul>
      {payment.explorerUrl || latest ? (
        <a href={payment.explorerUrl ?? latest!.explorerUrl} target="_blank" rel="noreferrer" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full border border-line text-sm text-ink hover:bg-surface">
          <SquareArrowOutUpRight className="size-4" /> View on Stellar explorer
        </a>
      ) : null}
    </Card>
  );
}

function IncomingPayments({ transfers }: { transfers: Transfer[] }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="flex-1 text-base text-ink">Incoming payments</h2>
        <span className="text-xs text-muted">
          {transfers.length} {transfers.length === 1 ? "payment" : "payments"}
        </span>
      </div>
      {transfers.length === 0 ? (
        <p className="text-sm text-muted">No payments have reached your wallet for this link.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {transfers.map((t) => (
            <li key={t.id}>
              <Link href={`/dashboard/transactions/${t.id}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3.5 hover:border-brand/30">
                <span className="min-w-0 flex-[1_1_12rem]">
                  <span className="block text-[15px] text-ink">
                    {t.received.amount} {t.received.asset} from {truncateAddress(t.fromAddress)}
                  </span>
                  <span className="block text-xs text-brand">{truncateHash(t.transactionHash, 8, 8)}</span>
                  <span className="block text-xs text-muted">{formatDateTime(t.ledgerClosedAt)}</span>
                </span>
                {t.state === "flagged" || t.state === "unmatched" ? (
                  <span className="inline-flex h-7 items-center rounded-full bg-failed-tint px-2.5 text-xs font-medium text-failed">{t.resolution ? (t.resolution.action === "accepted" ? "Accepted" : "Dismissed") : reasonLabel(t.reason)}</span>
                ) : (
                  <TransferPill transfer={t} />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function PaymentDetailsPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { data: payment, error, refetch } = usePayment(paymentId);
  const cancel = useCancelPayment();
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resolving, setResolving] = useState<{ transfer: Transfer; action: "accept" | "dismiss" } | null>(null);

  if (error) {
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <>
        <PageHeader title="Payment details" />
        {missing ? <Card className="px-6 py-16 text-center text-sm text-muted">This payment link does not exist.</Card> : <LoadError what="this payment" onRetry={() => refetch()} />}
      </>
    );
  }
  if (!payment) return <Loading />;

  const transfers = payment.transfers ?? [];
  const open = transfers.find((t) => t.needsReview);
  const latest = transfers[0];
  const none = (text: string) => <span className="text-muted">{text}</span>;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {payment.productName} <StatusPill payment={payment} />
          </span>
        }
        subtitle={`${payment.paymentId} · Order ${payment.orderId} · ${payment.network}`}
      >
        <CopyLinkButton url={payment.checkoutUrl} label="Copy link" />
        <PillButton variant="tint" className="h-9" onClick={() => setChecking(true)}>
          <Search className="size-4" /> Check a transaction
        </PillButton>
        {payment.cancellable ? (
          <PillButton variant="danger" className="h-9" onClick={() => setCancelling(true)}>
            Cancel link
          </PillButton>
        ) : null}
      </PageHeader>

      {open ? (
        <section aria-label="Needs review" className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-failed/20 bg-failed-tint/40 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-failed-tint text-failed">
            <CircleAlert className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-[1_1_18rem]">
            <p className="text-[15px] font-medium text-ink">A payment arrived that doesn&apos;t match this request</p>
            <p className="mt-0.5 text-sm text-heading">{open.reasonMessage}</p>
          </div>
          <div className="flex gap-2">
            <PillButton variant="white" onClick={() => setResolving({ transfer: open, action: "dismiss" })}>
              Dismiss
            </PillButton>
            {open.acceptable ? <PillButton onClick={() => setResolving({ transfer: open, action: "accept" })}>Accept as paid</PillButton> : null}
          </div>
        </section>
      ) : (
        <p className="-mt-3 mb-6 text-sm text-muted">{payment.statusMessage}</p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <ExpectedReceived payment={payment} latest={latest} />
          <Card className="p-5">
            <h2 className="mb-1 text-base text-ink">Payment information</h2>
            <dl>
              <InfoRow label="Payment link" copy={payment.checkoutUrl}>
                <a href={payment.checkoutUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                  {payment.checkoutUrl.replace(/^https?:\/\//, "")}
                </a>
              </InfoRow>
              <InfoRow label="Order ID">{payment.orderId}</InfoRow>
              <InfoRow label="Customer">{[payment.customer.name, payment.customer.email].filter(Boolean).join(" · ") || none("Not given")}</InfoRow>
              <InfoRow label="Customer reference">{payment.customer.reference ?? none("Not given")}</InfoRow>
              <InfoRow label="Destination wallet" copy={payment.destinationAddress}>
                {truncateAddress(payment.destinationAddress)}
              </InfoRow>
              <InfoRow label="Customer wallet" copy={payment.customerWallet ?? undefined}>
                {payment.customerWallet ? truncateAddress(payment.customerWallet) : none("Not received yet")}
              </InfoRow>
              <InfoRow label="Transaction hash" copy={payment.transactionHash ?? undefined}>
                {payment.transactionHash && payment.explorerUrl ? (
                  <a href={payment.explorerUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                    {truncateHash(payment.transactionHash, 8, 8)}
                  </a>
                ) : (
                  none("Not available yet")
                )}
              </InfoRow>
              <InfoRow label="Created">{formatDateTime(payment.createdAt)}</InfoRow>
              <InfoRow label={payment.status === "CANCELLED" ? "Cancelled" : "Expires"}>
                {payment.status === "CANCELLED" ? formatDateTime(payment.updatedAt) : formatDateTime(payment.expiresAt)}
              </InfoRow>
              <InfoRow label="Paid">{payment.paidAt ? formatDateTime(payment.paidAt) : none("Not paid")}</InfoRow>
            </dl>
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <IncomingPayments transfers={transfers} />
          <Verification payment={payment} latest={latest} />
        </div>
      </div>

      <CheckTransactionDialog paymentId={payment.paymentId} open={checking} onClose={() => setChecking(false)} />
      <CancelDialog
        open={cancelling}
        onClose={() => {
          cancel.reset();
          setCancelling(false);
        }}
        onConfirm={() => cancel.mutate(payment.paymentId, { onSuccess: () => setCancelling(false) })}
        pending={cancel.isPending}
        error={cancel.error instanceof ApiError ? cancel.error.message : cancel.error ? "We couldn't cancel this link. Please try again." : null}
      />
      <ResolveDialog transfer={resolving?.transfer ?? null} action={resolving?.action ?? "accept"} customerEmail={payment.customer.email} onClose={() => setResolving(null)} />
    </>
  );
}
