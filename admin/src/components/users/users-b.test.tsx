import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsersPage from "@/app/users/page";
import UserPageRoute from "@/app/users/detail/page";
import { ApiError, type Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";
import type { UserList, UserPage, UsersSummary } from "./model";

// MOB-1462 (D444, design PR #751): the Utenti numbers, the «solo abbonati»
// donuts, the new columns and filters, and «Sospendi» / «Riattiva».

const nav = vi.hoisted(() => ({ pathname: "/users", search: "id=41377", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const ALL = ["console.users.view", "console.users.update", "console.users.plan", "console.users.export", "console.users.delete", "console.users.suspend", "console.admin.view"];

function me(perms: string[], id = 1): Me {
  return {
    user: { id, name: "Marta Ferri", email: "marta@esempio.it" },
    role: { id: 1, key: "super_admin", label: "Super amministratore" },
    permissions: perms,
    two_factor: { confirmed: true, verified: true, recovery_left: 8 },
    idle_minutes: 30,
  };
}

const NOW_ISO = new Date().toISOString();

const LIST: UserList = {
  users: [
    {
      id: 41377, name: "Marco Bellini", email: "marco.bellini@posta.it", plan: "unlimited", plan_until: "2026-12-31", created_at: "2026-10-10", lang: "it",
      terms_accepted_at: "2026-10-11", privacy_accepted_at: "2026-10-12", last_access_at: NOW_ISO,
      generations_30d: { total: 5, snapshot: 4, report: 1, portal: 0 }, suspended_at: null,
    },
    {
      id: 50108, name: "Davide Costa", email: "davide.costa@posta.it", plan: "free", plan_until: null, created_at: "2026-11-10", lang: "it",
      terms_accepted_at: null, privacy_accepted_at: null, last_access_at: null,
      generations_30d: { total: 0, snapshot: 0, report: 0, portal: 0 }, suspended_at: "2026-11-16",
    },
  ],
  total: 1490,
  page: 1,
  per_page: 25,
  last_page: 60,
  narrowed: false,
  plan_counts: { free: 1471, trial: 1, premium: 2, unlimited: 16 },
};

const SUMMARY: UsersSummary = {
  total: 1490,
  paying: { count: 6, pct: 0.4 },
  free: { count: 1471, pct: 98.7 },
  gifts_active: 13,
  gifts_by_tier: { premium: 1, unlimited: 12 },
  suspended: 2,
  conversions_90d: { total: 5, premium: 1, unlimited: 4 },
  segments: {
    platform: [{ key: "app_store", count: 4 }, { key: "play_store", count: 1 }, { key: "web", count: 1 }],
    country: [{ code: "IT", count: 3 }, { code: "PT", count: 1 }, { code: "GB", count: 1 }, { code: null, count: 1 }],
  },
  links: [{ label: "AppsFlyer", url: "https://hq1.appsflyer.com/x" }, { label: "Mixpanel", url: "https://eu.mixpanel.com/x" }],
};

function userPage(over: Partial<UserPage> = {}, user: Partial<UserPage["user"]> = {}): UserPage {
  return {
    user: {
      id: 41377, name: "Marco Bellini", email: "marco.bellini@posta.it", lang: "it", created_at: "2026-10-10", has_avatar: false, avatar_url: null,
      onboarding_completed_at: "2026-10-10", terms_accepted_at: "2026-10-10", terms_version: "3", privacy_accepted_at: "2026-10-10", privacy_version: "3",
      marketing_accepted: true, staff: false, last_access_at: null, generations_30d: { total: 5, snapshot: 4, report: 1, portal: 0 }, suspended_at: null,
      ...user,
    },
    plan: { plan: "premium", until: "2026-12-03", source: "App Store", gift: null, store: { name: "App Store", plan: "premium", auto_renew: true, date: "2026-12-03" }, revocable: false },
    history: [],
    words: { paying_title: null, paying: null, replaces: null, lower: { premium: null, unlimited: null }, revoke: null },
    suspension: null,
    ...over,
  };
}

const SUSPENDED = (): UserPage =>
  userPage({ suspension: { at: "2026-11-16", by: "Marta Ferri", reason: "Account condiviso con altre persone" } }, { suspended_at: "2026-11-16" });

type Handler = (method: string, path: string, body?: unknown, query?: unknown) => unknown;

function fakeApi(meValue: Me, handler: Handler): Api {
  const call = (method: string) =>
    vi.fn(async (path: string, arg?: unknown) => {
      if (path === "/me") return meValue;
      return handler(method, path, method === "GET" ? undefined : arg, method === "GET" ? arg : undefined);
    });
  return { get: call("GET") as Api["get"], post: call("POST") as Api["post"], put: call("PUT") as Api["put"], del: call("DELETE") as Api["del"], blob: call("BLOB") as Api["blob"] };
}

const mount = (node: React.ReactNode, api: Api) => render(<ConsoleProvider api={api}>{node}</ConsoleProvider>);

const listApi = (seen: unknown[] = [], summary: unknown = SUMMARY) =>
  fakeApi(me(ALL), (_m, path, _b, q) => {
    if (path === "/users/summary") {
      if (summary instanceof Error) throw summary;
      return summary;
    }
    seen.push(q);
    return LIST;
  });

describe("Utenti list · numbers, donuts, columns (MOB-1462)", () => {
  beforeEach(() => {
    nav.pathname = "/users";
    nav.push.mockReset();
  });

  it("shows the four numbers with their share, the two «solo abbonati» donuts and the analytics links", async () => {
    mount(<UsersPage />, listApi());
    await screen.findByText("Marco Bellini");
    await screen.findByText("0,4% del totale");
    const paying = document.querySelector('[data-tile="Paganti"]') as HTMLElement;
    expect(within(paying).getByText("6")).toBeTruthy();
    expect(within(paying).getByText("0,4% del totale")).toBeTruthy();
    expect(screen.getByText("98,7% del totale")).toBeTruthy();
    expect(screen.getByText("Premium 1 · Unlimited 12")).toBeTruthy();
    expect(screen.getByText("Premium 1 · Unlimited 4")).toBeTruthy();

    const platform = screen.getByRole("region", { name: "Abbonati per piattaforma" });
    expect(within(platform).getByText("solo abbonati")).toBeTruthy();
    expect(within(platform).getByText("App Store")).toBeTruthy();
    expect(within(platform).getByText("67%")).toBeTruthy();
    const country = screen.getByRole("region", { name: "Abbonati per Paese" });
    expect(within(country).getByText("Italia")).toBeTruthy();
    expect(within(country).getByText("Non noto")).toBeTruthy();
    expect(screen.getByRole("link", { name: "AppsFlyer" }).getAttribute("href")).toBe("https://hq1.appsflyer.com/x");
    expect(screen.getByRole("link", { name: "Mixpanel" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Definizioni" })).toBeTruthy();
    expect(screen.getByText(/primo abbonamento pagato negli ultimi 90 giorni/)).toBeTruthy();
  });

  it("rows carry last access, consents, generations with their split, and the «Sospeso» pill", async () => {
    mount(<UsersPage />, listApi());
    await screen.findByText("Marco Bellini");
    expect(screen.getByRole("columnheader", { name: "Ultimo accesso" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Termini accettati" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Privacy accettata" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Generazioni 30 gg" })).toBeTruthy();
    expect(screen.getByText(/^Oggi, \d\d:\d\d$/)).toBeTruthy();
    expect(screen.getByText("11/10/2026")).toBeTruthy();
    expect(screen.getByText("12/10/2026")).toBeTruthy();
    expect(screen.getByTitle("Snapshot 4 · Report 1 · Portale 0").textContent).toBe("5");
    const davide = screen.getByText("Davide Costa").closest("tr") as HTMLElement;
    expect(within(davide).getByText("Sospeso")).toBeTruthy();
    expect(within(davide).getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("«Con omaggio», «Mostra» and «2 sospesi» filter the list and reset clears them", async () => {
    const seen: unknown[] = [];
    mount(<UsersPage />, listApi(seen));
    await screen.findByText("Marco Bellini");

    fireEvent.click(screen.getByRole("button", { name: /Con omaggio/ }));
    await waitFor(() => expect(seen.at(-1)).toMatchObject({ gift: 1, page: 1 }));
    expect(screen.getByRole("button", { name: /Con omaggio/ }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "2 sospesi" }));
    await waitFor(() => expect(seen.at(-1)).toMatchObject({ gift: 1, suspended: 1 }));
    expect(screen.getByRole("button", { name: "Togli il filtro Stato: Sospesi" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reimposta i filtri" }));
    await waitFor(() => expect(seen.at(-1)).not.toHaveProperty("gift"));
    expect(seen.at(-1)).not.toHaveProperty("suspended");

    fireEvent.click(screen.getByRole("button", { name: /Mostra/ }));
    await waitFor(() => expect(seen.at(-1)).toMatchObject({ gift: 1 }));
  });

  it("a failed summary says «Non disponibile» and leaves the list working", async () => {
    mount(<UsersPage />, listApi([], new ApiError(500, null)));
    await screen.findByText("Marco Bellini");
    await waitFor(() => expect(screen.getAllByText("Non disponibile").length).toBe(4));
    expect(screen.queryByRole("region", { name: "Abbonati per Paese" })).toBeNull();
  });

  it("no paying user: the donuts say so", async () => {
    mount(<UsersPage />, listApi([], { ...SUMMARY, paying: { count: 0, pct: 0 }, segments: { platform: [], country: [] } }));
    await screen.findByText("Marco Bellini");
    expect((await screen.findAllByText("Ancora nessun abbonato")).length).toBe(2);
  });
});

describe("User page · Sospendi / Riattiva (MOB-1462)", () => {
  beforeEach(() => {
    nav.pathname = "/users/detail";
    nav.search = "id=41377";
  });

  it("shows last access and generations in the fact strip", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL), () => userPage()));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    expect(screen.getByText("Generazioni 30 gg")).toBeTruthy();
    expect(screen.getByText("Snapshot 4 · Report 1 · Portale 0")).toBeTruthy();
  });

  it("suspends with a reason, warns about the store renewal, then shows the strip", async () => {
    const posts: unknown[] = [];
    const api = fakeApi(me(ALL), (m, path, body) => {
      if (m === "POST" && path === "/users/41377/suspend") {
        posts.push(body);
        return SUSPENDED();
      }
      return userPage();
    });
    mount(<UserPageRoute />, api);
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Sospendi utente/ }));

    const dialog = screen.getByRole("dialog", { name: "Sospendere l’utente?" });
    expect(within(dialog).getByText("marco.bellini@posta.it")).toBeTruthy();
    expect(within(dialog).getByText("L’abbonamento dello store non si ferma")).toBeTruthy();
    expect(within(dialog).getByText(/Ha Premium dall’App Store con il rinnovo acceso/)).toBeTruthy();
    const go = within(dialog).getByRole("button", { name: /Sospendi/ }) as HTMLButtonElement;
    expect(go.disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText(/Motivo/), { target: { value: "Account condiviso con altre persone" } });
    expect(within(dialog).getByText("35/500")).toBeTruthy();
    fireEvent.click(go);

    await screen.findByText("Sospeso dal 16/11/2026 da Marta Ferri");
    expect(posts).toEqual([{ reason: "Account condiviso con altre persone" }]);
    expect(screen.getByText("«Account condiviso con altre persone»")).toBeTruthy();
    expect(screen.getByText("Utente sospeso")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a failed suspension keeps the dialog open and says the user can still sign in", async () => {
    const api = fakeApi(me(ALL), (m) => {
      if (m === "POST") throw new ApiError(500, null);
      return userPage({}, {});
    });
    mount(<UserPageRoute />, api);
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Sospendi utente/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Motivo/), { target: { value: "x" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Sospendi/ }));
    await within(dialog).findByText("Riprova. L’utente può ancora accedere.");
  });

  it("a suspended page shows the strip and «Riattiva» lifts it", async () => {
    let suspended = true;
    const api = fakeApi(me(ALL), (m, path) => {
      if (m === "POST" && path === "/users/41377/reactivate") {
        suspended = false;
        return userPage();
      }
      return suspended ? SUSPENDED() : userPage();
    });
    mount(<UserPageRoute />, api);
    await screen.findByText("Sospeso dal 16/11/2026 da Marta Ferri");
    expect(screen.getAllByText("Sospeso").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /^Riattiva$/ }));
    const dialog = screen.getByRole("dialog", { name: "Riattivare l’utente?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Riattiva" }));
    await screen.findByText("Utente riattivato");
    expect(screen.queryByText(/Sospeso dal/)).toBeNull();
  });

  it("a staff account and your own cannot be suspended; without the permission there is no action", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL), () => userPage({}, { staff: true })));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    expect((screen.getByRole("menuitem", { name: /Sospendi utente/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Ha accesso al pannello: prima togli l’accesso da Persone con accesso.")).toBeTruthy();
  });

  it("your own account", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL, 41377), () => userPage()));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    expect((screen.getByRole("menuitem", { name: /Sospendi utente/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Non puoi sospendere il tuo account.")).toBeTruthy();
  });

  it("without console.users.suspend: no menu item, and a suspended page says how to reactivate", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL.filter((p) => p !== "console.users.suspend")), () => SUSPENDED()));
    await screen.findByText("Sospeso dal 16/11/2026 da Marta Ferri");
    expect(screen.queryByRole("button", { name: /^Riattiva$/ })).toBeNull();
    expect(screen.getByText("Puoi solo vedere: per riattivare serve «Utenti · Sospendi e riattiva».")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    expect(screen.queryByRole("menuitem", { name: /Sospendi utente|Riattiva utente/ })).toBeNull();
  });
});
