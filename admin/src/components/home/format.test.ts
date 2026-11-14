import { describe, expect, it } from "vitest";
import { clock, count, hours, provider, span, usd, when } from "./format";

describe("home format", () => {
  it("writes counts and dollars the Italian way", () => {
    expect(count(0)).toBe("0");
    expect(count(1046)).toBe("1.046");
    expect(count(12345678)).toBe("12.345.678");
    expect(usd(0)).toBe("$0,00");
    expect(usd(92.594)).toBe("$92,59");
    expect(usd(1234567.5)).toBe("$1.234.567,50");
  });

  it("reads times on Rome's clock, whatever the offset of the string", () => {
    expect(clock("2026-11-13T22:30:00+01:00")).toBe("22:30");
    expect(clock("2026-11-13T21:30:00Z")).toBe("22:30");
    expect(clock("2026-07-01T10:05:00Z")).toBe("12:05"); // summer time
  });

  it("says «oggi alle» for today and the full date before", () => {
    const now = "2026-11-13T22:30:00+01:00";
    expect(when("2026-11-13T22:18:00+01:00", now)).toBe("oggi alle 22:18");
    expect(when("2026-10-30T23:53:00+01:00", now)).toBe("30/10/2026, 23:53");
    // 23:30 UTC on the 12th is already the 13th in Rome.
    expect(when("2026-11-12T23:30:00Z", now)).toBe("oggi alle 00:30");
  });

  it("names the days a tile covers", () => {
    expect(span("2026-11-07", "2026-11-13T22:30:00+01:00")).toBe("7–13 nov");
    expect(span("2026-10-26", "2026-11-01T09:00:00+01:00")).toBe("26 ott–1 nov");
    expect(span("2026-11-01", "2026-11-01T09:00:00+01:00")).toBe("1 nov");
  });

  it("writes providers and hours as people do", () => {
    expect(provider("gemini")).toBe("Gemini");
    expect(provider("openai")).toBe("OpenAI");
    expect(provider("mistral")).toBe("Mistral");
    expect(hours(3)).toBe("3 ore");
    expect(hours(1)).toBe("1 ora");
  });
});
