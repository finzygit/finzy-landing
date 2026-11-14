import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { ApiError, type Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";
import type { HomeData } from "./types";

const nav = vi.hoisted(() => ({ pathname: "/", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const ALL = ["console.home.view", "console.spend.view", "console.users.view", "console.news.view"];

function me(perms: string[]): Me {
  return { user: { id: 3, name: "Giulia Conti", email: "g.conti@esempio.it" }, role: { id: 2, key: "Ruolo", label: "Ruolo" }, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

// Production shapes of 13 Nov 22:30 (the numbers drawn on #700), no personal data.
const AI = {
  week: 92.59,
  month: 162.87,
  week_from: "2026-11-07",
  month_from: "2026-11-01",
  lines: { images: { today: 9.83, month: 105.07 }, articles: { today: 3.09, month: 38.58 }, stock_snapshot: { today: 0, month: 0.14 }, financial_report: { today: 0.18, month: 16.16 } },
  latest_at: "2026-11-13T22:18:00+01:00",
};
const USERS = { new: { today: 38, d7: 226, d30: 1079 }, registered: 1478, per_plan: { free: 1460, premium: 2, unlimited: 16, trial: 0 }, store_started_month: 2, latest_at: "2026-11-13T21:42:00+01:00" };
const NEWS = { mt: { collected: { today: 1046, week: 5601, month: 11795 }, selected: { today: 217, week: 1234, month: 2635 } }, latest_at: "2026-11-12T22:29:00+01:00" };

function home(over: Partial<HomeData> = {}): HomeData {
  return { generated_at: "2026-11-13T22:30:00+01:00", groups: { ai_spend: AI, users: USERS, news: NEWS }, alerts: [], ...over };
}

type Answer = HomeData | Error;

function api(meValue: Me, answers: Answer[]): Api & { get: ReturnType<typeof vi.fn> } {
  const queue = [...answers];
  return {
    get: vi.fn(async (path: string) => {
      if (path === "/me") return meValue;
      if (path === "/home") {
        const a = queue.length > 1 ? queue.shift() : queue[0];
        if (a instanceof Error) throw a;
        return a;
      }
      throw new Error(`unexpected ${path}`);
    }),
    post: vi.fn() as Api["post"],
    put: vi.fn() as Api["put"],
    del: vi.fn(async () => null) as Api["del"],
    blob: vi.fn() as Api["blob"],
  } as Api & { get: ReturnType<typeof vi.fn> };
}

function show(a: Api) {
  return render(
    <ConsoleProvider api={a}>
      <HomePage />
    </ConsoleProvider>,
  );
}

const homeCalls = (a: { get: ReturnType<typeof vi.fn> }) => a.get.mock.calls.filter((c) => c[0] === "/home").length;

describe("Home", () => {
  beforeEach(() => {
    nav.pathname = "/";
    nav.replace.mockReset();
  });

  it("shows the three groups with #239's numbers, each linking to its page", async () => {
    show(api(me(ALL), [home()]));

    const ai = await screen.findByRole("region", { name: "Spesa AI" });
    expect(await within(ai).findByText("$92,59")).toBeTruthy();
    expect(within(ai).getByText("$162,87")).toBeTruthy();
    expect(within(ai).getByText("7–13 nov")).toBeTruthy();
    expect(within(ai).getByText("1–13 nov")).toBeTruthy();
    expect(within(ai).getByText("$105,07")).toBeTruthy();
    expect(within(ai).getByText("Ultima chiamata AI registrata: oggi alle 22:18")).toBeTruthy();
    expect(within(ai).getByRole("link", { name: /Apri Spesa AI/ }).getAttribute("href")).toBe("/costi");

    const users = screen.getByRole("region", { name: "Utenti" });
    expect(within(users).getByText("1.079")).toBeTruthy();
    expect(within(users).getByText("1.478 registrati")).toBeTruthy();
    expect(within(users).getByRole("link", { name: /Apri Utenti/ }).getAttribute("href")).toBe("/utenti");

    const news = screen.getByRole("region", { name: "Notizie" });
    expect(within(news).getByText("11.795")).toBeTruthy();
    expect(within(news).getByText("Ultimo articolo: 12/11/2026, 22:29")).toBeTruthy();
    expect(within(news).getByRole("link", { name: /Apri Notizie/ }).getAttribute("href")).toBe("/notizie");

    expect(screen.getByText("Aggiornato alle 22:30")).toBeTruthy();
    expect(screen.getByText(/I costi AI sono stime in dollari/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Avvisi" })).toBeNull();
  });

  it("shows one alert row per problem, each with the page to open", async () => {
    show(
      api(me(ALL), [
        home({
          alerts: [
            { kind: "budget", level: "critical", group: "ai_spend", provider: "gemini", spend: 210, budget: 250, percent: 84 },
            { kind: "customer_io", level: "warning", group: "ai_spend", count: 3 },
            { kind: "mt_stopped", level: "warning", group: "news", latest_at: "2026-11-13T09:12:00+01:00", hours: 3 },
          ],
        }),
      ]),
    );

    const alerts = await screen.findByRole("region", { name: "Avvisi" });
    const rows = within(alerts).getAllByRole("status");
    expect(rows.map((r) => r.textContent)).toEqual([
      "Spesa Gemini del mese: $210,00 su un budget di $250,00 (84%).Apri Spesa AI",
      "3 invii a Customer.io non riusciti negli ultimi 7 giorni.Apri Salute dei servizi",
      "Nessun nuovo articolo MT Newswires da 3 ore (l’ultimo alle 09:12).Apri Notizie",
    ]);
    expect(within(rows[1]).getByRole("link").getAttribute("href")).toBe("/servizi");
  });

  it("a role without AI spend sees neither the group nor the sentence on AI costs", async () => {
    show(api(me(["console.home.view", "console.users.view", "console.news.view"]), [home({ groups: { users: USERS, news: NEWS } })]));

    await screen.findByRole("region", { name: "Utenti" });
    expect(screen.queryByRole("region", { name: "Spesa AI" })).toBeNull();
    expect(screen.getByText("Giorni e mesi sull’ora di Roma.")).toBeTruthy();
  });

  it("a failing group says so on its own card; Riprova reads the Home again", async () => {
    const a = api(me(ALL), [home({ groups: { ai_spend: AI, users: { error: "unavailable" }, news: NEWS } }), home()]);
    show(a);

    const users = await screen.findByRole("region", { name: "Utenti" });
    await within(users).findByText("Dato non disponibile.");
    expect(within(screen.getByRole("region", { name: "Notizie" })).getByText("11.795")).toBeTruthy();

    fireEvent.click(within(users).getByRole("button", { name: "Riprova" }));
    await within(users).findByText("1.079");
    expect(homeCalls(a)).toBe(2);
  });

  it("when the Home cannot be read at all it says so, and Riprova tries again", async () => {
    const a = api(me(ALL), [new ApiError(500, null), home()]);
    show(a);

    await screen.findByText("Non è stato possibile caricare la Home");
    expect(screen.getByText("Il server non ha risposto. Riprova tra poco.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await screen.findByText("$92,59");
  });

  it("a failed «Aggiorna» keeps the numbers and says from when they are", async () => {
    const a = api(me(ALL), [home(), new ApiError(0, "offline")]);
    show(a);

    await screen.findByText("Aggiornato alle 22:30");
    fireEvent.click(screen.getByRole("button", { name: "Aggiorna" }));

    await screen.findByText("Aggiornamento non riuscito. I numeri sono quelli delle 22:30.");
    expect(screen.getByText("$92,59")).toBeTruthy();
    expect(homeCalls(a)).toBe(2);
  });

  it("a role that opens the Home but none of its groups goes on to its first page", async () => {
    const a = api(me(["console.home.view", "console.promotions.view", "console.tools.view"]), [home({ groups: {} })]);
    show(a);

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/promozioni"));
    expect(homeCalls(a)).toBe(0);
  });

  it("a role with no page at all is told so", async () => {
    show(api(me(["console.home.view"]), [home({ groups: {} })]));

    await screen.findByText("Nessuna pagina disponibile");
    expect(screen.getByText("Il tuo ruolo non apre nessuna pagina del pannello. Chiedi a un super admin.")).toBeTruthy();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
