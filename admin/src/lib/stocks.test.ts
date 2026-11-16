import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, countryName, day, fromSearch, hasFilters, micLabel, moment, num, pct, priceWhen, staleWhy, toQuery, usd } from "./stocks";

describe("stocks formats (MOB-1377)", () => {
  it("writes Italian numbers whatever the runtime's ICU", () => {
    expect(num(32620)).toBe("32.620");
    expect(num(10909600, 2)).toBe("10.909.600,00");
    expect(num(-3.16, 2)).toBe("−3,16");
  });

  it("a price is dollars with two decimals, a currency pair under 10 with four, and no price is never $0", () => {
    expect(usd(221.3)).toBe("$221,30");
    expect(usd(94180)).toBe("$94.180,00");
    expect(usd(1.1621, "forex")).toBe("$1,1621");
    expect(usd(1.17, "stock")).toBe("$1,17");
    expect(usd(0)).toBe("—");
    expect(usd(null)).toBe("—");
  });

  it("changes carry their sign, zero none", () => {
    expect(pct(0.62)).toBe("+0,62%");
    expect(pct(-3.16)).toBe("−3,16%");
    expect(pct(0)).toBe("0,00%");
  });

  it("dates in Rome time, days without a time zone shift", () => {
    expect(moment("2026-11-14T21:05:00Z", true)).toBe("14/11 22:05");
    expect(moment("2026-11-14T21:05:00Z")).toBe("14/11/2026, 22:05");
    expect(day("2026-08-24")).toBe("24/08/2026");
    expect(day("2026-08-24", true)).toBe("24/08");
    expect(priceWhen({ price_at: "2026-08-24T00:00:00+02:00", price_day_only: true })).toBe("24/08");
  });

  it("a stale price says why: not found by the provider, or how old", () => {
    const now = new Date("2026-11-14T12:00:00Z");
    expect(staleWhy({ price_at: "2026-11-02T12:00:00Z", not_found_at: null }, now)).toBe("12 giorni fa");
    expect(staleWhy({ price_at: "2026-08-24T12:00:00Z", not_found_at: "2026-11-10T03:00:00Z" }, now)).toBe("non trovato dal 10/11");
  });

  it("exchange and country names", () => {
    expect(micLabel("XNAS")).toBe("XNAS · Nasdaq");
    expect(micLabel("XQQQ")).toBe("XQQQ");
    expect(micLabel(null)).toBeNull();
    expect(countryName("US")).toBe("Stati Uniti");
  });

  it("filters go to the API comma-separated and come back from the address bar", () => {
    const f = { ...EMPTY_FILTERS, q: " nvd ", type: ["stock", "fund"], price: ["stale"], sort: "oldest", page: 2 };
    expect(toQuery(f)).toEqual({ q: "nvd", type: "stock,fund", price: "stale", sort: "oldest", page: 2 });
    expect(toQuery(EMPTY_FILTERS)).toEqual({});
    const back = fromSearch(new URLSearchParams("q=nvd&type=stock,fund&price=stale&sort=oldest&page=2"));
    expect(back).toEqual({ ...f, q: "nvd" });
    expect(hasFilters(back)).toBe(true);
    expect(fromSearch(new URLSearchParams("sort=evil&page=-3"))).toEqual(EMPTY_FILTERS);
  });
});
