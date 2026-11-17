// MOB-1487: the last day under the Home and Spesa AI bars read «nov 17»: the
// label was kept inside the plot with `direction: rtl`, which also reverses
// «17 nov». The label must keep its reading order.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

describe("day labels under the bars", () => {
  it.each(["./home/home.module.css", "./spend/spend.module.css"])("%s keeps «17 nov» in reading order", (file) => {
    expect(css(file)).not.toMatch(/direction:\s*rtl/);
  });
});
