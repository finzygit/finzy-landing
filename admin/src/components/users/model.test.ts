import { describe, expect, it } from "vitest";
import { countLine, csvName, dmy, monthsAhead, parseDmy, plansInWords, todayYmd } from "./model";

describe("users model", () => {
  it("reads and writes dd/mm/yyyy", () => {
    expect(dmy("2026-12-31")).toBe("31/12/2026");
    expect(dmy(null)).toBe("—");
    expect(parseDmy("31/12/2026")).toBe("2026-12-31");
    expect(parseDmy(" 1/2/2027 ")).toBe("2027-02-01");
    expect(parseDmy("31/02/2027")).toBeNull();
    expect(parseDmy("2027-02-01")).toBeNull();
  });

  it("quick dates are months from today in Rome, clamped to the month's end", () => {
    expect(monthsAhead(3, new Date("2026-11-14T10:00:00Z"))).toBe("14/02/2027");
    expect(monthsAhead(12, new Date("2026-11-14T10:00:00Z"))).toBe("14/11/2027");
    expect(monthsAhead(6, new Date("2026-08-31T10:00:00Z"))).toBe("28/02/2027");
    // 23:30 in London on 14/11 is already 15/11 in Rome.
    expect(todayYmd(new Date("2026-11-14T23:30:00Z"))).toBe("2026-11-15");
  });

  it("the count line uses the #234 words with Italian thousands", () => {
    expect(countLine(1495, false)).toBe("1.495 utenti in tutto");
    expect(countLine(1, false)).toBe("1 utente in tutto");
    expect(countLine(18, true)).toBe("18 utenti corrispondono ai filtri");
    expect(countLine(1, true)).toBe("1 utente corrisponde ai filtri");
    expect(countLine(0, true)).toBe("Nessun utente corrisponde ai filtri");
  });

  it("the CSV name and plan words match UserCsvExport", () => {
    expect(csvName([], new Date("2026-11-14T10:00:00Z"))).toBe("utenti-tutti-2026-11-14.csv");
    expect(csvName(["unlimited", "trial"], new Date("2026-11-14T10:00:00Z"))).toBe("utenti-in-prova-unlimited-2026-11-14.csv");
    expect(plansInWords(["unlimited", "premium"])).toBe("Premium o Unlimited");
    expect(plansInWords(["free", "premium", "unlimited"])).toBe("Free, Premium o Unlimited");
  });
});
