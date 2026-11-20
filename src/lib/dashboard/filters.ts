// Filters for payment links and Transaction history. They live in the URL, so a view can be
// bookmarked and survives a reload; one function serialises them for both the URL and the API.

export const STATUS_FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["flagged", "Flagged"],
  ["failed", "Failed"],
  ["expired", "Expired"],
  ["cancelled", "Cancelled"],
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number][0];

export const DATE_PRESETS = [
  ["all", "All"],
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["custom", "Custom"],
] as const;
export type DatePreset = (typeof DATE_PRESETS)[number][0];

export interface Filters {
  q: string;
  status: StatusFilter;
  date: DatePreset;
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  asset: string;
}

export const EMPTY_FILTERS: Filters = { q: "", status: "all", date: "all", from: "", to: "", minAmount: "", maxAmount: "", asset: "" };

const isStatus = (v: string | null): v is StatusFilter => STATUS_FILTERS.some(([id]) => id === v);
const isPreset = (v: string | null): v is DatePreset => DATE_PRESETS.some(([id]) => id === v);
const isDay = (v: string | null) => v !== null && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isAmount = (v: string | null) => v !== null && /^\d{1,12}(\.\d{1,7})?$/.test(v);

/** Reads filters from the URL, ignoring anything malformed. */
export function readFilters(params: URLSearchParams): Filters {
  const date = params.get("date");
  return {
    q: params.get("q")?.trim() ?? "",
    status: isStatus(params.get("status")) ? (params.get("status") as StatusFilter) : "all",
    date: isPreset(date) ? date : "all",
    from: isDay(params.get("from")) ? params.get("from")! : "",
    to: isDay(params.get("to")) ? params.get("to")! : "",
    minAmount: isAmount(params.get("min")) ? params.get("min")! : "",
    maxAmount: isAmount(params.get("max")) ? params.get("max")! : "",
    asset: params.get("asset") === "USDC" ? "USDC" : "",
  };
}

/** Writes filters back to the URL, leaving out defaults so links stay short. */
export function writeFilters(f: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.status !== "all") params.set("status", f.status);
  if (f.date !== "all") params.set("date", f.date);
  if (f.date === "custom") {
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
  }
  if (f.minAmount) params.set("min", f.minAmount);
  if (f.maxAmount) params.set("max", f.maxAmount);
  if (f.asset) params.set("asset", f.asset);
  return params;
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** The API's query string for these filters. Date presets become UTC days, relative to `now`. */
export function apiQuery(f: Filters, now = new Date()): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.status !== "all") params.set("status", f.status);
  if (f.date === "today") params.set("from", day(now));
  if (f.date === "7d") params.set("from", day(new Date(now.getTime() - 6 * 86_400_000)));
  if (f.date === "30d") params.set("from", day(new Date(now.getTime() - 29 * 86_400_000)));
  if (f.date === "custom") {
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
  }
  if (f.minAmount) params.set("minAmount", f.minAmount);
  if (f.maxAmount) params.set("maxAmount", f.maxAmount);
  if (f.asset) params.set("asset", f.asset);
  return params.toString();
}

/** How many filters besides search and status are set; shown on the mobile "Filters" button. */
export function activeFilterCount(f: Filters): number {
  return [f.date !== "all", Boolean(f.minAmount || f.maxAmount), Boolean(f.asset)].filter(Boolean).length;
}

/** A 64-character hex string is a Stellar transaction hash; the sidebar search sends it to Transaction history. */
export const looksLikeHash = (q: string) => /^[0-9a-fA-F]{64}$/.test(q.trim());
