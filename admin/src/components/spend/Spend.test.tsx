// MOB-1461 (D444, design finzygit/finzy#750): «Spesa AI» (Riepilogo, cost per
// day by type, generations per type) and «Salute dei servizi» (Fonti dati).
// Numbers: production 16 Nov 10:44; the calls per source are made up.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HealthPage from "@/app/health/page";
import SpendPage from "@/app/spend/page";
import type { Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";
import type { HealthData, SpendData } from "./types";

const nav = vi.hoisted(() => ({ pathname: "/spend", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const ME: Me = {
  user: { id: 3, name: "Giulia Conti", email: "g.conti@esempio.it" },
  role: { id: 1, key: "super_admin", label: "Super admin" },
  permissions: ["console.home.view", "console.spend.view"],
  two_factor: { confirmed: true, verified: true, recovery_left: 8 },
  idle_minutes: 30,
};

const g = (u: [number, number, number, number], spend30: number, cost: number | null) => ({ units: { today: u[0], d7: u[1], d30: u[2], all: u[3] }, spend: { today: 0, d7: 0, d30: spend30, all: 0 }, unit_cost_30: cost });
const day = (i: number) => `2026-${i < 14 ? "10" : "11"}-${String(i < 14 ? 18 + i : i - 13).padStart(2, "0")}`;
const SPEND: SpendData = {
  period: { generated_at: "2026-11-16T10:44:00+01:00" },
  summary: { today: 7.64, d7: 70.99, d30: 335.25, d7_from: "2026-11-10", d30_from: "2026-10-18", generations_30: 11724, lines_spend_30: 329.16, unit_cost_30: 329.16 / 11724 },
  per_day: Array.from({ length: 30 }, (_, i) => ({ day: day(i), images: 9.5, articles: 3, stock_snapshot: 0, financial_report: i === 20 ? 11.51 : 0, other: 0.2 })),
  generations: {
    images: g([149, 1227, 5772, 22065], 225.11, 0.039),
    articles: g([149, 1294, 5829, 28331], 76.25, 0.01308),
    stock_snapshot: g([0, 1, 1, 6], 0.14, 0.14),
    financial_report: g([0, 1, 122, 227], 27.66, 0.2267),
  },
  generations_since: "2026-06-11",
};
const src = (key: string, requests: number, failed: number, last: string | null, status: "ok" | "warn" = "ok", reason: "failed_share" | "source_check" | null = null) => ({ key, requests, failed, last_at: last, status, reason });
const HEALTH: HealthData = {
  checked_at: "2026-11-16T10:44:00+01:00",
  sources: {
    counting_since: "2026-11-12",
    items: [
      src("twelve_data", 1286, 212, "2026-11-16T10:43:00+01:00", "warn", "failed_share"),
      src("mt_newswires", 22, 0, "2026-11-16T10:05:00+01:00"),
      src("benzinga", 64, 0, "2026-11-16T09:30:00+01:00"),
      src("adnkronos", 0, 0, null),
    ],
  },
};

function api(answers: Record<string, (SpendData | HealthData | Error)[]>): Api & { get: ReturnType<typeof vi.fn> } {
  const queues = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, [...v]]));
  return {
    get: vi.fn(async (path: string) => {
      if (path === "/me") return ME;
      const q = queues[path];
      if (!q) throw new Error(`unexpected ${path}`);
      const a = q.length > 1 ? q.shift() : q[0];
      if (a instanceof Error) throw a;
      return a;
    }),
    post: vi.fn() as Api["post"],
    put: vi.fn() as Api["put"],
    del: vi.fn(async () => null) as Api["del"],
    blob: vi.fn() as Api["blob"],
  } as Api & { get: ReturnType<typeof vi.fn> };
}

describe("Spesa AI additions (MOB-1461)", () => {
  beforeEach(() => {
    nav.pathname = "/spend";
  });

  it("shows the Riepilogo, the cost by type and the generations, with the same totals", async () => {
    render(
      <ConsoleProvider api={api({ "/ai-spend?period=d30": [SPEND] })}>
        <SpendPage />
      </ConsoleProvider>,
    );

    const sum = await screen.findByRole("region", { name: "Riepilogo" });
    expect(within(sum).getByText("$7,64")).toBeTruthy();
    expect(within(sum).getByText("$335,25")).toBeTruthy();
    expect(within(sum).getByText("18 ott–16 nov")).toBeTruthy();
    expect(within(sum).getByText("$0,0281")).toBeTruthy();
    expect(within(sum).getByText("Ultimi 30 giorni, solo le quattro voci: $329,16 su 11.724 generazioni")).toBeTruthy();

    const chart = screen.getByRole("figure", { name: "Costo al giorno per tipo" });
    expect(within(chart).getAllByRole("listitem")).toHaveLength(30);

    const gens = screen.getByRole("region", { name: "Generazioni per tipo" });
    const rows = within(gens).getAllByRole("row");
    expect(rows).toHaveLength(6); // head, four types, Totale
    expect(within(rows[1]).getByText("22.065")).toBeTruthy();
    expect(within(rows[1]).getByText("$0,0390")).toBeTruthy();
    expect(within(rows[5]).getByText("11.724")).toBeTruthy();
    expect(within(rows[5]).getByText("$329,16")).toBeTruthy();
    expect(within(gens).getByText(/dal primo giorno registrato \(11 giugno 2026\)/)).toBeTruthy();
  });

  it("an empty month says so and shows «—» for the average", async () => {
    const zero = { units: { today: 0, d7: 0, d30: 0, all: 0 }, spend: { today: 0, d7: 0, d30: 0, all: 0 }, unit_cost_30: null };
    const empty: SpendData = {
      period: SPEND.period,
      summary: { ...SPEND.summary, today: 0, d7: 0, d30: 0, generations_30: 0, lines_spend_30: 0, unit_cost_30: null },
      per_day: SPEND.per_day.map((d) => ({ ...d, images: 0, articles: 0, financial_report: 0, other: 0 })),
      generations: { images: zero, articles: zero, stock_snapshot: zero, financial_report: zero },
      generations_since: null,
    };
    render(
      <ConsoleProvider api={api({ "/ai-spend?period=d30": [empty] })}>
        <SpendPage />
      </ConsoleProvider>,
    );

    expect(await screen.findByText("Nessuna spesa negli ultimi 30 giorni")).toBeTruthy();
    expect(screen.getByText("nessuna generazione in 30 giorni")).toBeTruthy();
  });

  it("a page that does not load says so with Riprova, which reads again", async () => {
    const a = api({ "/ai-spend?period=d30": [new Error("500"), SPEND] });
    render(
      <ConsoleProvider api={a}>
        <SpendPage />
      </ConsoleProvider>,
    );

    expect(await screen.findByText("Non è stato possibile caricare i costi AI")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(await screen.findByRole("region", { name: "Riepilogo" })).toBeTruthy();
  });
});

describe("Fonti dati (MOB-1461)", () => {
  beforeEach(() => {
    nav.pathname = "/health";
  });

  it("lists the four sources with today's calls, failures, last call and state", async () => {
    render(
      <ConsoleProvider api={api({ "/health": [HEALTH] })}>
        <HealthPage />
      </ConsoleProvider>,
    );

    const card = await screen.findByRole("region", { name: "Fonti dati" });
    const items = within(card).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(within(items[0]).getByText("Twelve Data")).toBeTruthy();
    expect(within(items[0]).getByText("1.286")).toBeTruthy();
    expect(within(items[0]).getByText("212 fallite")).toBeTruthy();
    expect(within(items[0]).getByText("Da guardare")).toBeTruthy();
    expect(within(items[0]).getByText("Oltre il 5 % delle chiamate di oggi è fallito")).toBeTruthy();
    expect(within(items[1]).getByText("Regolare")).toBeTruthy();
    expect(within(items[1]).getByText("Ultima alle 10:05")).toBeTruthy();
    expect(within(items[3]).getByText("Nessuna chiamata oggi")).toBeTruthy();
    expect(within(card).getByText(/Conteggio attivo dal giorno 12 novembre 2026/)).toBeTruthy();
  });

  it("a failing sources read says «Dato non disponibile.» on the card only", async () => {
    render(
      <ConsoleProvider api={api({ "/health": [{ ...HEALTH, sources: null } as unknown as HealthData] })}>
        <HealthPage />
      </ConsoleProvider>,
    );

    const card = await screen.findByRole("region", { name: "Fonti dati" });
    expect(within(card).getByText("Dato non disponibile.")).toBeTruthy();
  });
});
