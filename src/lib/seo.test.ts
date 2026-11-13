/**
 * Titolo e descrizione per Google e per le anteprime social (MOB-1271,
 * decisione D365 di Victor). Si lanciano con `pnpm test`.
 *
 * Il sito si presentava come un'app di budget («gestire spese, risparmi e
 * obiettivi finanziari»), e Google mostrava quel testo. Finzy è un'app di
 * notizie di Borsa, titoli e report: il testo nuovo riprende la scheda
 * dell'App Store («Finzy ti mostra cosa si è mosso oggi sui mercati e ti
 * spiega perché», sottotitolo «Borsa, azioni e investimenti»).
 *
 * layout.tsx contiene JSX, che `node --test` non sa leggere: per il layout il
 * test legge il testo del file, come footer-links.test.ts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import * as seo from "./seo.ts";

type Copy = { title: string; description: string };

// Letto in modo dinamico: sul codice vecchio il nome non esiste, e il test
// deve fallire sulle asserzioni, non sull'import.
const META = (seo as Record<string, unknown>).META as
  | Record<"it" | "en", Copy>
  | undefined;

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

// Limiti che Google mostra senza tagliare (circa 60 e 155 caratteri).
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

describe("titolo e descrizione del sito (MOB-1271)", () => {
  test("esistono il testo italiano e quello inglese", () => {
    assert.ok(META, "META mancante in src/lib/seo.ts");
    for (const lang of ["it", "en"] as const) {
      assert.ok(META[lang]?.title, `${lang}: titolo mancante`);
      assert.ok(META[lang]?.description, `${lang}: descrizione mancante`);
    }
  });

  test("restano nei limiti di Google", () => {
    for (const [lang, copy] of Object.entries(META ?? {})) {
      assert.ok(copy.title.length <= TITLE_MAX, `${lang}: titolo di ${copy.title.length} caratteri`);
      assert.ok(
        copy.description.length <= DESCRIPTION_MAX,
        `${lang}: descrizione di ${copy.description.length} caratteri`,
      );
    }
  });

  test("descrivono l'app di oggi: mercati, notizie AI, titoli, Stock Snapshot, 10-K", () => {
    assert.ok(META);
    assert.match(META.it.title, /Borsa/);
    assert.match(META.en.title, /[Mm]arket/);
    for (const [lang, copy] of Object.entries(META)) {
      for (const word of [/mercati|markets/, /AI/, /Stock Snapshot/, /10-K/]) {
        assert.match(copy.description, word, `${lang}: manca ${word}`);
      }
    }
  });

  test("nessuna traccia dell'app di budget", () => {
    const budget = /spese|risparmi|obiettivi finanziari|expenses|savings|budget/i;
    for (const [lang, copy] of Object.entries(META ?? {})) {
      assert.doesNotMatch(copy.title, budget, `${lang}: titolo`);
      assert.doesNotMatch(copy.description, budget, `${lang}: descrizione`);
    }
    assert.doesNotMatch(layout, budget, "layout.tsx contiene ancora il testo di budget");
  });

  test("il layout usa META.it per title, Open Graph e Twitter", () => {
    assert.match(layout, /from "@\/lib\/seo"/, "layout.tsx non importa src/lib/seo");
    const uses = (field: "title" | "description") =>
      [...layout.matchAll(new RegExp(`META\\.it\\.${field}`, "g"))].length;
    // default + openGraph + twitter
    assert.equal(uses("title"), 3, "META.it.title non è in tutti e 3 i posti");
    assert.equal(uses("description"), 3, "META.it.description non è in tutti e 3 i posti");
  });
});
