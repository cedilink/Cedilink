"use client";

import { CircleCheck, CircleDashed, CircleX, SquareArrowOutUpRight } from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Card, LoadError, Loading, PageHeader } from "@/components/dashboard/ui";
import { CopyButton } from "@/components/ui/copy-button";
import { ApiError, type Payment } from "@/lib/api/client";
import { usePayment } from "@/lib/dashboard/queries";
import { formatDateTime, formatUsd, truncateAddress, truncateHash } from "@/lib/format";

function InfoRow({ label, children, copy }: { label: string; children: ReactNode; copy?: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-line py-3.5 text-sm max-sm:flex-wrap max-sm:gap-x-4 max-sm:gap-y-1">
      <dt className="w-44 shrink-0 text-xs text-muted max-sm:w-full">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-ink">{children}</dd>
      {copy ? <CopyButton value={copy} label={label.toLowerCase()} /> : null}
    </div>
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

function Verification({ payment }: { payment: Payment }) {
  const result = payment.verification;
  return (
    <Card className="h-fit p-5">
      <h2 className="mb-1 text-base text-ink">Verification</h2>
      <ul>
        {CHECKS.map(([key, label]) => {
          // No result yet means nothing has been checked; that is different from a failed check.
          const state = !result ? "pending" : result[key] ? "passed" : "failed";
          const Icon = state === "passed" ? CircleCheck : state === "failed" ? CircleX : CircleDashed;
          return (
            <li key={key} className="flex items-center gap-2.5 border-b border-line py-3.5 text-sm last:border-0">
              <Icon className={`size-4 shrink-0 ${state === "passed" ? "text-paid" : state === "failed" ? "text-failed" : "text-subtle"}`} strokeWidth={1.8} />
              <span className={state === "pending" ? "text-muted" : "text-ink"}>{label}</span>
              <span className="sr-only">{state === "passed" ? "passed" : state === "failed" ? "failed" : "not checked yet"}</span>
            </li>
          );
        })}
      </ul>
      {payment.explorerUrl ? (
        <a href={payment.explorerUrl} target="_blank" rel="noreferrer" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-surface text-sm text-ink hover:bg-line">
          <SquareArrowOutUpRight className="size-4" /> View on Stellar explorer
        </a>
      ) : (
        <p className="mt-4 flex h-10 items-center justify-center rounded-full bg-surface text-sm text-subtle">No transaction to view yet</p>
      )}
    </Card>
  );
}

export default function PaymentDetailsPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { data: payment, error, refetch } = usePayment(paymentId);

  if (error) {
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <>
        <PageHeader title="Payment details" />
        {missing ? <Card className="px-6 py-16 text-center text-sm text-muted">This payment does not exist.</Card> : <LoadError what="this payment" onRetry={() => refetch()} />}
      </>
    );
  }
  if (!payment) return <Loading />;

  const none = (text: string) => <span className="text-muted">{text}</span>;
  return (
    <>
      <h1 className="text-2xl tracking-tight text-ink">Payment details</h1>
      <div className="mb-5 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusPill payment={payment} />
        <p className="text-sm text-muted">{payment.statusMessage}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <Card className="p-5 pb-2">
          <h2 className="mb-1 text-base text-ink">Payment information</h2>
          <dl className="[&>div:last-child]:border-0">
            <InfoRow label="Payment ID">{payment.paymentId}</InfoRow>
            <InfoRow label="Order ID">{payment.orderId}</InfoRow>
            <InfoRow label="Product or service">{payment.productName}</InfoRow>
            <InfoRow label="Amount">
              {formatUsd(payment.amount)} {payment.asset}
            </InfoRow>
            <InfoRow label="Asset">{payment.asset}</InfoRow>
            <InfoRow label="Network">{payment.network}</InfoRow>
            <InfoRow label="Destination wallet" copy={payment.destinationAddress}>
              {truncateAddress(payment.destinationAddress)}
            </InfoRow>
            <InfoRow label="Customer wallet" copy={payment.customerWallet ?? undefined}>
              {payment.customerWallet ? truncateAddress(payment.customerWallet) : none("Not received yet")}
            </InfoRow>
            <InfoRow label="Transaction hash" copy={payment.transactionHash ?? undefined}>
              {payment.transactionHash ? truncateHash(payment.transactionHash, 8, 8) : none("Not available yet")}
            </InfoRow>
            <InfoRow label="Checkout link" copy={payment.checkoutUrl}>
              {payment.checkoutUrl}
            </InfoRow>
            <InfoRow label="Created">{formatDateTime(payment.createdAt)}</InfoRow>
            <InfoRow label="Paid">{payment.paidAt ? formatDateTime(payment.paidAt) : none("Not paid")}</InfoRow>
          </dl>
        </Card>
        <Verification payment={payment} />
      </div>
    </>
  );
}
