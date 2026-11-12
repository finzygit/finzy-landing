/**
 * Backend fuori servizio (MOB-1281). Si lanciano con `pnpm test`.
 *
 * Le notizie del hero e il ticker vengono dall'API del backend. Prima, se
 * l'API non rispondeva (rete, errore HTTP, certificato scaduto), le funzioni
 * tornavano una lista vuota e la pagina rigenerata da Next perdeva card e
 * ticker fino al ritorno dell'API. Ora:
 * - durante `next build` (nessuna pagina precedente da tenere) tornano una
 *   lista vuota: le sezioni si nascondono e il build non si blocca;
 * - in produzione, quando Next rigenera la pagina, lanciano l'errore: Next
 *   scarta la rigenerazione e continua a servire l'ultima pagina buona
 *   (node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md);
 * - in sviluppo (`next dev`) e nei test tornano una lista vuota, come prima.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test, type TestContext } from "node:test";
import { getLatestNews } from "./news.ts";
import { getTickerQuotes } from "./ticker.ts";

const BUILD_PHASE = "phase-production-build";

const env = process.env as Record<string, string | undefined>;
let saved: { NODE_ENV?: string; NEXT_PHASE?: string };

beforeEach(() => {
  saved = { NODE_ENV: env.NODE_ENV, NEXT_PHASE: env.NEXT_PHASE };
});

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
});

/** Una rigenerazione della pagina in produzione (`next start`, Vercel). */
function inProductionRegeneration() {
  env.NODE_ENV = "production";
  delete env.NEXT_PHASE;
}

/** Il prerender di `next build`. */
function inProductionBuild() {
  env.NODE_ENV = "production";
  env.NEXT_PHASE = BUILD_PHASE;
}

/** I modi in cui l'API può non rispondere. */
const outages: [string, () => Promise<Response>][] = [
  ["errore HTTP 500", async () => new Response("", { status: 500 })],
  ["errore HTTP 503 del proxy", async () => new Response("<html>", { status: 503 })],
  [
    "certificato scaduto",
    async () => {
      throw new TypeError("fetch failed", {
        cause: Object.assign(new Error("certificate has expired"), { code: "CERT_HAS_EXPIRED" }),
      });
    },
  ],
  [
    "timeout",
    async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    },
  ],
  ["risposta senza lista", async () => Response.json({ data: null })],
  ["risposta che non è JSON", async () => new Response("<html>maintenance</html>", { status: 200 })],
];

const sources: [string, () => Promise<unknown[]>][] = [
  ["notizie", getLatestNews],
  ["ticker", getTickerQuotes],
];

function silence(t: TestContext) {
  t.mock.method(console, "error", () => {});
}

describe("API giù durante una rigenerazione in produzione", () => {
  for (const [name, load] of sources) {
    for (const [outage, fetchImpl] of outages) {
      test(`${name}, ${outage}: lancia, così Next tiene l'ultima pagina buona`, async (t) => {
        silence(t);
        inProductionRegeneration();
        t.mock.method(globalThis, "fetch", fetchImpl);
        await assert.rejects(load());
      });
    }
  }
});

describe("API giù durante next build", () => {
  for (const [name, load] of sources) {
    for (const [outage, fetchImpl] of outages) {
      test(`${name}, ${outage}: lista vuota, la sezione si nasconde e il build passa`, async (t) => {
        silence(t);
        inProductionBuild();
        t.mock.method(globalThis, "fetch", fetchImpl);
        assert.deepEqual(await load(), []);
      });
    }
  }
});

describe("API giù in sviluppo e nei test", () => {
  for (const [name, load] of sources) {
    test(`${name}: lista vuota, come prima`, async (t) => {
      silence(t);
      env.NODE_ENV = "development";
      delete env.NEXT_PHASE;
      t.mock.method(globalThis, "fetch", async () => new Response("", { status: 500 }));
      assert.deepEqual(await load(), []);
    });
  }
});

describe("API che risponde senza niente da mostrare non è un guasto", () => {
  test("notizie: solo dispacci di routine, lista vuota anche in produzione", async (t) => {
    inProductionRegeneration();
    t.mock.method(globalThis, "fetch", async () =>
      Response.json({
        data: [
          {
            id: 1,
            title: { it: "x", en: "Top Premarket Gainers" },
            created_at: "2026-11-12T12:00:00.000000Z",
            testata: { name: "MTNewswires" },
          },
        ],
      }),
    );
    assert.deepEqual(await getLatestNews(), []);
  });

  test("ticker: nessuna quotazione recente, lista vuota anche in produzione", async (t) => {
    inProductionRegeneration();
    t.mock.method(globalThis, "fetch", async () => Response.json({ data: [] }));
    assert.deepEqual(await getTickerQuotes(), []);
  });

  test("ticker: le quotazioni buone passano in produzione", async (t) => {
    inProductionRegeneration();
    const now = new Date().toISOString();
    t.mock.method(globalThis, "fetch", async () =>
      Response.json({
        data: [
          {
            id: 1,
            symbol: "NVDA",
            name: "NVIDIA",
            value: 190.5,
            percent_change: 1.25,
            valuta: "$",
            quoted_at: now,
            updated_at: now,
          },
        ],
      }),
    );
    assert.deepEqual(await getTickerQuotes(), [
      { symbol: "NVDA", name: "Nvidia", currency: "$", price: 190.5, change: 1.25 },
    ]);
  });
});
