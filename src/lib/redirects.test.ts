/**
 * Test dei redirect del sito (MOB-998). Si lanciano con `pnpm test`.
 *
 * Le vecchie copie dei termini dell'app stampano «finzyapp.com/privacy-policy»,
 * che tornava 404: quell'indirizzo, e /privacy, portano alla privacy policy
 * su iubenda, la stessa del footer.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, test } from "node:test";
import nextConfig from "../../next.config.ts";
import { PRIVACY_POLICY_URL } from "./company.ts";

type Redirect = { source: string; destination: string; permanent?: boolean };

async function redirects(): Promise<Redirect[]> {
  assert.ok(nextConfig.redirects, "next.config.ts non ha redirects()");
  return (await nextConfig.redirects()) as Redirect[];
}

describe("redirect alla privacy policy", () => {
  for (const source of ["/privacy-policy", "/privacy"]) {
    test(`${source} porta in modo permanente alla policy di iubenda`, async () => {
      const found = (await redirects()).filter((r) => r.source === source);
      assert.equal(found.length, 1, `${source}: un solo redirect`);
      assert.equal(found[0].destination, PRIVACY_POLICY_URL);
      assert.equal(found[0].permanent, true, `${source}: deve essere 308`);
    });

    test(`${source} non è una pagina del sito`, () => {
      // Un redirect coprirebbe la pagina: se un giorno nasce, togliere il redirect.
      const dir = new URL(`../app${source}/`, import.meta.url);
      assert.equal(existsSync(dir), false, `esiste src/app${source}`);
    });
  }

  test("la policy è quella italiana già usata dal footer", () => {
    assert.equal(
      PRIVACY_POLICY_URL,
      "https://www.iubenda.com/privacy-policy/68699235",
    );
  });

  test("restano gli alias esistenti", async () => {
    const all = await redirects();
    const pairs = all.map((r) => `${r.source} -> ${r.destination}`);
    assert.ok(pairs.includes("/contact -> /contatti"));
    assert.ok(pairs.includes("/delete-account -> /elimina-account"));
  });
});
