"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import highFive from "@/assets/illustrations/high-five.svg";
import { Overlay } from "@/components/dashboard/overlay";
import { CheckRows, ResolveDialog } from "@/components/dashboard/reconcile";
import { TransferPill } from "@/components/dashboard/status-pill";
import { Card, Empty, LoadError, PageHeader, PillButton, SkeletonRows } from "@/components/dashboard/ui";
import type { Transfer } from "@/lib/api/client";
import { expectedVsReceived, reasonLabel } from "@/lib/dashboard/labels";
import { useReconciliation } from "@/lib/dashboard/queries";
import { formatDateTime, truncateHash } from "@/lib/format";

const TABS = [
  ["matched", "Matched"],
  ["unmatched", "Unmatched"],
  ["resolved", "Resolved"],
] as const;
type Tab = (typeof TABS)[number][0];

const COLUMNS = "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function ItemRow({ t, selected, onSelect }: { t: Transfer; selected: boolean; onSelect: () => void }) {
  const assetMismatch = t.expected && t.expected.asset !== t.received.asset;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl border px-5 py-4 text-left transition-colors lg:min-h-[84px] ${COLUMNS} ${
          selected ? "border-brand ring-[3px] ring-brand-tint" : "border-line hover:border-brand/30"
        }`}
      >
        <span className={`text-[15px] ${t.paymentId ? "text-ink" : "text-muted"}`}>{t.paymentId ?? "No reference"}</span>
        <span className="text-[15px] text-ink max-lg:order-3">{expectedVsReceived(t)}</span>
        <span className={`text-[15px] max-lg:hidden ${assetMismatch || t.checks?.asset === false ? "text-failed" : "text-ink"}`}>
          {assetMismatch ? `${t.expected!.asset} → ${t.received.asset}` : t.received.asset}
        </span>
        <span className={`text-[15px] max-lg:hidden ${t.checks?.recipient === false ? "text-failed" : "text-paid"}`}>
          {t.checks ? (t.checks.recipient ? "Matches" : "Different wallet") : "—"}
        </span>
        <span className="truncate text-sm text-brand max-lg:order-4 max-lg:justify-self-end">{truncateHash(t.transactionHash, 8, 8)}</span>
        <span className="max-lg:order-2 max-lg:justify-self-end">
          {t.state === "matched" || t.resolution ? (
            <TransferPill transfer={t} />
          ) : (
            <span className="inline-flex flex-col items-end gap-1 lg:items-start">
              <TransferPill transfer={t} />
              <span className="text-xs text-muted">{reasonLabel(t.reason)}</span>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function Detail({ t, onResolve }: { t: Transfer; onResolve: (action: "accept" | "dismiss") => void }) {
  return (
    <div>
      <p className="text-sm text-heading">{t.reasonMessage}</p>
      <div className="mt-3">
        <CheckRows transfer={t} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Link href={`/dashboard/transactions/${t.id}`} className="text-sm text-brand hover:underline">
          View transaction {truncateHash(t.transactionHash, 8, 8)}
        </Link>
        {t.paymentId ? (
          <Link href={`/dashboard/links/${t.paymentId}`} className="text-sm text-brand hover:underline">
            Open {t.paymentId}
          </Link>
        ) : null}
      </div>
      {t.resolution ? (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-heading">
          {t.resolution.action === "accepted" ? "Accepted as paid" : "Dismissed"}
          {t.resolution.resolvedAt ? ` on ${formatDateTime(t.resolution.resolvedAt)}` : ""}
          {t.resolution.note ? ` · “${t.resolution.note}”` : ""}
        </p>
      ) : t.needsReview ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-xs text-muted">
            {t.acceptable
              ? `Accept marks ${t.paymentId} as paid. Dismiss keeps the request open and records that you've reviewed this payment.`
              : "This payment can't be accepted. Dismiss it once you've dealt with it."}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <PillButton variant="white" onClick={() => onResolve("dismiss")} className={t.acceptable ? "" : "col-span-2"}>
              Dismiss
            </PillButton>
            {t.acceptable ? <PillButton onClick={() => onResolve("accept")}>Accept as paid</PillButton> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReconciliationView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = TABS.some(([id]) => id === params.get("tab")) ? (params.get("tab") as Tab) : "unmatched";
  const itemId = params.get("item");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { data, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useReconciliation(tab);
  const [resolving, setResolving] = useState<"accept" | "dismiss" | null>(null);

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const counts = data?.pages[0]?.counts;
  const selected = items.find((i) => i.id === itemId) ?? (desktop && tab === "unmatched" ? items[0] : undefined);

  const go = (next: { tab?: Tab; item?: string | null }) => {
    const q = new URLSearchParams(window.location.search);
    if (next.tab) {
      q.set("tab", next.tab);
      q.delete("item");
    }
    if (next.item !== undefined) {
      if (next.item) q.set("item", next.item);
      else q.delete("item");
    }
    router.replace(`${pathname}?${q}`, { scroll: false });
  };

  const detailTitle = selected ? `${selected.needsReview ? (selected.state === "unmatched" ? "Unmatched" : "Flagged") : selected.resolution ? "Resolved" : "Matched"} detail · ${selected.paymentId ?? "no reference"}` : "";

  return (
    <>
      <PageHeader title="Reconciliation" subtitle="Verify payments against your requests · Stellar Testnet">
        <div role="tablist" aria-label="Reconciliation views" className="flex flex-wrap gap-2">
          {TABS.map(([id, label]) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => go({ tab: id })}
                className={`relative isolate inline-flex h-11 items-center rounded-full px-5 text-[15px] ${active ? "text-white" : "bg-surface text-heading hover:bg-line"}`}
              >
                {active ? <motion.span layoutId="recon-tab" className="absolute inset-0 -z-10 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 36 }} /> : null}
                {label} · {counts?.[id] ?? "…"}
              </button>
            );
          })}
        </div>
      </PageHeader>

      {error ? (
        <LoadError what="reconciliation" onRetry={() => refetch()} />
      ) : !data ? (
        <SkeletonRows label="Loading reconciliation" />
      ) : items.length === 0 ? (
        tab === "unmatched" ? (
          <Empty
            title="Everything matches"
            message="Every payment that reached your wallet matches a request. New mismatches appear here and in your notifications."
            art={<Image src={highFive} alt="" width={64} height={58} unoptimized />}
          />
        ) : tab === "resolved" ? (
          <Empty title="Nothing resolved yet" message="Payments you accept or dismiss are kept here for your records." />
        ) : (
          <Empty title="No matched payments yet" message="Payments that match their request, by recipient, asset, amount and reference, are listed here." />
        )
      ) : (
        <>
          <div className={`mb-3 hidden h-12 items-center gap-x-4 rounded-2xl bg-surface px-5 text-sm text-heading lg:grid ${COLUMNS}`}>
            <span>Request</span>
            <span>Expected vs Received</span>
            <span>Asset</span>
            <span>Recipient check</span>
            <span>Tx hash</span>
            <span>Status</span>
          </div>
          <ul className="flex flex-col gap-3">
            {items.map((t) => (
              <ItemRow key={t.id} t={t} selected={selected?.id === t.id} onSelect={() => go({ item: t.id })} />
            ))}
          </ul>
          <p className="mt-4 text-sm text-heading">
            {tab === "matched"
              ? "Verified recipient, asset, amount and reference"
              : `${items.length} of ${counts?.[tab] ?? items.length} ${tab} payments shown`}
          </p>
          {hasNextPage ? (
            <PillButton variant="soft" className="mt-3" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading…" : "Show more"}
            </PillButton>
          ) : null}

          {desktop && selected ? (
            <Card className="mt-6 max-w-3xl p-6">
              <h2 className="mb-1 text-lg text-ink">{detailTitle}</h2>
              <Detail t={selected} onResolve={setResolving} />
            </Card>
          ) : null}
        </>
      )}

      {/* Phones: the detail opens as a sheet, with the actions in thumb reach. */}
      <Overlay open={!desktop && Boolean(selected)} onClose={() => go({ item: null })} title={detailTitle}>
        {selected ? <Detail t={selected} onResolve={setResolving} /> : null}
      </Overlay>
      <ResolveDialog transfer={resolving && selected ? selected : null} action={resolving ?? "accept"} onClose={() => setResolving(null)} />
    </>
  );
}

export default function ReconciliationPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading reconciliation" />}>
      <ReconciliationView />
    </Suspense>
  );
}
