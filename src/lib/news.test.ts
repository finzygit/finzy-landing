/**
 * Test del filtro delle notizie del hero (MOB-505). Si lanciano con `pnpm test`.
 *
 * Senza test, perché il codice non cambia: titoli molto lunghi (line-clamp-3
 * in flip-card.tsx), titolo italiano solo sulla pagina italiana e card nascoste
 * a zero notizie (toCards in hero.tsx), timer delle card.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getLatestNews, isRoutineWire, selectShowcaseNews } from "./news.ts";

let nextId = 1;

/** Una riga di /api/blogs come la manda il backend. */
function blog(en: string, extra: Record<string, unknown> = {}) {
  return {
    id: nextId++,
    title: { it: `IT ${en}`, en },
    created_at: "2026-10-16T12:00:00.000000Z",
    testata: { name: "MTNewswires" },
    ...extra,
  };
}

const titlesOf = (rows: { title: { en: string } }[]) => rows.map((row) => row.title.en);

describe("isRoutineWire", () => {
  test("riconosce i formati di routine visti in produzione", () => {
    for (const title of [
      "Top Premarket Decliners",
      "Top Premarket Gainers",
      "Top Midday Gainers",
      "Top Midday Decliners",
      "Top After-Hours Gainers",
      "Top Midday Stories: Anthropic Reports $16.8 Billion in Q3 Revenue; CoreWeave's Credit Risk Hits Intraday High",
      "Sector Update: Tech Stocks Fall Late Afternoon",
      "Sector Update: Healthcare Stocks Edge Higher Pre-Bell Wednesday",
      "Daily Roundup of Key US Economic Data for Oct. 16",
      "Asian Equities Traded in the US as American Depositary Receipts Edge Higher in Friday Trading",
      "European Equities Traded in the US as American Depositary Receipts Open Higher in Monday Trading",
      "Exchange-Traded Funds, Equity Futures Mixed Pre-Bell Friday Amid Investor Caution",
      "Exchange-Traded Funds Rise as US Equities Advance After Midday",
      "Top Cryptocurrencies Drop; Bitcoin Falls Below $82,000",
      "US Equity Markets End Higher Amid Broad Rally, Strong Mega-Cap Gains",
      "US Equity Indexes Mixed This Week as CoreWeave Rattles AI Trade, Sparks Rotation Out of Technology",
      "US Equity Futures Mixed Pre-Bell as Traders Assess Major Bank Earnings",
      "US Dollar Falls Early Friday Ahead of Import Prices, New York Fed Services, Industrial Production",
      "US Dollar Rises Early Monday; Focus on Inflation, Retail Sales This Week",
      "US Treasury Late-Day Levels",
      "US Treasury Closing Levels",
      "European Equities Traded in US as ADRs Fall in Thursday Trading",
      "Update: Equities Mixed at Close Ahead of Big Bank Earnings",
      "Update: Equities Rise Intraday as Traders Parse Consumer Sentiment Survey",
      "Update: Equity Markets Rise Intraday as Yields Fall",
      "Equity Indexes Slide Intraday Amid Tech Sell-Off",
      "Stocks Mostly Down Pre-Bell as Traders Await Big Bank Earnings",
      "Stocks Mostly Up Pre-Bell Ahead of Consumer Inflation Report, More Bank Earnings",
      "Stocks Rise Pre-Bell Following Tech Selloff",
      "AI Bears March Down Wall Street Pre-Bell; Asia Down, Europe Off",
    ]) {
      assert.equal(isRoutineWire(title), true, title);
    }
  });

  test("riconosce lo stesso formato con prefissi e grafie diverse", () => {
    for (const title of [
      "NZX Midday Sector Update: Commercial Services Stocks Rise, Producer Manufacturing Falls",
      "ASX Midday Sector Update: Materials Stocks Rise, Communication Services Slide",
      "ASX Close Sector Update: Energy Stocks Lead",
      "Hong Kong Midday Sector Update: Property Stocks Slide",
      "S&P/ASX 200 Midday Sector Update: Banks Rise",
      "Update: Sector Update: Energy Stocks Gain Late Afternoon",
      "Correction: Sector Update: Energy Stocks Rise Late Afternoon",
      "UPDATE: update 2: Daily Roundup of Key US Economic Data for Oct. 13",
      "Update: US Equity Indexes Fall After Core Inflation Rate Rises",
      "Top Pre-Market Decliners",
      "Top Pre Market Gainers",
      "top premarket decliners",
      "TOP AFTER HOURS GAINERS",
      "  Sector  Update –  Tech Stocks Fall Premarket Tuesday",
      "Sector Update - Financial Stocks Rise Friday",
      "U.S. Equity Markets Open Lower",
      "Exchange Traded Funds Lower as US Equities Decline After Midday",
      "Exchange-Traded Funds Rise as US Equities Advance After Mid-Day",
      "US Treasury Late Day Levels",
      "Daily Round-Up of Key US Economic Data for Oct. 14",
      "Asian Equities Traded in the US as American Depository Receipts Rise in Friday Trading",
      "Top Prebell Gainers",
      "ASX Midday Sector Update - Materials Rise",
      "Update - Sector Update – Tech Stocks Fall",
    ]) {
      assert.equal(isRoutineWire(title), true, title);
    }
  });

  test("tiene le notizie vere, anche con le stesse parole a metà titolo", () => {
    for (const title of [
      "Shenghe Resources to Transfer Stake in Rare Earth Smelting Firms; Shares Down 7%",
      "Shares Fall Ahead of Earnings; Top Premarket Decliners Include Tesla",
      "Oil Prices Rise as Traders Weigh Sector Update From OPEC",
      "Analysts Expect Sector Update to Lift Banks",
      "Alignment Healthcare Sees Lowered Federal Rating for California Health Plan; Shares Fall Pre-Bell",
      "SK Hynix, Micron Shares Fall Pre-Bell Amid Reports of CXMT's Breakthrough in Chip Development",
      "Stocks of Chinese EV Makers Rally on Subsidy Plan",
      "Equities Research Firm Names New CEO",
      "Goldman Tops Third-Quarter Views Amid Equities Boost, Record Advisory Revenue",
      "Top Glove Swings to Profit in Fiscal Q4",
      "US Equity Investors to Monitor Q3 Earnings, September's Inflation Data, Crude Oil Moves This Week",
      "US Equity Market Structure Overhaul Proposed by SEC",
      "Exchange-Traded Funds Draw Record Inflows in September",
      "Correction: Stellantis' Q3 Estimated Consolidated Shipments Decline",
      "US Dollar Strengthens Against The Loonie as Higher CPI Sparks Rate Hike Expectation",
      "Foreign Holdings of US Treasuries Rise in August, Led by Canada and Belgium",
      "Market Chatter: Apple Appoints Former Meta Executive to Lead AI Hardware",
      "Update: Alcoa Shares Rise After Q3 Earnings Beat",
      "",
    ]) {
      assert.equal(isRoutineWire(title), false, title);
    }
  });
});

