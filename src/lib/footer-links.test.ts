/**
 * Link del piede del sito (MOB-1057, decisione D134 di Victor). Si lanciano
 * con `pnpm test`.
 *
 * Il piede aveva un link «Newsletter» con href "#" in tutte e 5 le lingue: un
 * clic portava solo in cima alla pagina, perché il sito non ha nessuna
 * iscrizione alla newsletter. Victor ha deciso di toglierlo. Questi test
 * impediscono che torni un link del piede che non porta da nessuna parte.
 * Chi aggiunge una vera iscrizione alla newsletter (con la voce nella privacy
 * policy) aggiorna il test «nessuna Newsletter».
 *
 * i18n.tsx contiene JSX, che `node --test` non sa leggere: i test leggono il
 * testo del file, come contact-form-removed.test.ts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const i18n = readFileSync(new URL("./i18n.tsx", import.meta.url), "utf8");

// Ogni lingua ha un solo `footer: { ... columns: [ ... ] ... }`.
const footers = [...i18n.matchAll(/\n  footer: \{\n([\s\S]*?)\n  \},\n/g)].map((m) => m[1]);

describe("link del piede (MOB-1057)", () => {
  test("ci sono i piedi delle 5 lingue", () => {
    assert.equal(footers.length, 5, `piedi trovati: ${footers.length}`);
    for (const footer of footers) assert.match(footer, /columns: \[/);
  });

  test("nessun link del piede ha href \"#\"", () => {
    for (const [i, footer] of footers.entries()) {
      assert.doesNotMatch(footer, /href:\s*["']#["']/, `lingua ${i + 1}: link con href "#"`);
    }
  });

  test("nessuna Newsletter nel piede", () => {
    for (const [i, footer] of footers.entries()) {
      assert.doesNotMatch(footer, /newsletter/i, `lingua ${i + 1}: link «Newsletter»`);
    }
  });

  test("restano i link reali della colonna Contatti", () => {
    for (const [i, footer] of footers.entries()) {
      assert.match(footer, /href: "\/contatti"/, `lingua ${i + 1}: manca /contatti`);
      assert.match(footer, /href: ACCOUNT_DELETION_PATH/, `lingua ${i + 1}: manca l'eliminazione account`);
    }
  });
});
