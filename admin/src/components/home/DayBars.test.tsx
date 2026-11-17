// MOB-1489: the per-day bars' y axis («10.000» on a big day) stayed in a fixed
// 36 px column and its longest label started past the card's inner edge. The
// column takes the width of its longest label instead.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/components/home/home.module.css"), "utf8");

describe("Home per-day bars axis", () => {
  it("the axis column is as wide as its longest label, not a fixed 36 px", () => {
    const rule = css.match(/\.bars\s*\{([^}]*)\}/)?.[1] ?? "";
    const columns = rule.match(/grid-template-columns:\s*([^;]+);/)?.[1] ?? "";
    expect(columns).not.toMatch(/^\s*\d+px\b/);
    expect(columns).toMatch(/max-content|auto/);
  });
});
