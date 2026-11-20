import { describe, expect, it } from "vitest";
import { activeFilterCount, apiQuery, EMPTY_FILTERS, looksLikeHash, readFilters, writeFilters } from "./filters";

describe("dashboard filters", () => {
  it("round-trips through the URL and leaves defaults out", () => {
    const f = { ...EMPTY_FILTERS, q: "CUS-101", status: "flagged" as const, minAmount: "50" };
    expect(writeFilters(f).toString()).toBe("q=CUS-101&status=flagged&min=50");
    expect(readFilters(writeFilters(f))).toEqual(f);
    expect(writeFilters(EMPTY_FILTERS).toString()).toBe("");
  });

  it("ignores malformed values", () => {
    const f = readFilters(new URLSearchParams("status=paid&date=yesterday&from=10/10/2026&min=-5&asset=BTC"));
    expect(f).toEqual(EMPTY_FILTERS);
  });

  it("turns date presets into UTC days for the API", () => {
    const now = new Date("2026-11-20T09:00:00Z");
    expect(apiQuery({ ...EMPTY_FILTERS, date: "7d" }, now)).toBe("from=2026-11-14");
    expect(apiQuery({ ...EMPTY_FILTERS, date: "today" }, now)).toBe("from=2026-11-20");
    expect(apiQuery({ ...EMPTY_FILTERS, date: "custom", from: "2026-10-01", to: "2026-10-31" }, now)).toBe("from=2026-10-01&to=2026-10-31");
    // A custom range is only applied when "custom" is chosen.
    expect(apiQuery({ ...EMPTY_FILTERS, from: "2026-10-01" }, now)).toBe("");
  });

  it("names amount filters the way the API expects", () => {
    expect(apiQuery({ ...EMPTY_FILTERS, minAmount: "10", maxAmount: "100", asset: "USDC" })).toBe("minAmount=10&maxAmount=100&asset=USDC");
  });

  it("counts the filters hidden behind the mobile button", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, date: "7d", minAmount: "1", q: "x" })).toBe(2);
  });

  it("recognises a transaction hash", () => {
    expect(looksLikeHash("a".repeat(64))).toBe(true);
    expect(looksLikeHash("SP-00124")).toBe(false);
  });
});
