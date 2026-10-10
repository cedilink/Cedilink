/** "GBXKABCD…7QLM" style shortening for Stellar addresses. */
export function truncateAddress(address: string, lead = 4, tail = 4): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function truncateHash(hash: string, lead = 4, tail = 4): string {
  return truncateAddress(hash, lead, tail);
}

/** "25.00" -> "$25.00". Amounts stay strings end to end; they are never parsed to floats for maths. */
export function formatUsd(amount: string): string {
  const [whole = "0", fraction = "00"] = amount.split(".");
  return `$${Number(whole).toLocaleString("en-US")}.${fraction}`;
}

export function formatAsset(amount: string, asset: string): string {
  return `${amount} ${asset}`;
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "09 Oct 2026, 10:24 UTC". Fixed to UTC so server and browser render the same text. */
export function formatDateTime(iso: string): string {
  return `${dateTime.format(new Date(iso))} UTC`;
}

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}
