// MOB-1198 (FZW-WEB-03, 05): statistics as the Summary and Statistics boards write them.
import { describe, expect, it } from "vitest";
import { formatStat, keyFigure } from "./stat-format.ts";

describe("formatStat", () => {
  it("writes each kind like the boards", () => {
    expect(formatStat(5.39e12, "money", "USD", "it")).toBe("$5.390 Mrd");
    expect(formatStat(52.83, "pe", "USD", "it")).toBe("52,8");
    expect(formatStat(1.72, "ratio", "USD", "it")).toBe("1,72");
    expect(formatStat(0.558, "pct", "USD", "it")).toBe("55,8%");
    expect(formatStat(4.19, "perShare", "USD", "it")).toBe("$4,19");
    expect(formatStat("2026-10-03", "date", "USD", "it")).toBe("3 ott 2026");
    expect(formatStat("10:1", "text", "USD", "it")).toBe("10:1");
  });

  it("returns null for a missing value, never a zero", () => {
    expect(formatStat(null, "money", "USD", "it")).toBeNull();
    expect(formatStat(undefined, "pct", "USD", "it")).toBeNull();
  });
});

describe("keyFigure", () => {
  it("falls back to the trailing dividend yield", () => {
    const stats = { symbol: "X", currency: "USD", updated_at: null, groups: { dividends_and_splits: { forward_annual_dividend_yield: null, trailing_annual_dividend_yield: 0.01 } } };
    expect(keyFigure(stats, "dividends_and_splits", "forward_annual_dividend_yield")).toBe(0.01);
  });
});
