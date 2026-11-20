"use client";

import { ArrowRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import emptyArt from "@/assets/illustrations/empty-payments.svg";
import { CountUp } from "@/components/dashboard/count-up";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Empty, LoadError, PageHeader, PillLink, SkeletonRows } from "@/components/dashboard/ui";
import { useOverview, useStellarSettings } from "@/lib/dashboard/queries";
import { formatUsd } from "@/lib/format";

function Stat({ label, href, children, note }: { label: string; href: string; children: ReactNode; note: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand/30">
      <p className="text-sm text-heading">{label}</p>
      <p className="mt-3 text-[32px] leading-none tracking-tight text-ink">{children}</p>
      <p className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
        {note}
        <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </p>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, error, refetch } = useOverview();
  const settings = useStellarSettings().data;
  const whole = useCallback((n: number) => String(Math.round(n)), []);
  const money = useCallback((n: number) => formatUsd(n.toFixed(2)), []);
  const ready = settings?.enabled && settings.receivingAddress;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Stellar Testnet · Merchant workspace">
        <PillLink href="/dashboard/links/new">
          <Plus className="size-4" /> Create payment link
        </PillLink>
      </PageHeader>

      {settings && !ready ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/15 bg-brand-wash px-5 py-4">
          <p className="min-w-0 flex-1 text-sm text-ink">
            Add a receiving wallet to start. Payment links need a Stellar wallet to receive USDC.
          </p>
          <PillLink href="/dashboard/payment-methods/stellar-usdc">Set up Stellar USDC</PillLink>
        </div>
      ) : null}

      {error ? (
        <LoadError what="your merchant workspace" onRetry={() => refetch()} />
      ) : !data ? (
        <SkeletonRows rows={4} label="Loading dashboard" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Verified payments" href="/dashboard/transactions?status=confirmed" note={`${data.verified.asset} · ${data.verified.count} transactions`}>
              <CountUp value={Number(data.verified.amount)} format={money} />
            </Stat>
            <Stat label="Pending requests" href="/dashboard/links?status=pending" note="Awaiting customer payment">
              <CountUp value={data.pendingRequests} format={whole} />
            </Stat>
            <Stat label="Unmatched payments" href="/dashboard/reconciliation" note="Review in Reconciliation">
              <span className={data.unmatched > 0 ? "text-failed" : undefined}>
                <CountUp value={data.unmatched} format={whole} />
              </span>
            </Stat>
            <Stat label="Payment links" href="/dashboard/links" note="Links created">
              <CountUp value={data.linksCreated} format={whole} />
            </Stat>
          </div>

          <div className="mb-4 mt-9">
            <h2 className="text-xl tracking-tight text-ink">Recent activity</h2>
            <p className="mt-1 text-sm text-brand">Latest requests and payment checks</p>
          </div>

          {data.recentActivity.length === 0 ? (
            <Empty
              title="No activity yet"
              message="Create a payment link and share it with a customer. Payments and checks will show up here."
              art={<Image src={emptyArt} alt="" width={96} height={92} unoptimized />}
            >
              <PillLink href="/dashboard/links/new">
                <Plus className="size-4" /> Create payment link
              </PillLink>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="hidden h-12 grid-cols-[1.4fr_1fr_1fr_24px] items-center gap-4 rounded-2xl bg-surface px-5 text-sm text-heading md:grid">
                <span>Request reference</span>
                <span>Amount</span>
                <span>Status</span>
                <span />
              </div>
              {data.recentActivity.map((p) => (
                <Link
                  key={p.paymentId}
                  href={`/dashboard/links/${p.paymentId}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl border border-line px-5 py-4 transition-colors hover:border-brand/30 md:min-h-[72px] md:grid-cols-[1.4fr_1fr_1fr_24px]"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] text-ink">{p.paymentId}</span>
                    <span className="block truncate text-xs text-muted">{p.productName}</span>
                  </span>
                  <span className="text-[15px] text-ink max-md:order-3">
                    {p.amount.replace(/\.00$/, "")} {p.asset}
                  </span>
                  <span className="max-md:order-2 max-md:justify-self-end">
                    <StatusPill payment={p} />
                  </span>
                  <ArrowRight className="hidden size-4 text-muted transition-transform group-hover:translate-x-0.5 md:block" aria-hidden />
                </Link>
              ))}
              <Link href="/dashboard/transactions" className="mt-1 self-start text-sm text-brand hover:underline">
                View transaction history
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
