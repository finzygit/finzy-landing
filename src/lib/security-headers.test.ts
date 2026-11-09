/**
 * Test degli header di sicurezza del sito (MOB-625). Si lanciano con `pnpm test`.
 *
 * L'audit del 5/11 (knowledge 15i) ha trovato su finzyapp.com solo HSTS e
 * `X-Powered-By: Next.js`: niente CSP, `X-Frame-Options`, `nosniff`,
 * `Referrer-Policy`. Ogni risposta del sito ora li porta, e Next non dice più
 * chi è.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import nextConfig from "../../next.config.ts";

// Letto in modo dinamico: sul codice vecchio il modulo non esiste, e il test
// deve fallire sulle asserzioni, non sull'import.
const lib = (await import("./security-headers.ts").catch(() => ({}))) as Record<
  string,
  unknown
>;

type Header = { key: string; value: string };
type HeaderRule = { source: string; headers: Header[] };

async function siteWideHeaders(): Promise<Header[]> {
  assert.ok(nextConfig.headers, "next.config.ts non ha headers()");
  const rules = (await nextConfig.headers()) as HeaderRule[];
  const all = rules.filter((r) => r.source === "/(.*)");
  assert.equal(all.length, 1, "serve una sola regola su tutte le rotte, /(.*)");
  return all[0].headers;
}

async function header(name: string): Promise<string | undefined> {
  const found = (await siteWideHeaders()).filter(
    (h) => h.key.toLowerCase() === name.toLowerCase(),
  );
  assert.ok(found.length <= 1, `${name}: un solo header`);
  return found[0]?.value;
}

/** La CSP come mappa direttiva -> sorgenti. */
function parseCsp(value: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of value.split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (!name) continue;
    assert.equal(map.has(name), false, `direttiva ripetuta: ${name}`);
    map.set(name, sources);
  }
  return map;
}

async function enforcedCsp(): Promise<Map<string, string[]>> {
  const value = await header("Content-Security-Policy");
  assert.ok(value, "manca Content-Security-Policy (applicata, non Report-Only)");
  assert.equal(
    await header("Content-Security-Policy-Report-Only"),
    undefined,
    "la CSP è applicata: niente copia Report-Only",
  );
  return parseCsp(value);
}

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

describe("header di sicurezza su tutte le rotte", () => {
  test("Next non manda X-Powered-By", () => {
    assert.equal(nextConfig.poweredByHeader, false);
  });

  test("X-Frame-Options DENY: il sito non si incornicia", async () => {
    assert.equal(await header("X-Frame-Options"), "DENY");
  });

  test("X-Content-Type-Options nosniff", async () => {
    assert.equal(await header("X-Content-Type-Options"), "nosniff");
  });

  test("Referrer-Policy strict-origin-when-cross-origin", async () => {
    assert.equal(
      await header("Referrer-Policy"),
      "strict-origin-when-cross-origin",
    );
  });

  test("nessun HSTS dal sito: lo mette già Vercel", async () => {
    // Vercel manda già `max-age=63072000`; un secondo header lo duplicherebbe.
    assert.equal(await header("Strict-Transport-Security"), undefined);
  });
});

describe("Content-Security-Policy", () => {
  test("le direttive di base sono strette", async () => {
    const csp = await enforcedCsp();
    assert.deepEqual(csp.get("default-src"), ["'self'"]);
    assert.deepEqual(csp.get("object-src"), ["'none'"]);
    assert.deepEqual(csp.get("base-uri"), ["'self'"]);
    assert.deepEqual(csp.get("form-action"), ["'self'"]);
    assert.deepEqual(csp.get("frame-ancestors"), ["'none'"]);
    assert.ok(csp.has("upgrade-insecure-requests"));
  });

  test("nessuna sorgente aperta a tutti o in chiaro", async () => {
    for (const [name, sources] of await enforcedCsp()) {
      for (const source of sources) {
        assert.notEqual(source, "*", `${name}: *`);
        assert.ok(!source.startsWith("http:"), `${name}: ${source}`);
        assert.notEqual(source, "https:", `${name}: https: è tutto il web`);
      }
    }
  });

  test("in produzione niente 'unsafe-eval'", async () => {
    // node --test gira senza NODE_ENV=development, come `next build`.
    const csp = await enforcedCsp();
    assert.ok(!csp.get("script-src")?.includes("'unsafe-eval'"));
  });

  test("in sviluppo 'unsafe-eval' c'è, perché React lo usa per i log", () => {
    const build = lib.contentSecurityPolicy as (opts: {
      dev: boolean;
      vercelPreview: boolean;
    }) => string;
    assert.equal(typeof build, "function", "manca contentSecurityPolicy()");
    const dev = parseCsp(build({ dev: true, vercelPreview: false }));
    assert.ok(dev.get("script-src")?.includes("'unsafe-eval'"));
    const prod = parseCsp(build({ dev: false, vercelPreview: false }));
    assert.ok(!prod.get("script-src")?.includes("'unsafe-eval'"));
  });

  test("lo script di iubenda può partire, e solo da iubenda", async () => {
    // Lo stesso indirizzo che carica src/components/layout/cookie-consent.tsx.
    const src = read("../components/layout/cookie-consent.tsx").match(
      /IUBENDA_SCRIPT = "([^"]+)"/,
    )?.[1];
    assert.ok(src, "IUBENDA_SCRIPT non trovato in cookie-consent.tsx");
    assert.equal(new URL(src).origin, "https://cdn.iubenda.com");
    const csp = await enforcedCsp();
    for (const name of ["script-src", "style-src", "connect-src", "img-src", "frame-src"]) {
      assert.ok(
        csp.get(name)?.includes("https://*.iubenda.com"),
        `${name}: manca https://*.iubenda.com`,
      );
    }
  });

  test("font dal sito (next/font li serve da /_next) e da iubenda", async () => {
    const csp = await enforcedCsp();
    // Nessuna chiamata a Google Fonts: next/font li scarica alla build.
    assert.deepEqual(csp.get("font-src"), ["'self'", "https://*.iubenda.com"]);
    assert.ok(csp.get("img-src")?.includes("'self'"));
  });

  test("la barra di Vercel è ammessa solo nelle anteprime", () => {
    const build = lib.contentSecurityPolicy as (opts: {
      dev: boolean;
      vercelPreview: boolean;
    }) => string;
    assert.equal(typeof build, "function", "manca contentSecurityPolicy()");
    assert.ok(build({ dev: false, vercelPreview: true }).includes("https://vercel.live"));
    assert.ok(!build({ dev: false, vercelPreview: false }).includes("vercel.live"));
  });
});
