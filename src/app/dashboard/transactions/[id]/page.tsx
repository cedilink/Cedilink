"use client";

import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CheckRows, ResolveDialog } from "@/components/dashboard/reconcile";
import { StatusPill, TransferPill } from "@/components/dashboard/status-pill";
import { Card, LoadError, Loading, PageHeader, PillButton } from "@/components/dashboard/ui";
import { CopyButton } from "@/components/ui/copy-button";
import { ApiError } from "@/lib/api/client";
import { usePayment, useTransfer } from "@/lib/dashboard/queries";
import { formatDateTime, truncateAddress, truncateHash } from "@/lib/format";

function Row({ label, children, copy }: { label: string; children: ReactNode; copy?: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-line py-3 text-sm last:border-0 max-sm:flex-wrap max-sm:gap-y-1">
      <dt className="w-40 shrink-0 text-muted max-sm:w-full">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-ink">{children}</dd>
      {copy ? <CopyButton value={copy} label={label.toLowerCase()} /> : null}
    </div>
  );
}

const SOURCES = { watcher: "Seen on your wallet", checkout: "Submitted through the checkout", manual_check: "Checked by hash" } as const;

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: t, error, refetch } = useTransfer(id);
  const request = usePayment(t?.paymentId ?? "");
  const [action, setAction] = useState<"accept" | "dismiss" | null>(null);

  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <>
        <PageHeader title="Transaction details" />
        {missing ? <Card className="px-6 py-16 text-center text-sm text-muted">This transaction does not exist.</Card> : <LoadError what="this transaction" onRetry={() => refetch()} />}
      </>
    );
  }
  if (!t) return <Loading />;

  const payment = t.paymentId ? request.data : undefined;
  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t.received.amount} {t.received.asset} received <TransferPill transfer={t} />
          </span>
        }
        subtitle={`${t.paymentId ? `For ${t.paymentId} · ` : ""}${formatDateTime(t.ledgerClosedAt)} · Stellar Testnet`}
      >
        <a href={t.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full bg-brand-tint px-4 text-sm text-brand hover:bg-brand-wash">
          <SquareArrowOutUpRight className="size-4" aria-hidden /> Stellar explorer
        </a>
      </PageHeader>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="p-5">
            <h2 className="text-base text-ink">{t.paymentId ? `Checks against ${t.paymentId}` : "Checks"}</h2>
            <p className="mb-2 mt-1 text-sm text-heading">{t.reasonMessage}</p>
            <CheckRows transfer={t} />
          </Card>
          {t.state === "flagged" || t.state === "unmatched" ? (
            <Card className="p-5">
              <h2 className="text-base text-ink">Resolution</h2>
              {t.resolution ? (
                <dl className="mt-2">
                  <Row label="Decision">{t.resolution.action === "accepted" ? "Accepted as paid" : "Dismissed"}</Row>
                  <Row label="When">{t.resolution.resolvedAt ? formatDateTime(t.resolution.resolvedAt) : "—"}</Row>
                  <Row label="Note">{t.resolution.note ?? <span className="text-muted">None</span>}</Row>
                </dl>
              ) : (
                <>
                  <p className="mb-4 mt-2 text-sm text-heading">
                    {t.acceptable
                      ? `Not resolved yet. Accepting marks ${t.paymentId} as paid. Dismissing leaves the request as it is; refund the customer from your wallet if needed.`
                      : t.paymentId
                        ? "This payment can't be accepted, because it was sent in another asset or to another wallet. Dismiss it once you've dealt with it."
                        : "This payment isn't linked to a payment request, so it can't be accepted. Dismiss it once you've dealt with it."}
                  </p>
                  <div className="flex gap-2">
                    {t.acceptable ? <PillButton onClick={() => setAction("accept")}>Accept as paid</PillButton> : null}
                    <PillButton variant="white" onClick={() => setAction("dismiss")}>
                      Dismiss
                    </PillButton>
                  </div>
                </>
              )}
            </Card>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="p-5">
            <h2 className="mb-1 text-base text-ink">Transfer</h2>
            <dl>
              <Row label="Amount">
                {t.received.amount} {t.received.asset}
              </Row>
              <Row label="Asset issuer" copy={t.received.assetIssuer ?? undefined}>
                {t.received.assetIssuer ? truncateAddress(t.received.assetIssuer) : "Native XLM"}
              </Row>
              <Row label="From" copy={t.fromAddress}>
                {truncateAddress(t.fromAddress)}
              </Row>
              <Row label="To" copy={t.toAddress}>
                {truncateAddress(t.toAddress)}
                {t.checks?.recipient ? <span className="text-muted"> (your receiving wallet)</span> : null}
              </Row>
              <Row label="Memo">{t.memo ?? <span className="text-muted">None</span>}</Row>
              <Row label="Transaction hash" copy={t.transactionHash}>
                {truncateHash(t.transactionHash, 8, 8)}
              </Row>
              {t.operationId ? <Row label="Operation ID">{t.operationId}</Row> : null}
              <Row label="Ledger time">{formatDateTime(t.ledgerClosedAt)}</Row>
              <Row label="Recorded">{SOURCES[t.source]}</Row>
            </dl>
          </Card>
          {t.paymentId ? (
            <Card className="p-5">
              <h2 className="text-base text-ink">Linked request</h2>
              <Link href={`/dashboard/links/${t.paymentId}`} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line p-3.5 hover:border-brand/30">
                <span className="min-w-0 flex-[1_1_12rem]">
                  <span className="block text-[15px] text-ink">
                    {t.paymentId}
                    {payment ? ` · ${payment.productName}` : ""}
                  </span>
                  {payment ? (
                    <span className="block text-xs text-muted">
                      {payment.amount} {payment.asset}
                      {payment.customer.name ? ` · ${payment.customer.name}` : ""}
                      {payment.customer.reference ? ` · ${payment.customer.reference}` : ""}
                    </span>
                  ) : null}
                </span>
                {payment ? <StatusPill payment={payment} /> : null}
              </Link>
            </Card>
          ) : null}
        </div>
      </div>
      <ResolveDialog transfer={action ? t : null} action={action ?? "accept"} customerEmail={payment?.customer.email} onClose={() => setAction(null)} />
    </>
  );
}
