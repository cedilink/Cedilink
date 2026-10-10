"use client";

import { ArrowRight, CircleAlert, CircleCheck, Clock, Plus, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import bitcoin from "@/assets/illustrations/bitcoin.png";
import stellarLogo from "@/assets/illustrations/stellar-logo.png";
import walletCards from "@/assets/illustrations/wallet-cards.png";
import { CountUp } from "@/components/dashboard/count-up";
import { Card, LoadError, Loading, PageHeader, PillButton, PillLink } from "@/components/dashboard/ui";
import type { Overview } from "@/lib/api/client";
import { useOverview } from "@/lib/dashboard/queries";
import { formatUsd, truncateAddress } from "@/lib/format";

function Stat({ icon, tone, label, children, note }: { icon: ReactNode; tone: string; label: string; children: ReactNode; note: string }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-xs text-ink">
        <span className={`grid size-6 place-items-center rounded-md ${tone}`}>{icon}</span>
        {label}
      </p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[28px] leading-tight tracking-tight text-ink">{children}</p>
      <p className="mt-2 truncate text-xs text-muted">{note}</p>
    </Card>
  );
}

function Money({ amount, asset }: { amount: string; asset: string }) {
  const format = useCallback((n: number) => formatUsd(n.toFixed(2)), []);
  return (
    <>
      <CountUp value={Number(amount)} format={format} />
      <span className="text-[11px] tracking-normal text-muted">{asset}</span>
    </>
  );
}

function Change({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  const up = percent >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] tracking-normal ${up ? "bg-paid-tint text-paid" : "bg-failed-tint text-failed"}`}>
      <Icon className="size-3" />
      {Math.abs(percent)}%
    </span>
  );
}

const METHOD_ART = { stellar_usdc: stellarLogo, card: walletCards, crypto: bitcoin } as const;

function MethodCard({ method }: { method: Overview["methods"][number] }) {
  const art = METHOD_ART[method.id as keyof typeof METHOD_ART] ?? stellarLogo;
  const isStellar = method.id === "stellar_usdc";
  const subtitle = isStellar
    ? method.receivingAddress
      ? `Receiving wallet ${truncateAddress(method.receivingAddress)}`
      : "No receiving wallet yet"
    : method.id === "card"
      ? "Card payments"
      : "Other networks";

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Image src={art} alt="" width={40} height={40} className="size-10 rounded-lg object-contain" />
        <div className="min-w-0">
          <p className="text-sm text-ink">{method.label}</p>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      {isStellar && !method.enabled ? (
        <div className="mt-auto p-4 pt-2">
          <p className="mb-2 text-xs text-muted">Stellar USDC is not enabled yet</p>
          <PillLink href="/dashboard/payment-methods/stellar-usdc" className="w-full">
            Enable Stellar USDC
          </PillLink>
        </div>
      ) : (
        <>
          <div className="px-4 pb-4">
            <p className="text-xs text-muted">Received this month</p>
            <p className="mt-1 text-[28px] leading-tight tracking-tight text-ink">
              {method.receivedThisMonth === null ? <span className="text-subtle">—</span> : formatUsd(method.receivedThisMonth)}
            </p>
          </div>
          <div className="mt-auto flex h-11 items-center justify-between border-t border-line px-4 text-xs text-muted">
            {isStellar ? (
              <>
                <span>{method.network?.replace("Stellar ", "")}</span>
                <Link href="/dashboard/payment-methods/stellar-usdc" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
                  Manage <ArrowRight className="size-4" />
                </Link>
              </>
            ) : (
              <span>Not available in this demo</span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export default function OverviewPage() {
  const { data, error, refetch, isFetching } = useOverview();
  const whole = useCallback((n: number) => String(Math.round(n)), []);

  return (
    <>
      <PageHeader title="Overview">
        <PillButton variant="white" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </PillButton>
        <PillLink href="/dashboard/payments/new">
          <Plus className="size-4" /> Create payment
        </PillLink>
      </PageHeader>

      {error ? (
        <LoadError what="your merchant workspace" onRetry={() => refetch()} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat
              icon={<Wallet className="size-3.5" />}
              tone="bg-paid-tint text-paid"
              label="Total Received"
              note={
                data.totalReceived.changePercent === null
                  ? Number(data.totalReceived.amount) === 0
                    ? "No payments received yet"
                    : "Verified on Stellar"
                  : `${data.totalReceived.changePercent >= 0 ? "+" : ""}${data.totalReceived.changePercent}% vs last month`
              }
            >
              <Money amount={data.totalReceived.amount} asset={data.totalReceived.asset} />
            </Stat>
            <Stat icon={<Clock className="size-3.5" />} tone="bg-awaiting-tint text-awaiting" label="Awaiting Payment" note={`${data.awaitingPayment.openCheckouts} open checkouts`}>
              <Money amount={data.awaitingPayment.amount} asset={data.awaitingPayment.asset} />
            </Stat>
            <Stat icon={<CircleCheck className="size-3.5" />} tone="bg-confirming-tint text-confirming" label="Paid This Month" note="Payments verified on Stellar">
              <CountUp value={data.paidThisMonth.count} format={whole} />
              <Change percent={data.paidThisMonth.changePercent} />
            </Stat>
            <Stat icon={<CircleAlert className="size-3.5" />} tone="bg-failed-tint text-failed" label="Needs Attention" note="Failed or expired payments">
              <CountUp value={data.needsAttention.count} format={whole} />
            </Stat>
          </div>

          <div className="mb-3 mt-7 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg tracking-tight text-ink">Payment methods</h2>
            {data.methods.find((m) => m.id === "stellar_usdc")?.enabled ? (
              <span className="rounded-full bg-paid-tint px-3 py-1.5 text-xs text-paid">Stellar Testnet connected</span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {data.methods.map((method) => (
              <MethodCard key={method.id} method={method} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
