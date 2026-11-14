// MOB-1198 (FZW-WEB-02): no horizontal page scroll at 375 px except inside the
// statement tables, and screenshots of every page for the PR, with the API
// mocked (e2e/mock-api.ts). SHOTS=<dir> saves the screenshots there.
import { expect, test, type Page } from "@playwright/test";
import { mockApi } from "./mock-api";

const SHOTS = process.env.SHOTS;

async function shot(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(250);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function noSideScroll(page: Page) {
  const r = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, view: window.innerWidth }));
  expect(r.doc, "page wider than the screen").toBeLessThanOrEqual(r.view);
  expect(r.body, "body wider than the screen").toBeLessThanOrEqual(r.view);
}

const PAGES: [string, string, Parameters<typeof mockApi>[1]?][] = [
  ["accedi", "/accedi", { signedIn: false }],
  ["password", "/password", { signedIn: false }],
  ["riservata", "/riservata", { unlimited: false }],
  ["riservata-scaduto", "/riservata?scaduto=1", { unlimited: false }],
  ["ricerca", "/"],
  ["summary-usa", "/titolo?s=NVDA"],
  ["summary-europa", "/titolo?s=ASML"],
  ["profilo", "/titolo?s=NVDA&tab=profilo"],
  ["statistiche", "/titolo?s=NVDA&tab=statistiche"],
  ["punteggi", "/titolo?s=NVDA&tab=punteggi"],
  ["punteggi-finanziario", "/titolo?s=JPM&tab=punteggi"],
  ["finanza", "/titolo?s=NVDA&tab=finanza"],
  ["notizie", "/titolo?s=NVDA&tab=notizie"],
  ["report", "/titolo?s=NVDA&tab=report"],
  ["report-vuoto", "/titolo?s=TSM&tab=report"],
  ["osservati", "/osservati"],
  ["non-trovato", "/titolo?s=ZZZZ"],
];

for (const [width, tag] of [
  [1440, "1440"],
  [1024, "1024"],
  [375, "375"],
] as const) {
  test.describe(`${tag} px`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 900 } });
    for (const [name, path, opts] of PAGES) {
      test(`${name}`, async ({ page }) => {
        await mockApi(page, opts);
        await page.goto(path);
        await shot(page, `${tag}-${name}`);
        await noSideScroll(page);
      });
    }
  });
}

test.describe("states", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a visitor stays on /password and keeps the deep link on the way to sign in", async ({ page }) => {
    await mockApi(page, { signedIn: false });
    await page.goto("/password");
    await expect(page.getByRole("heading", { name: "Password dimenticata?" })).toBeVisible();
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/password");
    await page.goto("/titolo?s=NVDA&tab=finanza");
    await expect(page.getByRole("heading", { name: "Accedi a Finzy" })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("next")).toBe("/titolo?s=NVDA&tab=finanza");
  });

  test("an unknown path gets the 404 page", async ({ page }) => {
    await mockApi(page);
    const res = await page.goto("/non-esiste");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Titolo non trovato")).toBeVisible();
  });

  test("search results, indicators, article, toast", async ({ page }) => {
    await mockApi(page, { watch: ["AMZN"] });
    await page.goto("/");
    await page.getByRole("combobox").fill("micro");
    await expect(page.getByText("Microsoft Corp")).toBeVisible();
    await shot(page, "1440-ricerca-risultati");

    await page.goto("/titolo?s=NVDA");
    for (const name of ["Media mobile 20", "Media esponenziale", "RSI 14", "MACD"]) await page.getByRole("button", { name }).click();
    await expect(page.getByRole("img", { name: "MACD" })).toBeVisible();
    await shot(page, "1440-grafico-indicatori");

    await page.getByRole("button", { name: "Aggiungi agli osservati" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Aggiunto agli osservati" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Negli osservati" })).toBeVisible();
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/1440-osservato-toast.png` });

    await page.goto("/titolo?s=NVDA&tab=notizie");
    await page.getByRole("button", { name: /Nvidia scende/ }).click();
    await expect(page.getByText("Contenuto generato da IA")).toBeVisible();
    await shot(page, "1440-notizia-aperta");
  });

  test("English", async ({ page }) => {
    await mockApi(page, { lang: "en" });
    await page.goto("/titolo?s=NVDA");
    await expect(page.getByText("Analyst consensus")).toBeVisible();
    await expect(page.getByText("$221.30")).toBeVisible();
    await shot(page, "1440-summary-en");
  });

  test("statement table scrolls inside its card only, at 375", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockApi(page);
    await page.goto("/titolo?s=NVDA&tab=finanza");
    const scroller = page.getByTestId("fin-scroll");
    await expect(scroller).toBeVisible();
    const inner = await scroller.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(inner.scroll).toBeGreaterThan(inner.client);
    await noSideScroll(page);
  });
});
