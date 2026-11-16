import { describe, expect, it } from "vitest";
import { dayTime, money, monthsBetween, monthTitle, percent, priceValue, shiftMonth, toLocalInput, totalOf } from "./format";

describe("format (MOB-1375)", () => {
  it("writes money as the boards do", () => {
    expect(money(820.64)).toBe("$820,64");
    expect(money(-57.88)).toBe("−$57,88");
    expect(money(-49.9, "EUR")).toBe("−€ 49,90");
    expect(money(1234.5, "GBP")).toBe("£ 1.234,50");
    expect(percent(0.12342)).toBe("+12,34%");
    expect(percent(-0.031)).toBe("−3,10%");
  });

  it("reads instants in Rome time, across the clock change", () => {
    expect(dayTime("2026-10-31T23:30:00Z")).toBe("01/11 00:30");
    expect(toLocalInput("2026-11-30T22:59:59Z")).toBe("2026-11-30T23:59");
    expect(toLocalInput("2026-07-01T10:00:00Z")).toBe("2026-07-01T12:00");
  });

  it("moves months and lists them newest first", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthsBetween("2026-10", "2027-01")).toEqual(["2027-01", "2026-12", "2026-11", "2026-10"]);
    expect(monthTitle("2026-11")).toBe("Novembre 2026");
  });

  it("totals in cents, prices as typed", () => {
    expect(totalOf(6.99, 3)).toBe(20.97);
    expect(totalOf(5.49, 12)).toBe(65.88);
    expect(priceValue("5,99")).toBe(5.99);
    expect(priceValue("5,9x")).toBeNull();
    expect(priceValue("0")).toBeNull();
  });
});
