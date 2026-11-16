// MOB-1461 (D444, design finzygit/finzy#750): Carlo's dashboard additions on
// the Home: the change of new users, the bars per day, the 30-day AI spend,
// the cost of one generation, the archive, the stored prices and the MRR
// group (only with Ricavi e promozioni). Numbers: production 16 Nov 10:44.
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import type { Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";
import { change, millions, usd4 } from "./format";
import type { HomeData } from "./types";

const nav = vi.hoisted(() => ({ pathname: "/", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const ALL = ["console.home.view", "console.spend.view", "console.users.view", "console.news.view", "console.revenue.view"];

function me(perms: string[]): Me {
  return { user: { id: 3, name: "Giulia Conti", email: "g.conti@esempio.it" }, role: { id: 2, key: "Ruolo", label: "Ruolo" }, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

const line = (today: number, month: number, units: number, cost: number | null) => ({ today, month, units_30: units, unit_cost_30: cost });
const AI = {
  week: 70.99,
  month: 177.28,
  d30: 335.25,
  week_from: "2026-11-10",
  month_from: "2026-11-01",
  d30_from: "2026-10-18",
  lines: { images: line(5.81, 115.56, 5772, 0.039), articles: line(1.78, 42.03, 5829, 0.01308), stock_snapshot: line(0, 0.14, 1, 0.14), financial_report: line(0, 16.16, 0, null) },
  latest_at: "2026-11-16T10:20:00+01:00",
};
const DAYS = Array.from({ length: 30 }, (_, i) => ({ day: `2026-${i < 14 ? "10" : "11"}-${String(i < 14 ? 18 + i : i - 13).padStart(2, "0")}`, count: i === 29 ? 8 : 30 }));
const USERS = { new: { today: 8, d7: 187, d30: 1030, d30_previous: 489 }, per_day: DAYS, registered: 1555, per_plan: { free: 1537, premium: 2, unlimited: 16, trial: 0 }, store_started_month: 2, latest_at: "2026-11-16T09:23:00+01:00" };
const NEWS = { mt: { collected: { today: 378, week: 4888, month: 12234 }, selected: { today: 146, week: 1145, month: 2886 } }, archive: { all: 37750, d7: 5020, d30: 24603 }, price_points: 29_214_000, latest_at: "2026-11-16T10:04:00+01:00" };

function home(groups: HomeData["groups"]): HomeData {
  return { generated_at: "2026-11-16T10:44:00+01:00", groups, alerts: [] };
}

function api(meValue: Me, answer: HomeData): Api {
  return {
    get: vi.fn(async (path: string) => (path === "/me" ? meValue : path === "/home" ? answer : Promise.reject(new Error(path)))),
    post: vi.fn() as Api["post"],
    put: vi.fn() as Api["put"],
    del: vi.fn(async () => null) as Api["del"],
    blob: vi.fn() as Api["blob"],
  } as Api;
}

const show = (a: Api) =>
  render(
    <ConsoleProvider api={a}>
      <HomePage />
    </ConsoleProvider>,
  );

describe("Home additions (MOB-1461)", () => {
  beforeEach(() => {
    nav.pathname = "/";
  });

  it("formats the change, the averages and the millions the Italian way", () => {
    expect(change(((1030 - 489) / 489) * 100)).toBe("+110,6 %");
    expect(change(-17.83)).toBe("−17,8 %");
    expect(change(0.01)).toBe("0 %");
    expect(usd4(0.039)).toBe("$0,0390");
    expect(millions(29_214_000)).toBe("29,2");
  });

  it("shows the growth, the bars, the 30 days, the cost per generation, the archive, the prices and the MRR", async () => {
    show(api(me(ALL), home({ ai_spend: AI, users: USERS, news: NEWS, revenue: { mrr: 94.6 } })));

    const ai = await screen.findByRole("region", { name: "Spesa AI" });
    expect(await within(ai).findByText("$335,25")).toBeTruthy();
    expect(within(ai).getByText("18 ott–16 nov")).toBeTruthy();
    expect(within(ai).getByText("Costo medio · 30 giorni")).toBeTruthy();
    expect(within(ai).getByText("$0,0390")).toBeTruthy();
    expect(within(ai).getByText("per immagine")).toBeTruthy();
    expect(within(ai).getByText("nessun report in 30 giorni")).toBeTruthy();

    const users = screen.getByRole("region", { name: "Utenti" });
    expect(within(users).getByText("+110,6 %")).toBeTruthy();
    expect(within(users).getByText("sui 30 giorni prima (489)")).toBeTruthy();
    const bars = within(users).getByRole("figure", { name: "Nuovi utenti al giorno" });
    expect(within(bars).getAllByRole("listitem")).toHaveLength(30);
    expect(within(bars).getByText("16 nov: 8")).toBeTruthy();

    const news = screen.getByRole("region", { name: "Notizie" });
    expect(within(news).getByText("37.750")).toBeTruthy();
    expect(within(news).getByText("29,2 milioni")).toBeTruthy();

    const rev = screen.getByRole("region", { name: "Ricavi" });
    expect(within(rev).getByText("$94,60")).toBeTruthy();
    expect(within(rev).getByText("Calcolato alle 10:44")).toBeTruthy();
    expect(within(rev).getByRole("link", { name: /Apri Ricavi e promozioni/ }).getAttribute("href")).toBe("/revenue");
  });

  it("says «—» when nobody signed up in the 30 days before", async () => {
    show(api(me(ALL), home({ ai_spend: AI, users: { ...USERS, new: { ...USERS.new, d30_previous: 0 } }, news: NEWS, revenue: { mrr: 0 } })));

    const users = await screen.findByRole("region", { name: "Utenti" });
    expect(await within(users).findByText("—")).toBeTruthy();
    expect(within(users).getByText("nessun utente nei 30 giorni prima")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Ricavi" })).getByText("Nessun abbonamento attivo sugli store")).toBeTruthy();
  });

  it("without Ricavi e promozioni there is no MRR group", async () => {
    show(api(me(ALL.filter((p) => p !== "console.revenue.view")), home({ ai_spend: AI, users: USERS, news: NEWS })));

    await screen.findByText("1.030");
    expect(screen.queryByRole("region", { name: "Ricavi" })).toBeNull();
  });

  it("an older backend without the new fields still draws the Home as before", async () => {
    const { d30: _d30, d30_from: _from, ...oldAi } = AI;
    void _d30;
    void _from;
    const old = { ...oldAi, lines: { images: { today: 5.81, month: 115.56 }, articles: { today: 1.78, month: 42.03 }, stock_snapshot: { today: 0, month: 0.14 }, financial_report: { today: 0, month: 16.16 } } };
    show(api(me(ALL), home({ ai_spend: old, users: { ...USERS, new: { today: 8, d7: 187, d30: 1030 }, per_day: undefined }, news: { mt: NEWS.mt, latest_at: NEWS.latest_at } })));

    const ai = await screen.findByRole("region", { name: "Spesa AI" });
    await within(ai).findByText("$70,99");
    expect(within(ai).queryByText("Costo medio · 30 giorni")).toBeNull();
    expect(screen.queryByRole("figure", { name: "Nuovi utenti al giorno" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Ricavi" })).toBeNull();
  });
});