describe("selectShowcaseNews", () => {
  test("data vuota o non lista: nessuna notizia", () => {
    for (const data of [undefined, null, {}, "x", 42, []]) {
      assert.deepEqual(selectShowcaseNews(data, 6), []);
    }
  });

  test("salta i dispacci e prende le prime 6 notizie vere, nell'ordine dell'API", () => {
    const rows = [
      blog("Top Premarket Decliners"),
      blog("Story 1"),
      blog("Sector Update: Tech Stocks Fall Late Afternoon"),
      blog("Story 2"),
      blog("Story 3"),
      blog("Daily Roundup of Key US Economic Data for Oct. 16"),
      blog("Story 4"),
      blog("Story 5"),
      blog("Story 6"),
      blog("Story 7"),
    ];
    assert.deepEqual(titlesOf(selectShowcaseNews(rows, 6)), [
      "Story 1",
      "Story 2",
      "Story 3",
      "Story 4",
      "Story 5",
      "Story 6",
    ]);
  });

  test("con meno di 6 notizie vere su 30 mostra solo quelle", () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      i % 10 === 4 ? blog(`Story ${i}`) : blog("Top Midday Gainers"),
    );
    assert.deepEqual(titlesOf(selectShowcaseNews(rows, 6)), ["Story 4", "Story 14", "Story 24"]);
  });

  test("se tutte le 30 sono dispacci non torna nulla e le card spariscono", () => {
    const rows = Array.from({ length: 30 }, () => blog("Sector Update: Energy Stocks Rise"));
    assert.deepEqual(selectShowcaseNews(rows, 6), []);
  });

  test("decide una volta per notizia, uguale in italiano e in inglese", () => {
    const news = selectShowcaseNews(
      [
        blog("", {
          title: { it: "I titoli in maggior calo prima dell'apertura", en: "Top Premarket Decliners" },
        }),
        blog("", {
          title: { it: "Sector Update: Apple presenta il nuovo iPad", en: "Apple Unveils New iPad" },
        }),
      ],
      6,
    );
    assert.deepEqual(
      news.map((item) => item.title),
      [{ it: "Sector Update: Apple presenta il nuovo iPad", en: "Apple Unveils New iPad" }],
    );
  });

  test("senza titolo inglese filtra e mostra quello italiano", () => {
    const news = selectShowcaseNews(
      [
        blog("", { title: { it: "Sector Update: Tech Stocks Fall", en: null } }),
        blog("", { title: { it: "Apple presenta il nuovo iPad" } }),
      ],
      6,
    );
    assert.deepEqual(
      news.map((item) => item.title),
      [{ it: "Apple presenta il nuovo iPad", en: "Apple presenta il nuovo iPad" }],
    );
  });

  test("senza titolo italiano mostra quello inglese in tutte e due le lingue", () => {
    const news = selectShowcaseNews([blog("", { title: { en: "  Apple Unveils New iPad " } })], 6);
    assert.deepEqual(news[0].title, { it: "Apple Unveils New iPad", en: "Apple Unveils New iPad" });
  });

  test("scarta le righe senza titolo o senza data, tiene quelle senza testata", () => {
    const news = selectShowcaseNews(
      [
        blog("", { title: null }),
        blog("", { title: { it: " ", en: "" } }),
        blog("No date", { created_at: null }),
        blog("No source", { testata: null }),
        blog("Unnamed source", { testata: { name: null } }),
      ],
      6,
    );
    assert.deepEqual(
      news.map((item) => [item.title.en, item.source]),
      [
        ["No source", ""],
        ["Unnamed source", ""],
      ],
    );
  });

  test("passa id, data e testata alla card", () => {
    const row = blog("Story", { created_at: "2026-10-16T08:30:00.000000Z" });
    assert.deepEqual(selectShowcaseNews([row], 6), [
      {
        id: row.id,
        title: { it: "IT Story", en: "Story" },
        publishedAt: "2026-10-16T08:30:00.000000Z",
        source: "MTNewswires",
      },
    ]);
  });
});

