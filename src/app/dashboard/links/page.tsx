"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import emptyArt from "@/assets/illustrations/empty-payments.svg";
import { SearchBox, StatusChips, useUrlFilters } from "@/components/dashboard/filter-bar";
import { CopyLinkButton, ShareLinkButton } from "@/components/dashboard/share";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Empty, LoadError, PageHeader, PillButton, PillLink, SkeletonRows } from "@/components/dashboard/ui";
import type { Payment } from "@/lib/api/client";
import { apiQuery, EMPTY_FILTERS } from "@/lib/dashboard/filters";
import { usePayments } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";

const displayUrl = (url: string) => url.replace(/^https?:\/\//, "");
const trimAmount = (a: string) => a.replace(/\.00$/, "");

function LinkRow({ p }: { p: Payment }) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 rounded-2xl border border-line px-5 py-4 lg:min-h-[88px] lg:grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto]">
      <div className="min-w-0">
        <Link href={`/dashboard/links/${p.paymentId}`} className="block truncate text-[15px] text-ink hover:underline">
          {p.paymentId} · {p.productName}
        </Link>
        <span className="mt-0.5 block truncate text-sm text-brand">{displayUrl(p.checkoutUrl)}</span>
      </div>
      <span className="text-[15px] text-ink max-lg:order-3">
        {trimAmount(p.amount)} {p.asset}
      </span>
      <span className="max-lg:order-2 max-lg:justify-self-end">
        <StatusPill payment={p} />
      </span>
      <span className="text-sm text-ink max-lg:order-4 max-lg:justify-self-end">{formatDate(p.createdAt)}</span>
      <div className="col-span-2 flex items-center gap-2 max-lg:order-5 lg:col-span-1">
        <CopyLinkButton url={p.checkoutUrl} />
        <ShareLinkButton url={p.checkoutUrl} title={p.productName} />
        <Link href={`/dashboard/links/${p.paymentId}`} className="ml-auto inline-flex h-9 items-center px-3 text-[15px] text-brand hover:underline lg:ml-4">
          View<span className="sr-only"> {p.paymentId}</span>
        </Link>
      </div>
    </li>
  );
}

function Links() {
  const [filters, setFilters] = useUrlFilters();
  const query = apiQuery({ ...EMPTY_FILTERS, q: filters.q, status: filters.status });
  const { data, error, refetch } = usePayments(query);
  const counts = data?.counts;

  return (
    <>
      <PageHeader title="Link management" subtitle={`${counts?.all ?? "…"} payment links · Stellar Testnet`}>
        <PillLink href="/dashboard/links/new">
          <Plus className="size-4" /> Create payment link
        </PillLink>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3">
        <SearchBox value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search links or request reference" />
        <StatusChips value={filters.status} onChange={(status) => setFilters({ status })} counts={counts} />
      </div>

      {error ? (
        <LoadError what="your payment links" onRetry={() => refetch()} />
      ) : !data ? (
        <SkeletonRows label="Loading payment links" />
      ) : data.payments.length > 0 ? (
        <>
          <div className="mb-3 hidden h-12 grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] items-center gap-x-4 rounded-2xl bg-surface px-5 text-sm text-heading lg:grid">
            <span>Payment link</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Created</span>
            <span className="w-[226px]">Actions</span>
          </div>
          <ul className="flex flex-col gap-3">
            {data.payments.map((p) => (
              <LinkRow key={p.paymentId} p={p} />
            ))}
          </ul>
          {data.nextCursor ? <p className="mt-4 text-sm text-muted">Showing the latest 50. Search or filter to find older links.</p> : null}
        </>
      ) : filters.q ? (
        <Empty title="No results found" message={`No payment links match “${filters.q}”. Try another search.`}>
          <PillButton variant="soft" onClick={() => setFilters({ q: "" })}>
            Clear search
          </PillButton>
        </Empty>
      ) : filters.status !== "all" ? (
        <Empty title="Nothing here" message="No payment links have this status right now.">
          <PillButton variant="soft" onClick={() => setFilters({ status: "all" })}>
            Show all links
          </PillButton>
        </Empty>
      ) : (
        <Empty
          title="No payment links yet"
          message="Each link is a checkout page for one order. Your customer pays with USDC on Stellar."
          art={<Image src={emptyArt} alt="" width={96} height={92} unoptimized />}
        >
          <PillLink href="/dashboard/links/new">
            <Plus className="size-4" /> Create payment link
          </PillLink>
        </Empty>
      )}
    </>
  );
}

export default function LinksPage() {
  // useSearchParams needs a Suspense boundary so the rest of the page can be prerendered.
  return (
    <Suspense fallback={<SkeletonRows label="Loading payment links" />}>
      <Links />
    </Suspense>
  );
}
