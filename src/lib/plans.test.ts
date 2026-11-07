/**
 * Test dei prezzi del sito (MOB-592). Si lanciano con `pnpm test`.
 *
 * I prezzi devono essere quelli degli store (audit 15b, inizio novembre 2026):
 * mensile Premium €7,99 e Unlimited €9,99; annuale €80 e €100 (Italia).
 * Il badge dell'annuale è lo sconto vero, arrotondato; niente "prezzo di lancio".
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import * as plans from "./plans.ts";

// Letti in modo dinamico: sul codice vecchio alcuni nomi non esistono, e il
// test deve fallire sulle asserzioni, non sull'import.
const lib = plans as Record<string, unknown>;
const PLANS = plans.PLANS as unknown as {
  name: string;
  price: number;
  annualPrice?: number;
}[];
const byName = (name: string) => {
  const plan = PLANS.find((p) => p.name === name);
  assert.ok(plan, `piano ${name} mancante`);
  return plan;
};
const monthlyFromAnnual = lib.annualMonthlyPrice as (plan: unknown) => number;

describe("prezzi dei piani (store, novembre 2026)", () => {
  test("mensile: Free 0, Premium 7,99, Unlimited 9,99", () => {
    assert.equal(byName("Free").price, 0);
    assert.equal(byName("Premium").price, 7.99);
    assert.equal(byName("Unlimited").price, 9.99);
  });

  test("annuale: Premium 80, Unlimited 100 (prezzi Italia degli store)", () => {
    assert.equal(byName("Free").annualPrice, 0);
    assert.equal(byName("Premium").annualPrice, 80);
    assert.equal(byName("Unlimited").annualPrice, 100);
  });

  test("il prezzo al mese dell'annuale viene dal prezzo annuale vero (/12)", () => {
    assert.equal(monthlyFromAnnual(byName("Premium")), 6.67);
    assert.equal(monthlyFromAnnual(byName("Unlimited")), 8.33);
    assert.equal(monthlyFromAnnual(byName("Free")), 0);
  });

  test("il badge è lo sconto vero arrotondato: -17%, non -20%", () => {
    assert.equal(lib.ANNUAL_BADGE, "-17%");
    const discount = lib.annualDiscount as (plan: unknown) => number;
    for (const name of ["Premium", "Unlimited"]) {
      const real = 1 - byName(name).annualPrice! / (byName(name).price * 12);
      assert.ok(Math.abs(discount(byName(name)) - real) < 1e-9, name);
      assert.equal(`-${Math.round(real * 100)}%`, lib.ANNUAL_BADGE, name);
    }
  });

  test("numero di lezioni: 19 attive in produzione (7/11/2026)", () => {
    assert.equal(lib.LESSON_COUNT, 19);
  });
});

describe("testi della sezione Prezzi, in tutte le lingue", () => {
  const source = readFileSync(new URL("./i18n.tsx", import.meta.url), "utf8");

  test("nessuna nota \"prezzo di lancio (primi 10.000)\"", () => {
    const launch =
      /lancio|launch price|lanzamiento|lancement|lançamento|primi 10|first 10|primeros 10|10 000 premiers|primeiros 10/i;
    const hits = source
      .split("\n")
      .filter((line) => /^\s*note:/.test(line) && launch.test(line));
    assert.deepEqual(hits, []);
  });

  test("il badge viene da plans.ts, non è scritto a mano", () => {
    const badges = source.match(/annualBadge:.*$/gm) ?? [];
    assert.equal(badges.length, 5);
    for (const line of badges) assert.match(line, /annualBadge: ANNUAL_BADGE,/);
  });

  test("il numero di lezioni viene da plans.ts, niente \"28\"", () => {
    const learning = source.match(/"?`?Learning ?: .*$/gm) ?? [];
    assert.equal(learning.length, 5);
    for (const line of learning) {
      assert.match(line, /\$\{LESSON_COUNT\}/);
      assert.doesNotMatch(line, /\b28\b/);
    }
  });
});
