import { expect, test, type Page } from "@playwright/test";

// MOB-1447: on a phone a tap on a menu link scrolled the page behind but left
// the full-screen menu open. Italian is the default language of the site.
const DIALOG = "Menu di navigazione";
const OPEN = "Apri menu";
const CLOSE = "Chiudi menu";

const SECTIONS = [
  { label: "Cos'è Finzy", id: "cos-e-finzy" },
  { label: "Funzionalità", id: "funzionalita" },
  { label: "Come funziona", id: "processo" },
  { label: "Learning", id: "learning" },
  { label: "Prezzi", id: "prezzi" },
];

// The site picks its language from the browser: pin Italian.
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  locale: "it-IT",
});

// The production build sends `upgrade-insecure-requests` (security-headers.ts):
// over plain http on this machine WebKit then asks for every script over
// https, fails, and the page never hydrates. Drop only that directive here.
test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => url.protocol === "http:",
    async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();
      const response = await route.fetch();
      const headers = { ...response.headers() };
      const csp = headers["content-security-policy"];
      if (csp) {
        headers["content-security-policy"] = csp
          .split(";")
          .filter((d) => d.trim() !== "upgrade-insecure-requests")
          .join(";");
      }
      await route.fulfill({ response, headers });
    },
  );
});

/**
 * How many navigation menus the user sees: a dialog on screen, opaque and
 * taking taps. Measured on the page, so it works whether the closed menu is
 * kept in the DOM (faded out) or not.
 */
const shownMenus = (page: Page) =>
  page.evaluate((name) => {
    return [...document.querySelectorAll(`[role="dialog"][aria-label="${name}"]`)].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.visibility !== "hidden" && cs.pointerEvents !== "none" && Number(cs.opacity) > 0.5;
    }).length;
  }, DIALOG);

async function expectMenuClosed(page: Page) {
  await expect.poll(() => shownMenus(page), { timeout: 5_000 }).toBe(0);
}

/** Taps the «Apri menu» button that is on screen (hero header or compact bar). */
async function openMenu(page: Page) {
  // Retried: a tap that lands before React has hydrated the page does nothing.
  await expect(async () => {
    // Already open (a slow earlier try): tapping again would hit the X.
    if ((await shownMenus(page)) === 1) return;
    const point = await page.evaluate((label) => {
      const onScreen = [...document.querySelectorAll(`button[aria-label="${label}"]`)]
        .map((b) => b.getBoundingClientRect())
        .find((r) => r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight);
      return onScreen ? { x: onScreen.left + onScreen.width / 2, y: onScreen.top + onScreen.height / 2 } : null;
    }, OPEN);
    expect(point, "a menu button on screen").not.toBeNull();
    await page.touchscreen.tap(point!.x, point!.y);
    await expect.poll(() => shownMenus(page), { timeout: 1_500 }).toBe(1);
  }).toPass({ timeout: 10_000 });
}

/**
 * Taps the screen, like a finger, where the link (by its text) or the button
 * (by its aria-label) of the menu on screen is.
 */
async function tapMenuLink(page: Page, label: string) {
  const point = await page.evaluate(
    ([name, text]) => {
      const shown = [...document.querySelectorAll(`[role="dialog"][aria-label="${name}"]`)].find(
        (d) => getComputedStyle(d).pointerEvents !== "none" && getComputedStyle(d).visibility !== "hidden",
      );
      const link = [...(shown?.querySelectorAll("a, button") ?? [])].find(
        (el) => el.textContent?.trim() === text || el.getAttribute("aria-label") === text,
      );
      if (!link) return null;
      const r = link.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    [DIALOG, label] as const,
  );
  expect(point, `menu link «${label}» on screen`).not.toBeNull();
  await page.touchscreen.tap(point!.x, point!.y);
}

/** The section's top edge sits near the top of the viewport (below the bar). */
async function expectSectionAtTop(page: Page, id: string) {
  await expect
    .poll(
      () => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top),
      { timeout: 5_000 },
    )
    .toBeLessThan(200);
  await expect(page.locator(`#${id}`)).toBeInViewport();
  const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(-5);
}

