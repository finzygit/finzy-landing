/**
 * Fascia «Fonti» della home (MOB-958, decisione D414 di Victor). Si lancia
 * con `pnpm test`.
 *
 * La fascia mostrava sette nomi: quattro (massive.com, Forbes, la Repubblica,
 * SanCarlo Invest) non sono fornitori di Finzy. Victor ha deciso di lasciare
 * solo i tre fornitori veri di notizie: MT Newswires, Adnkronos e Benzinga,
 * con i loghi (scelta del cliente del 12/11). Twelve Data non va aggiunto.
 * Questi test impediscono che un nome tolto torni nella fascia.
 *
 * sources.tsx contiene JSX, che `node --test` non sa leggere: i test leggono
 * il testo del file, come footer-links.test.ts.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";

const sources = readFileSync(
  new URL("../components/sections/sources.tsx", import.meta.url),
  "utf8",
);
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const publicFile = (name: string) => new URL(`../../public/${name}`, import.meta.url);

describe("fascia «Fonti» (MOB-958)", () => {
  test("nessun nome che non è un nostro fornitore", () => {
    for (const name of [/massive/i, /forbes/i, /repubblica/i, /san\s*carlo/i, /twelve/i]) {
      assert.doesNotMatch(sources, name, `sources.tsx nomina ancora ${name}`);
    }
  });

  test("restano i tre fornitori veri, MT Newswires e Adnkronos con il loro logo", () => {
    assert.match(sources, /benzinga/i);
    for (const logo of ["mtnews-logo.webp", "adnkronos-logo.webp"]) {
      assert.match(sources, new RegExp(`"/${logo.replace(".", "\\.")}"`), `manca ${logo}`);
      assert.ok(existsSync(publicFile(logo)), `public/${logo} non esiste`);
    }
    assert.match(sources, /alt: "MT Newswires"/);
    assert.match(sources, /alt: "Adnkronos"/);
  });

  test("il font serif dei wordmark tolti non si carica più", () => {
    assert.doesNotMatch(layout, /Playfair/);
  });
});
