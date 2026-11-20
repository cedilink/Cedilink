"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  activeFilterCount,
  DATE_PRESETS,
  EMPTY_FILTERS,
  readFilters,
  STATUS_FILTERS,
  writeFilters,
  type Filters,
  type StatusFilter,
} from "@/lib/dashboard/filters";
import { Overlay } from "./overlay";
import { inputClass, PillButton } from "./ui";

/** Filters kept in the URL. Writing reads the address bar at call time, so quick changes do not undo each other. */
export function useUrlFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const filters = readFilters(useSearchParams());
  const set = (patch: Partial<Filters>) => {
    const next = writeFilters({ ...readFilters(new URLSearchParams(window.location.search)), ...patch });
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };
  return [filters, set];
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (q: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    // The URL changed from outside this box (sidebar search, back button).
    setSynced(value);
    setDraft(value);
  }
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => latest.current(draft.trim()), 300);
    return () => clearTimeout(timer);
  }, [draft, value]);
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink" aria-hidden />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-12 w-full rounded-full bg-surface pl-11 pr-4 text-sm outline-none placeholder:text-ink/60 focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}

export function StatusChips({ value, onChange, counts }: { value: StatusFilter; onChange: (s: StatusFilter) => void; counts?: Partial<Record<StatusFilter, number>> }) {
  return (
    <div role="radiogroup" aria-label="Filter by status" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {STATUS_FILTERS.map(([id, label]) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`relative isolate inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm ${active ? "text-brand" : "bg-surface text-ink hover:bg-line"}`}
          >
            {active ? (
              <motion.span layoutId="status-chip" className="absolute inset-0 -z-10 rounded-full bg-brand-tint" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
            ) : null}
            {label}
            {counts?.[id] !== undefined ? <span className={active ? "text-brand" : "text-muted"}>{counts[id]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** A pill that opens a small panel, as in the Transaction history design ("Date: All ▾"). */
function Dropdown({ label, value, children }: { label: string; value: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface px-4 text-sm text-ink hover:bg-line"
      >
        {label}: <span className={value === "All" || value === "Any" ? "text-ink" : "text-brand"}>{value}</span>
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <div id={id} className="absolute left-0 top-12 z-30 w-64 rounded-2xl border border-line bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

const dateLabel = (f: Filters) =>
  f.date === "custom" ? [f.from || "…", f.to || "…"].join(" – ") : (DATE_PRESETS.find(([id]) => id === f.date)?.[1] ?? "All");
const amountLabel = (f: Filters) =>
  f.minAmount && f.maxAmount ? `${f.minAmount}–${f.maxAmount}` : f.minAmount ? `≥ ${f.minAmount}` : f.maxAmount ? `≤ ${f.maxAmount}` : "Any";

function DateFields({ filters, onChange, onDone }: { filters: Filters; onChange: (p: Partial<Filters>) => void; onDone?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      {DATE_PRESETS.filter(([id]) => id !== "custom").map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            onChange({ date: id, from: "", to: "" });
            onDone?.();
          }}
          className={`h-9 rounded-xl px-3 text-left text-sm hover:bg-surface ${filters.date === id ? "text-brand" : "text-ink"}`}
        >
          {label}
        </button>
      ))}
      <p className="mt-2 px-1 text-xs text-muted">Custom range (UTC)</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" aria-label="From" className={`${inputClass} px-3`} value={filters.from} onChange={(e) => onChange({ date: "custom", from: e.target.value })} />
        <input type="date" aria-label="To" className={`${inputClass} px-3`} value={filters.to} onChange={(e) => onChange({ date: "custom", to: e.target.value })} />
      </div>
    </div>
  );
}

function AmountFields({ filters, onChange }: { filters: Filters; onChange: (p: Partial<Filters>) => void }) {
  const clean = (v: string) => v.replace(/[^\d.]/g, "");
  return (
    <div className="grid grid-cols-2 gap-2">
      <input inputMode="decimal" aria-label="Minimum amount" placeholder="Min" className={`${inputClass} px-3`} defaultValue={filters.minAmount} onBlur={(e) => onChange({ minAmount: clean(e.target.value) })} />
      <input inputMode="decimal" aria-label="Maximum amount" placeholder="Max" className={`${inputClass} px-3`} defaultValue={filters.maxAmount} onBlur={(e) => onChange({ maxAmount: clean(e.target.value) })} />
    </div>
  );
}

function AssetFields({ filters, onChange, onDone }: { filters: Filters; onChange: (p: Partial<Filters>) => void; onDone?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      {[
        ["", "All"],
        ["USDC", "USDC"],
      ].map(([id, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            onChange({ asset: id! });
            onDone?.();
          }}
          className={`h-9 rounded-xl px-3 text-left text-sm hover:bg-surface ${filters.asset === id ? "text-brand" : "text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const STATUS_LABEL = Object.fromEntries(STATUS_FILTERS) as Record<StatusFilter, string>;

/**
 * Date, amount, asset and status as pill dropdowns on desktop; one "Filters" button that
 * opens a sheet on phones. Active filters show as removable chips.
 */
export function AdvancedFilters({ filters, onChange }: { filters: Filters; onChange: (p: Partial<Filters>) => void }) {
  const [sheet, setSheet] = useState(false);
  const count = activeFilterCount(filters) + (filters.status !== "all" ? 1 : 0);
  const chips: [string, Partial<Filters>][] = [];
  if (filters.date !== "all") chips.push([`Date: ${dateLabel(filters)}`, { date: "all", from: "", to: "" }]);
  if (filters.minAmount || filters.maxAmount) chips.push([`Amount: ${amountLabel(filters)}`, { minAmount: "", maxAmount: "" }]);
  if (filters.asset) chips.push([`Asset: ${filters.asset}`, { asset: "" }]);
  if (filters.status !== "all") chips.push([`Status: ${STATUS_LABEL[filters.status]}`, { status: "all" }]);

  return (
    <>
      <div className="hidden flex-wrap gap-2 md:flex">
        <Dropdown label="Date" value={dateLabel(filters)}>
          {(close) => <DateFields filters={filters} onChange={onChange} onDone={close} />}
        </Dropdown>
        <Dropdown label="Amount" value={amountLabel(filters)}>
          {() => <AmountFields filters={filters} onChange={onChange} />}
        </Dropdown>
        <Dropdown label="Asset" value={filters.asset || "All"}>
          {(close) => <AssetFields filters={filters} onChange={onChange} onDone={close} />}
        </Dropdown>
        <Dropdown label="Status" value={STATUS_LABEL[filters.status]}>
          {(close) => (
            <div className="flex flex-col gap-1">
              {STATUS_FILTERS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange({ status: id });
                    close();
                  }}
                  className={`h-9 rounded-xl px-3 text-left text-sm hover:bg-surface ${filters.status === id ? "text-brand" : "text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
      </div>
      <PillButton variant="soft" className="md:hidden" onClick={() => setSheet(true)}>
        <SlidersHorizontal className="size-4" /> Filters{count ? ` · ${count}` : ""}
      </PillButton>
      {chips.length ? (
        <div className="flex basis-full flex-wrap gap-2">
          {chips.map(([label, reset]) => (
            <button key={label} type="button" onClick={() => onChange(reset)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-tint px-3 text-xs text-brand">
              {label} <X className="size-3" aria-label="Remove filter" />
            </button>
          ))}
          <button type="button" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q })} className="h-8 px-2 text-xs text-muted hover:text-ink">
            Clear all
          </button>
        </div>
      ) : null}
      <Overlay open={sheet} onClose={() => setSheet(false)} title="Filters">
        <div className="flex flex-col gap-5">
          <section>
            <h3 className="mb-2 text-sm text-heading">Date</h3>
            <DateFields filters={filters} onChange={onChange} />
          </section>
          <section>
            <h3 className="mb-2 text-sm text-heading">Amount</h3>
            <AmountFields filters={filters} onChange={onChange} />
          </section>
          <section>
            <h3 className="mb-2 text-sm text-heading">Asset</h3>
            <AssetFields filters={filters} onChange={onChange} />
          </section>
          <section>
            <h3 className="mb-2 text-sm text-heading">Status</h3>
            <StatusChips value={filters.status} onChange={(status) => onChange({ status })} />
          </section>
          <PillButton onClick={() => setSheet(false)}>Show results</PillButton>
        </div>
      </Overlay>
    </>
  );
}
