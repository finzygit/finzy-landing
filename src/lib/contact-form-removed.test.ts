/**
 * Il modulo contatti della home è stato tolto (MOB-828, decisione D75 di
 * Victor). Si lanciano con `pnpm test`.
 *
 * Il modulo mostrava «inviato» ma non mandava niente: i messaggi dei
 * visitatori andavano persi. Resta la pagina /contatti con l'email di
 * assistenza. Questi test impediscono che il modulo torni senza un invio vero
 * e che un link porti ancora all'ancora /#contatti, che non esiste più.
 * Oggi il sito non ha nessun modulo: chi ne aggiunge uno con un invio vero (e
 * la voce nella privacy policy) aggiorna il test «nessun <form>».
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { SUPPORT_EMAIL } from "./company.ts";
import { PLANS } from "./plans.ts";

const SRC = new URL("../", import.meta.url);

function sourceFiles(dir: URL): URL[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) return sourceFiles(url);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.ts$/.test(entry.name)) return [];
    return [url];
  });
}

const files = [...sourceFiles(SRC), new URL("../../next.config.ts", import.meta.url)].map((url) => ({
  path: url.pathname.slice(SRC.pathname.length),
  text: readFileSync(url, "utf8"),
}));

describe("modulo contatti tolto (MOB-828)", () => {
  test("il componente del modulo non esiste più", () => {
    const file = new URL("../components/sections/contact.tsx", import.meta.url);
    assert.equal(existsSync(file), false, "esiste src/components/sections/contact.tsx");
  });

  test("nessun <form> nel sito", () => {
    const found = files.filter((f) => /<form[\s>]/i.test(f.text)).map((f) => f.path);
    assert.deepEqual(found, [], `<form> in: ${found.join(", ")}`);
  });

  test("nessun link porta all'ancora /#contatti", () => {
    const found = files
      .filter((f) => /#contatti\b/.test(f.text))
      .map((f) => f.path);
    assert.deepEqual(found, [], `link a /#contatti in: ${found.join(", ")}`);
  });

  test("i pulsanti dei piani portano allo smart link /download", () => {
    for (const plan of PLANS) assert.equal(plan.href, "/download", plan.name);
  });

  test("la pagina /contatti resta e mostra l'email di assistenza", () => {
    const page = files.find((f) => f.path === "app/contatti/page.tsx");
    assert.ok(page, "manca src/app/contatti/page.tsx");
    const info = files.find((f) => f.path === "components/sections/contact-info.tsx");
    assert.ok(info, "manca src/components/sections/contact-info.tsx");
    assert.match(info.text, /SUPPORT_EMAIL/);
    assert.equal(SUPPORT_EMAIL, "info@finzyapp.com");
  });
});
