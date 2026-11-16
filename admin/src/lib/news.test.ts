import { describe, expect, it } from "vitest";
import { ago, conf, num, periodOf, periodRange } from "./news";

describe("news words", () => {
  it("says how long ago in Italian", () => {
    expect(ago(160)).toBe("2 ore e 40 minuti fa");
    expect(ago(10)).toBe("10 minuti fa");
    expect(ago(60)).toBe("1 ora fa");
    expect(ago(0)).toBe("adesso");
  });

  it("writes numbers the Italian way", () => {
    expect(num(37747)).toBe("37.747");
    expect(conf(0.38)).toBe("0,38");
    expect(conf(null)).toBe("—");
  });

  it("turns a period into Rome days", () => {
    const now = new Date("2026-11-12T23:30:00Z"); // 13 Nov 00:30 in Rome
    expect(periodRange("today", "", "", now)).toEqual({ from: "2026-11-13", to: "2026-11-13" });
    expect(periodRange("yesterday", "", "", now)).toEqual({ from: "2026-11-12", to: "2026-11-12" });
    expect(periodRange("7", "", "", now)).toEqual({ from: "2026-11-07", to: "2026-11-13" });
    expect(periodRange("range", "2026-11-01", "", now)).toEqual({ from: "2026-11-01", to: undefined });
    expect(periodRange("", "", "", now)).toEqual({});
  });
});

describe("periodOf (D428)", () => {
  it("keeps a known period and drops anything else", () => {
    expect(periodOf("today")).toBe("today");
    expect(periodOf("7")).toBe("7");
    expect(periodOf("oggi")).toBe("");
    expect(periodOf(null)).toBe("");
  });
});
