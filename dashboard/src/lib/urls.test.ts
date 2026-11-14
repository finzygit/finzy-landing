// MOB-1198 (FZW-WEB-12): report links of the backend become same-origin paths.
import { describe, expect, it } from "vitest";
import { apiPath } from "./urls.ts";

describe("apiPath", () => {
  it("turns the backend's absolute links into paths of this origin", () => {
    expect(apiPath("https://console.finzyapp.com/api/stock-reports/financial/NVDA")).toBe("/api/stock-reports/financial/NVDA");
    expect(apiPath("https://staging.app.finzyapp.com/api/stock-reports/55/download?x=1")).toBe("/api/stock-reports/55/download?x=1");
    expect(apiPath("/api/stock-reports/55/download")).toBe("/api/stock-reports/55/download");
  });

  it("leaves external links external", () => {
    expect(apiPath("https://www.sec.gov/Archives/edgar/data/1045810/x.htm")).toBeNull();
    expect(apiPath("https://evilfinzyapp.com/api/x")).toBeNull();
    expect(apiPath("https://console.finzyapp.com/storage/x.pdf")).toBeNull();
    expect(apiPath("javascript:alert(1)")).toBeNull();
    expect(apiPath("//evil.example/api/x")).toBeNull();
  });
});
