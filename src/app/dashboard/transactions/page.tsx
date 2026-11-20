"use client";

import { Download, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdvancedFilters, SearchBox, useUrlFilters } from "@/components/dashboard/filter-bar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Empty, LoadError, PageHeader, PillButton, SkeletonRows } from "@/components/dashboard/ui";
import type { TransactionRow } from "@/lib/api/client";
import { apiQuery, EMPTY_FILTERS } from "@/lib/dashboard/filters";
import { useTransactions } from "@/lib/dashboard/queries";
import { formatDate, truncateHash } from "@/lib/format";

const trim = (a: string) => a.replace(/\.00$/, "");
const COLUMNS = "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_auto]";

function Hash({ row }: { row: TransactionRow }) {
  const t = row.latestTransfer;
  if (!t) return <span className="text-sm text-muted">Not submitted</span>;
  return (
    <span className="min-w-0">
      <Link href={`/dashboard/transactions/${t.id}`} className="block truncate text-sm text-ink hover:underline">
        {truncateHash(t.transactionHash, 8, 8)}
      </Link>
      <a href={t.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
        Stellar explorer <SquareArrowOutUpRight className="size-3" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </span>
  );
}

function Row({ row }: { row: TransactionRow }) {
  const customer = row.customer.reference ?? row.customer.name ?? "—";
  return (
    <li className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl border border-line px-5 py-4 lg:min-h-[88px] ${COLUMNS}`}>
      <span className="min-w-0">
        <span className="block text-[15px] text-ink">{row.paymentId}</span>
        <span className="block truncate text-sm text-muted">{customer}</span>
      </span>
      <span className="text-[15px] text-ink max-lg:order-3">
        {trim(row.amount)}
        <span className="lg:hidden"> {row.asset}</span>
      </span>
      <span className="hidden text-[15px] text-ink lg:block">{row.asset}</span>
      <span className="max-lg:order-2 max-lg:justify-self-end">
        <StatusPill payment={row} />
      </span>
      <span className="text-sm text-ink max-lg:order-4 max-lg:justify-self-end">{formatDate(row.latestTransfer?.ledgerClosedAt ?? row.createdAt)}</span>
      <span className="min-w-0 max-lg:order-5">
        <Hash row={row} />
      </span>
      <Link href={`/dashboard/links/${row.paymentId}`} className="text-[15px] text-brand hover:underline max-lg:order-6 max-lg:justify-self-end">
        View<span className="lg:hidden"> details</span>
        <span className="sr-only"> for {row.paymentId}</span>
      </Link>
    </li>
  );
}

function Transactions() {
  const [filters, setFilters] = useUrlFilters();
  const query = apiQuery(filters);
  const { data, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactions(query);
  const rows = data?.pages.flatMap((p) => p.transactions) ?? [];
  const total = data?.pages[0]?.total;
  const filtered = query !== "";
  const csvQuery = apiQuery({ ...filters });

  return (
    <>
      <PageHeader title="Transaction history" subtitle="Stellar Testnet · All payment activity" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 basis-full gap-3">
          <SearchBox value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search hash, request ref, customer ref" />
        </div>
        <AdvancedFilters filters={filters} onChange={setFilters} />
        <a
          href={`/api/reports/transactions.csv${csvQuery ? `?${csvQuery}` : ""}`}
          download
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover max-md:basis-full md:ml-auto"
        >
          <Download className="size-4" aria-hidden /> Download CSV
          {total !== undefined ? <span className="text-white/80">· {total > 50_000 ? "first 50,000" : `${total} rows`}</span> : null}
        </a>
      </div>

      {error ? (
        <LoadError what="your transactions" onRetry={() => refetch()} />
      ) : !data ? (
        <SkeletonRows label="Loading transactions" />
      ) : rows.length === 0 ? (
        filtered ? (
          <Empty title="No transactions match these filters" message="Try a wider date range, another search, or clear the filters.">
            <PillButton variant="tint" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
              Clear filters
            </PillButton>
          </Empty>
        ) : (
          <Empty title="No transactions yet" message="Payments to your links appear here, with their Stellar transaction and status." />
        )
      ) : (
        <>
          <div className={`mb-3 hidden h-12 items-center gap-x-4 rounded-2xl bg-surface px-5 text-sm text-heading lg:grid ${COLUMNS}`}>
            <span>Request / customer</span>
            <span>Amount</span>
            <span>Asset</span>
            <span>Status</span>
            <span>Date</span>
            <span>Transaction</span>
            <span className="w-[38px]" />
          </div>
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <Row key={row.paymentId} row={row} />
            ))}
          </ul>
          {hasNextPage ? (
            <PillButton variant="soft" className="mt-4" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading…" : "Show more"}
            </PillButton>
          ) : null}
        </>
      )}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading transactions" />}>
      <Transactions />
    </Suspense>
  );
}
