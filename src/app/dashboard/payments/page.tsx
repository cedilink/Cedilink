"use client";

import { ArrowRight, Plus, RefreshCw, Search } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import emptyArt from "@/assets/illustrations/empty-payments.svg";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Card, LoadError, Loading, PageHeader, PillButton, PillLink } from "@/components/dashboard/ui";
import type { Payment } from "@/lib/api/client";
import { usePayments } from "@/lib/dashboard/queries";
import { formatDate, formatUsd } from "@/lib/format";

const TABS = [
  ["all", "All"],
  ["awaiting", "Awaiting payment"],
  ["confirming", "Confirming"],
  ["paid", "Paid"],
  ["failed", "Failed"],
  ["expired", "Expired"],
] as const;
type TabId = (typeof TABS)[number][0];

function EmptyState({ title, message, children }: { title: string; message: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <Image src={emptyArt} alt="" width={72} height={69} unoptimized />
      <h2 className="mt-4 text-lg text-ink">{title}</h2>
      <p className="mt-1 max-w-xs text-xs text-muted">{message}</p>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Rows({ payments }: { payments: Payment[] }) {
  return (
    <Card className="overflow-hidden max-md:bg-transparent">
      {/* Desktop: table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-normal">Payment</th>
            <th className="px-4 py-3 font-normal">Order ID</th>
            <th className="px-4 py-3 font-normal">Amount</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Date</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.paymentId} className="group relative border-b border-line last:border-0 hover:bg-brand-wash/50">
              <td className="px-4 py-3">
                <Link href={`/dashboard/payments/${p.paymentId}`} className="text-ink after:absolute after:inset-0">
                  {p.productName}
                </Link>
                <span className="mt-1 block text-xs text-muted">{p.paymentId}</span>
              </td>
              <td className="px-4 py-3 text-ink">{p.orderId}</td>
              <td className="px-4 py-3 text-ink">
                {formatUsd(p.amount)}
                <span className="mt-1 block text-xs text-muted">{p.asset}</span>
              </td>
              <td className="px-4 py-3">
                <StatusPill payment={p} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{formatDate(p.createdAt)}</td>
              <td className="pr-4 text-ink">
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: one card per payment */}
      <ul className="flex flex-col gap-3 md:hidden">
        {payments.map((p) => (
          <li key={p.paymentId}>
            <Link href={`/dashboard/payments/${p.paymentId}`} className="block rounded-2xl bg-white p-4">
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm text-ink">{p.productName}</span>
                <ArrowRight className="mt-0.5 size-4 shrink-0" />
              </span>
              <span className="mt-1 block text-xs text-muted">{p.paymentId}</span>
              <span className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-ink">
                  {formatUsd(p.amount)} {p.asset}
                </span>
                <StatusPill payment={p} />
              </span>
              <span className="mt-3 flex justify-between text-xs text-muted">
                <span>{p.orderId}</span>
                <span>{formatDate(p.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PaymentsList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("status") ?? "all";
  const status: TabId = TABS.some(([id]) => id === requested) ? (requested as TabId) : "all";
  const q = params.get("q") ?? "";

  // Filter and search live in the URL, so a view can be bookmarked and survives a reload.
  // Reads the address bar at call time: a debounced search must not undo a tab change made meanwhile.
  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value && value !== "all") next.set(name, value);
    else next.delete(name);
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    // The URL changed from outside this box (sidebar search, back button).
    setSyncedQ(q);
    setDraft(q);
  }
  useEffect(() => {
    if (draft.trim() === q) return;
    const timer = setTimeout(() => setParam("q", draft.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setParam is rebuilt each render; only the text matters
  }, [draft]);

  const { data, error, refetch, isFetching } = usePayments(status, q);
  const counts = data?.counts;

  return (
    <>
      <PageHeader title="Payments">
        <PillButton variant="white" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </PillButton>
        <PillLink href="/dashboard/payments/new">
          <Plus className="size-4" /> Create payment
        </PillLink>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative xl:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink" />
          <input
            type="search"
            aria-label="Search payments or order ID"
            placeholder="Search payments or order ID"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm outline-none placeholder:text-ink/70 focus:ring-1 focus:ring-brand"
          />
        </div>
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {TABS.map(([id, label]) => {
            const active = id === status;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParam("status", id)}
                className={`relative isolate inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs ${active ? "text-brand" : "bg-white text-ink hover:bg-line"}`}
              >
                {active ? <motion.span layoutId="tab-active" className="absolute inset-0 -z-10 rounded-full bg-brand-tint" transition={{ type: "spring", stiffness: 420, damping: 36 }} /> : null}
                {label}
                <span className={active ? "text-brand" : "text-muted"}>{counts?.[id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <LoadError what="your payments" onRetry={() => refetch()} />
      ) : !data ? (
        <Loading />
      ) : data.payments.length > 0 ? (
        <Rows payments={data.payments} />
      ) : q ? (
        <EmptyState title="No results found" message={`No payments match “${q}”. Try another search.`}>
          <PillButton variant="soft" onClick={() => setDraft("")}>
            Clear search
          </PillButton>
        </EmptyState>
      ) : status !== "all" ? (
        <EmptyState title="Nothing here" message="No payments have this status right now.">
          <PillButton variant="soft" onClick={() => setParam("status", "all")}>
            Show all payments
          </PillButton>
        </EmptyState>
      ) : (
        <EmptyState title="No payments yet" message="Create your first payment to start tracking your checkouts.">
          <PillLink href="/dashboard/payments/new">
            <Plus className="size-4" /> Create payment
          </PillLink>
        </EmptyState>
      )}
    </>
  );
}

export default function PaymentsPage() {
  // useSearchParams needs a Suspense boundary so the rest of the page can be prerendered.
  return (
    <Suspense fallback={<Loading />}>
      <PaymentsList />
    </Suspense>
  );
}
