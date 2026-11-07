/**
 * Test della pagina "Elimina account" (MOB-591). Si lanciano con `pnpm test`.
 *
 * Google Play chiede, per le app con account, un URL dove l'utente può
 * chiedere di eliminare l'account e i dati anche senza l'app. La pagina
 * spiega l'eliminazione nell'app e dà la strada via email.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";
import * as deletion from "./account-deletion.ts";
import { SUPPORT_EMAIL } from "./company.ts";

// Letti in modo dinamico: sul codice vecchio il modulo non esporta niente, e
// il test deve fallire sulle asserzioni, non sull'import.
const lib = deletion as Record<string, unknown>;
const LANGS = ["it", "en", "es", "fr", "pt"] as const;
const copy = () =>
  lib.ACCOUNT_DELETION_COPY as Record<string, Record<string, unknown>>;
const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

describe("pagina /elimina-account", () => {
  test("ha un URL fisso, da mettere in Play Console", () => {
    assert.equal(lib.ACCOUNT_DELETION_PATH, "/elimina-account");
    assert.ok(
      existsSync(new URL("../app/elimina-account/page.tsx", import.meta.url)),
      "manca src/app/elimina-account/page.tsx",
    );
  });

  test("il testo esiste in tutte e 5 le lingue del sito, con le stesse chiavi", () => {
    assert.ok(copy(), "ACCOUNT_DELETION_COPY mancante");
    assert.deepEqual(Object.keys(copy()).sort(), [...LANGS].sort());
    const keys = Object.keys(copy().it).sort();
    for (const lang of LANGS) {
      assert.deepEqual(Object.keys(copy()[lang]).sort(), keys, lang);
      for (const [key, value] of Object.entries(copy()[lang])) {
        if (Array.isArray(value)) {
          assert.ok(value.length > 0, `${lang}.${key} vuoto`);
          for (const item of value) assert.ok(String(item).trim(), `${lang}.${key}`);
        } else {
          assert.ok(String(value).trim(), `${lang}.${key} vuoto`);
        }
      }
    }
  });

  test("i passi nell'app usano l'etichetta vera del pulsante dell'app", () => {
    // L'app è in italiano e in inglese (lib/l10n/intl_it.arb e intl_en.arb,
    // chiave eliminaAccount): fuori dall'italiano l'utente vede l'inglese.
    for (const lang of LANGS) {
      const steps = (copy()[lang].steps as string[]).join(" ");
      const label = lang === "it" ? "Elimina account" : "Delete account";
      assert.ok(steps.includes(label), `${lang}: manca «${label}»`);
    }
  });

  test("la strada via email cita la casella di assistenza", () => {
    assert.equal(SUPPORT_EMAIL, "info@finzyapp.com");
    for (const lang of LANGS) {
      const body = String(copy()[lang].emailBody);
      assert.match(body, /\{email\}/, lang);
      // L'oggetto citato nel testo è quello che il link mailto: precompila.
      assert.ok(body.includes(String(copy()[lang].emailSubject)), `${lang}: oggetto diverso`);
    }
    const mailto = lib.deletionMailto as (email: string, subject: string) => string;
    assert.equal(
      mailto("info@finzyapp.com", "Eliminazione account"),
      "mailto:info@finzyapp.com?subject=Eliminazione%20account",
    );
    assert.equal(
      mailto("info@finzyapp.com", "Eliminação de conta"),
      "mailto:info@finzyapp.com?subject=Elimina%C3%A7%C3%A3o%20de%20conta",
    );
  });

  test("nessuna promessa di tempi per l'eliminazione via email", () => {
    // Regola: niente promesse a nome di Carlo. La conferma arriva via email.
    for (const lang of LANGS) {
      assert.doesNotMatch(String(copy()[lang].emailBody), /\b\d+\b/, lang);
    }
  });

  test("la pagina è nella sitemap, nel footer delle 5 lingue e ha l'alias inglese", () => {
    assert.match(read("../app/sitemap.ts"), /ACCOUNT_DELETION_PATH/);
    const i18n = read("./i18n.tsx");
    const footerLinks = i18n.match(/href: ACCOUNT_DELETION_PATH/g) ?? [];
    assert.equal(footerLinks.length, 5);
    const pages = i18n.match(/accountDeletionPage: ACCOUNT_DELETION_COPY\.(it|en|es|fr|pt),/g) ?? [];
    assert.equal(pages.length, 5);
    assert.match(
      read("../../next.config.ts"),
      /source: "\/delete-account", destination: "\/elimina-account"/,
    );
  });
});
