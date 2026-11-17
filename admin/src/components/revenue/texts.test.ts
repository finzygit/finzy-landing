// MOB-1488: counts of one say the singular («1 mese», «finisce tra 1 giorno»).
import { describe, expect, it } from "vitest";
import { endsIn, monthsN } from "./texts";

describe("counts in the promotion texts", () => {
  it("months: «1 mese», «3 mesi»", () => {
    expect(monthsN(1)).toBe("1 mese");
    expect(monthsN(3)).toBe("3 mesi");
    expect(monthsN(12)).toBe("12 mesi");
  });

  it("days left: «finisce tra 1 giorno», «finisce tra 4 giorni»", () => {
    expect(endsIn(1)).toBe("finisce tra 1 giorno");
    expect(endsIn(4)).toBe("finisce tra 4 giorni");
  });
});
