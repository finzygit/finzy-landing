// MOB-1198 (FZW-WEB-02, 13): periods, lead-in trimming and the period colour.
import { describe, expect, it } from "vitest";
import { niceTicks, periodPoints, periodRises, windowQuery } from "./chart.ts";

describe("windowQuery", () => {
  it("asks the daily windows for their per-day indicators", () => {
    expect(windowQuery("6M")).toEqual({ window: "6M", indicators: "daily" });
    expect(windowQuery("MAX")).toEqual({ window: "MAX", indicators: "daily" });
    expect(windowQuery("1D")).toEqual({ window: "1D" });
  });
});

describe("periodPoints", () => {
  const pts = [
    { date: "2026-10-01", close: 10 },
    { date: "2026-10-20", close: 11 },
    { date: "2026-11-13", close: 12 },
    { date: "2026-11-12", close: null },
  ];

  it("drops the backend's lead-in days and the bars without a close", () => {
    expect(periodPoints(pts, "1M").map((p) => p.date)).toEqual(["2026-10-20", "2026-11-13"]);
  });

  it("keeps everything for the periods the backend cuts itself", () => {
    expect(periodPoints(pts, "MAX")).toHaveLength(3);
  });
});

describe("periodRises", () => {
  it("compares the first and the last close of the period", () => {
    expect(periodRises([{ date: "a", close: 2 }, { date: "b", close: 1 }])).toBe(false);
    expect(periodRises([{ date: "a", close: 1 }, { date: "b", close: 2 }])).toBe(true);
  });
});

describe("niceTicks", () => {
  it("returns five round values, top first", () => {
    const t = niceTicks(172, 227);
    expect(t).toHaveLength(5);
    expect(t[0]).toBeGreaterThan(t[4]);
  });
});