test("tapping Funzionalità closes the menu and shows the section", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  await tapMenuLink(page, "Funzionalità");
  await expectMenuClosed(page);
  await expectSectionAtTop(page, "funzionalita");
  await expect(page).toHaveURL(/\/#funzionalita$/);
  // The page scrolls again once the menu is closed.
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("the page renders one menu, opened by either menu button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: DIALOG, includeHidden: true })).toHaveCount(1);
  // At the top only the hero's button is reachable (the compact bar is hidden).
  await expect(page.getByRole("button", { name: OPEN })).toHaveCount(1);
  // Scrolled down, the compact bar's button opens the same menu.
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect(page.locator(`[aria-label="${OPEN}"]`).first()).toBeInViewport();
  await openMenu(page);
  await tapMenuLink(page, "Prezzi");
  await expectMenuClosed(page);
  await expectSectionAtTop(page, "prezzi");
});

for (const { label, id } of SECTIONS) {
  test(`menu link ${label} lands on #${id} with the menu closed`, async ({ page }) => {
    await page.goto("/");
    await openMenu(page);
    await tapMenuLink(page, label);
    await expectMenuClosed(page);
    await expectSectionAtTop(page, id);
  });
}

test("Home closes the menu and goes back to the top", async ({ page }) => {
  await page.goto("/#prezzi");
  await openMenu(page);
  await tapMenuLink(page, "Home");
  await expectMenuClosed(page);
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeLessThan(5);
  await expect(page).toHaveURL(/\/$/);
});

test("Contatti opens the contact page with the menu closed", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  await tapMenuLink(page, "Contatti");
  await expect(page).toHaveURL(/\/contatti$/);
  await expectMenuClosed(page);
});

test("from /contatti a section link goes to that home section", async ({ page }) => {
  await page.goto("/contatti");
  await openMenu(page);
  await tapMenuLink(page, "Funzionalità");
  await expect(page).toHaveURL(/\/#funzionalita$/);
  await expectMenuClosed(page);
  await expectSectionAtTop(page, "funzionalita");
});

test("the X closes the menu", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  await tapMenuLink(page, CLOSE);
  await expectMenuClosed(page);
});

test("Escape closes the menu", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);
  await page.keyboard.press("Escape");
  await expectMenuClosed(page);
});

test("Back and Forward to another page keep the menu closed", async ({ page }) => {
  // Reach the home by a client-side navigation, so the layout (and its menu
  // state) survives the history moves, as on a real visit.
  await page.goto("/contatti");
  await openMenu(page);
  await tapMenuLink(page, "Home");
  await expect(page).toHaveURL(/\/$/);
  await expectMenuClosed(page);
  await openMenu(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/contatti$/);
  await expectMenuClosed(page);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  await expectMenuClosed(page);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

// MOB-1459: a client-side navigation to another page must open it at the top.
// Next scrolled the new page's children into view one by one (its top sits
// under the root scroll-padding-top) and the home ended near its footer.
async function expectAtTop(page: Page) {
  await page.waitForTimeout(1_500); // let any smooth scroll run out
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 }).toBeLessThan(5);
}

for (const from of ["/contatti", "/elimina-account"]) {
  test(`from ${from} the logo opens the home at the top`, async ({ page }) => {
    await page.goto(from);
    await page.locator('a[aria-label="finzy — home"]').first().tap();
    await expect(page).toHaveURL(/\/$/);
    await expectAtTop(page);
  });
}

test("from /contatti the menu's Home opens the home at the top", async ({ page }) => {
  await page.goto("/contatti");
  await openMenu(page);
  await tapMenuLink(page, "Home");
  await expect(page).toHaveURL(/\/$/);
  await expectMenuClosed(page);
  await expectAtTop(page);
});

test("from the home scrolled down, Contatti opens at the top", async ({ page }) => {
  await page.goto("/#prezzi");
  await openMenu(page);
  await tapMenuLink(page, "Contatti");
  await expect(page).toHaveURL(/\/contatti$/);
  await expectAtTop(page);
});
