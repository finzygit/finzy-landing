// MOB-1198 (FZW-WEB-02, 07): numbers and dates as the boards draw them.
// IT: comma decimals, dot thousands from 1.000 (Intl's it-IT leaves 4-digit
// numbers ungrouped, the boards do not); EN follows the language (decision 4
// of the MOB-1198 design comment). The minus is U+2212, as on the boards.
import { describe, expect, it } from "vitest";
import {
  formatChange,
  formatCompact,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatPeriodLabel,
  formatStatementValue,
  scaleStatement,
} from "./format.ts";

const MINUS = "−";

describe("formatNumber", () => {
  it("groups thousands with a dot and decimals with a comma in Italian", () => {
    expect(formatNumber(130497, "it", 0)).toBe("130.497");
    expect(formatNumber(5390, "it", 0)).toBe("5.390");
    expect(formatNumber(1.72, "it", 2)).toBe("1,72");
    expect(formatNumber(1234567.891, "it", 2)).toBe("1.234.567,89");
  });

  it("uses the English separators in English", () => {
    expect(formatNumber(130497, "en", 0)).toBe("130,497");
    expect(formatNumber(1.72, "en", 2)).toBe("1.72");
  });

  it("writes negatives with the U+2212 minus", () => {
    expect(formatNumber(-43, "it", 0)).toBe(`${MINUS}43`);
    expect(formatNumber(-2.41, "it", 2)).toBe(`${MINUS}2,41`);
  });

  it("never writes a negative zero", () => {
    expect(formatNumber(-0.001, "it", 2)).toBe("0,00");
  });
});

describe("formatMoney", () => {
  it("formats dollars and euros like the boards", () => {
    expect(formatMoney(221.3, "USD", "it")).toBe("$221,30");
    expect(formatMoney(742.6, "EUR", "it")).toBe("€ 742,60");
    expect(formatMoney(221.3, "USD", "en")).toBe("$221.30");
    expect(formatMoney(742.6, "EUR", "en")).toBe("€742.60");
  });

  it("puts the minus before the symbol", () => {
    expect(formatMoney(-5, "USD", "it")).toBe(`${MINUS}$5,00`);
  });

  it("shows London pence (GBp, GBX) in pounds", () => {
    expect(formatMoney(1234, "GBp", "it")).toBe("£12,34");
    expect(formatMoney(1234, "GBX", "en")).toBe("£12.34");
    expect(formatCompact(250_000_000_000, "it", "GBp")).toBe("£2,5 Mrd");
  });

  it("writes an unknown currency as its code", () => {
    expect(formatMoney(12.3, "CHF", "it")).toBe("CHF 12,30");
  });
});

describe("formatCompact (K, M, B scaling)", () => {
  it("scales billions, millions and thousands in Italian", () => {
    expect(formatCompact(5_390_000_000_000, "it", "USD")).toBe("$5.390 Mrd");
    expect(formatCompact(72_880_000_000, "it", "USD")).toBe("$72,9 Mrd");
    expect(formatCompact(232_100_000, "it")).toBe("232,1 Mln");
    expect(formatCompact(4_500, "it")).toBe("4,5 K");
    expect(formatCompact(950, "it")).toBe("950");
  });

  it("scales in English with B and M", () => {
    expect(formatCompact(5_390_000_000_000, "en", "USD")).toBe("$5,390 B");
    expect(formatCompact(232_100_000, "en")).toBe("232.1 M");
  });

  it("keeps the euro spacing of each language", () => {
    expect(formatCompact(292_000_000_000, "it", "EUR")).toBe("€ 292 Mrd");
    expect(formatCompact(292_000_000_000, "en", "EUR")).toBe("€292 B");
  });

  it("keeps the sign of negative amounts", () => {
    expect(formatCompact(-3_236_000_000, "it", "USD")).toBe(`${MINUS}$3,2 Mrd`);
  });
});

describe("formatPercent and formatChange", () => {
  it("reads fractions as percentages", () => {
    expect(formatPercent(0.558, "it", { fraction: true })).toBe("55,8%");
    expect(formatPercent(0.0002, "it", { fraction: true })).toBe("0,02%");
  });

  it("signs a day change and leaves zero unsigned", () => {
    expect(formatChange(-3.16, "it")).toBe(`${MINUS}3,16%`);
    expect(formatChange(1.82, "it")).toBe("+1,82%");
    expect(formatChange(0, "it")).toBe("0,00%");
    expect(formatChange(1.82, "en")).toBe("+1.82%");
  });
});

describe("statement units", () => {
  it("scales to thousands, millions and billions", () => {
    expect(scaleStatement(130_497_000_000, "millions")).toBeCloseTo(130497);
    expect(scaleStatement(161_150_000_000, "billions")).toBeCloseTo(161.15);
    expect(scaleStatement(4_545_000, "thousands")).toBeCloseTo(4545);
  });

  it("formats millions without decimals and billions with two", () => {
    expect(formatStatementValue(130_497_000_000, "millions", "it")).toBe("130.497");
    expect(formatStatementValue(-43_000_000, "millions", "it")).toBe(`${MINUS}43`);
    expect(formatStatementValue(161_150_000_000, "billions", "it")).toBe("161,15");
  });

  it("keeps per-share lines unscaled with two decimals", () => {
    expect(formatStatementValue(2.94, "millions", "it", { perShare: true })).toBe("2,94");
  });

  it("returns null for a missing value (the table draws a dash)", () => {
    expect(formatStatementValue(null, "millions", "it")).toBeNull();
  });
});

describe("dates", () => {
  const close = "2026-11-13T21:00:00Z"; // 22:00 in Rome

  it("writes the last-price time as the boards do", () => {
    expect(formatDate(close, "it", { time: true, timeZone: "Europe/Rome" })).toBe("13 nov, 22:00");
    expect(formatDate(close, "en", { time: true, timeZone: "Europe/Rome" })).toBe("Nov 13, 10:00 PM");
  });

  it("writes a full date with the year", () => {
    expect(formatDate("2026-11-13", "it", { year: true })).toBe("13 nov 2026");
    expect(formatDate("2026-11-13", "en", { year: true })).toBe("Nov 13, 2026");
  });

  it("writes a short date", () => {
    expect(formatDate("2026-09-28", "it")).toBe("28 set");
    expect(formatDate("2026-09-28", "en")).toBe("Sep 28");
  });

  it("returns null for a missing or broken date", () => {
    expect(formatDate(null, "it")).toBeNull();
    expect(formatDate("not a date", "it")).toBeNull();
  });
});

describe("statement period labels", () => {
  it("names quarters T in Italian and Q in English", () => {
    expect(formatPeriodLabel({ year: 2026, quarter: 3 }, "it")).toBe("T3 2026");
    expect(formatPeriodLabel({ year: 2026, quarter: 3 }, "en")).toBe("Q3 2026");
    expect(formatPeriodLabel({ year: 2025, quarter: null }, "it")).toBe("2025");
  });
});