describe("getLatestNews", () => {
  test("chiede 30 righe, rilegge ogni 5 minuti e mostra 6 notizie vere", async (t) => {
    const rows = [
      ...Array.from({ length: 10 }, () => blog("Top Premarket Gainers")),
      ...Array.from({ length: 20 }, (_, i) => blog(`Story ${i}`)),
    ];
    const fetchMock = t.mock.method(globalThis, "fetch", async () =>
      Response.json({ data: rows }),
    );

    const news = await getLatestNews();

    const [url, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
    assert.equal(new URL(url).searchParams.get("limit"), "30");
    assert.equal(init.next?.revalidate, 300);
    assert.deepEqual(titlesOf(news), ["Story 0", "Story 1", "Story 2", "Story 3", "Story 4", "Story 5"]);
  });

  test("se l'API risponde con un errore non torna nulla", async (t) => {
    t.mock.method(console, "error", () => {});
    t.mock.method(globalThis, "fetch", async () => new Response("", { status: 500 }));
    assert.deepEqual(await getLatestNews(), []);
  });

  test("se l'API non risponde in tempo non torna nulla", async (t) => {
    t.mock.method(console, "error", () => {});
    t.mock.method(globalThis, "fetch", async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    assert.deepEqual(await getLatestNews(), []);
  });

  test("se la risposta non ha una lista non torna nulla", async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json({ data: null }));
    assert.deepEqual(await getLatestNews(), []);
  });
});
