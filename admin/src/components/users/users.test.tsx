import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsersPage from "@/app/utenti/page";
import UserPageRoute from "@/app/utenti/scheda/page";
import { ApiError, type Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";
import { monthsAhead, type UserList, type UserPage } from "./model";

const nav = vi.hoisted(() => ({ pathname: "/utenti", search: "", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const ALL = ["console.users.view", "console.users.update", "console.users.plan", "console.users.export", "console.users.delete", "console.admin.view"];

function me(perms: string[], superAdmin = false): Me {
  return {
    user: { id: 1, name: "Marta Ferri", email: "marta@esempio.it" },
    role: superAdmin ? { id: 1, key: "super_admin", label: "Super amministratore" } : { id: 2, key: "Analisi", label: "Analisi" },
    permissions: perms,
    two_factor: { confirmed: true, verified: true, recovery_left: 8 },
    idle_minutes: 30,
  };
}

const LIST: UserList = {
  users: [
    { id: 41377, name: "Marco Bellini", email: "marco.bellini@posta.it", plan: "unlimited", plan_until: "2026-12-31", created_at: "2026-10-10", lang: "it" },
    { id: 50108, name: null, email: "utente.8842@icloud.example", plan: "free", plan_until: null, created_at: "2026-11-13", lang: "en" },
  ],
  total: 1495,
  page: 1,
  per_page: 25,
  last_page: 60,
  narrowed: false,
  plan_counts: { free: 1477, trial: 0, premium: 2, unlimited: 16 },
};

function userPage(over: Partial<UserPage> = {}): UserPage {
  return {
    user: {
      id: 41377, name: "Marco Bellini", email: "marco.bellini@posta.it", lang: "it", created_at: "2026-10-10", has_avatar: false, avatar_url: null,
      onboarding_completed_at: "2026-10-10", terms_accepted_at: "2026-10-10", terms_version: "3", privacy_accepted_at: "2026-10-10", privacy_version: "3",
      marketing_accepted: true, staff: false,
    },
    plan: {
      plan: "premium", until: "2026-12-03", source: "App Store", gift: null,
      store: { name: "App Store", plan: "premium", auto_renew: true, date: "2026-12-03" }, revocable: false,
    },
    history: [
      { kind: "store", id: 9, source: "App Store", plan: "premium", from: "2026-11-03", to: "2026-12-03", state: "Attivo · si rinnova", active: true, renews: true, given_by: null, given_at: null, taken_by: null, taken_at: null, reason: null, close_reason: null },
      { kind: "gift", id: 7, source: "Regalo", plan: "unlimited", from: "2026-10-15", to: "2026-10-31", state: "Revocato il 31/10/2026", active: false, renews: false, given_by: "Marta Ferri", given_at: "2026-10-15", taken_by: "Luca Bianchi", taken_at: "2026-10-31", reason: "Prova interna", close_reason: "Prova finita" },
    ],
    words: {
      paying_title: "L’utente paga ancora l’App Store",
      paying: "Ha Premium dall’App Store con il rinnovo acceso: continuerà a pagare finché non lo disdice dalle impostazioni del suo ID Apple. Il regalo non ferma il pagamento.",
      replaces: null,
      lower: { premium: null, unlimited: null },
      revoke: null,
    },
    ...over,
  };
}

type Handler = (method: string, path: string, body?: unknown, query?: unknown) => unknown;

function fakeApi(meValue: Me, handler: Handler): Api {
  const call = (method: string) =>
    vi.fn(async (path: string, arg?: unknown) => {
      if (path === "/me") return meValue;
      return handler(method, path, method === "GET" ? undefined : arg, method === "GET" ? arg : undefined);
    });
  return { get: call("GET") as Api["get"], post: call("POST") as Api["post"], put: call("PUT") as Api["put"], del: call("DELETE") as Api["del"], blob: call("BLOB") as Api["blob"] };
}

function mount(node: React.ReactNode, api: Api) {
  return render(<ConsoleProvider api={api}>{node}</ConsoleProvider>);
}

describe("Utenti list", () => {
  beforeEach(() => {
    nav.pathname = "/utenti";
    nav.push.mockReset();
  });

  it("shows the count, the rows and opens a user", async () => {
    const api = fakeApi(me(ALL, true), () => LIST);
    mount(<UsersPage />, api);
    await screen.findByText("Marco Bellini");
    expect(screen.getByText("1.495 utenti in tutto")).toBeTruthy();
    expect(screen.getByText("Senza nome")).toBeTruthy();
    expect(screen.getByText("fino al 31/12/2026")).toBeTruthy();
    expect(screen.getByText("EN")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Esporta CSV/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Nuovo utente/ })).toBeTruthy();
    fireEvent.click(screen.getByText("Marco Bellini"));
    expect(nav.push).toHaveBeenCalledWith("/utenti/scheda?id=41377");
  });

  it("the Piano filter takes several plans, with the counts, after Applica", async () => {
    const seen: unknown[] = [];
    const api = fakeApi(me(ALL, true), (_m, _p, _b, q) => {
      seen.push(q);
      return { ...LIST, narrowed: !!(q as { plans?: string }).plans, total: 18 };
    });
    mount(<UsersPage />, api);
    await screen.findByText("Marco Bellini");
    fireEvent.click(screen.getByRole("button", { name: /^Piano/ }));
    const menu = screen.getByRole("group", { name: "Piano" });
    expect(within(menu).getByText("1.477")).toBeTruthy();
    fireEvent.click(within(menu).getByLabelText(/Premium/));
    fireEvent.click(within(menu).getByLabelText(/Unlimited/));
    fireEvent.click(within(menu).getByRole("button", { name: "Applica" }));
    await screen.findByText("18 utenti corrispondono ai filtri");
    expect(seen.at(-1)).toMatchObject({ plans: "premium,unlimited", page: 1, sort: "recent" });
    expect(screen.getByRole("button", { name: /Piano: Premium, Unlimited/ })).toBeTruthy();
  });

  it("no match shows the shell's filtered state and resets", async () => {
    let narrowed = false;
    const api = fakeApi(me(ALL, true), (_m, _p, _b, q) => {
      narrowed = !!(q as { q?: string }).q;
      return narrowed ? { ...LIST, users: [], total: 0, narrowed: true } : LIST;
    });
    mount(<UsersPage />, api);
    await screen.findByText("Marco Bellini");
    fireEvent.change(screen.getByLabelText("Cerca per nome o email"), { target: { value: "nessuno" } });
    await screen.findByText("Nessun risultato con questi filtri", undefined, { timeout: 2000 });
    expect(screen.getByText("Nessun utente corrisponde ai filtri")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Togli i filtri" }));
    await screen.findByText("Marco Bellini");
  });

  it("view-only analysis: CSV yes, new user no", async () => {
    mount(<UsersPage />, fakeApi(me(["console.users.view", "console.users.export"]), () => LIST));
    await screen.findByText("Marco Bellini");
    expect(screen.getByRole("button", { name: /Esporta CSV/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Nuovo utente/ })).toBeNull();
  });

  it("support (edit and plan): new user yes, no CSV", async () => {
    mount(<UsersPage />, fakeApi(me(["console.users.view", "console.users.update", "console.users.plan"]), () => LIST));
    await screen.findByText("Marco Bellini");
    expect(screen.queryByRole("button", { name: /Esporta CSV/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Nuovo utente/ })).toBeTruthy();
  });

  it("Applica with the same plans never leaves the table loading", async () => {
    const api = fakeApi(me(ALL, true), () => LIST);
    mount(<UsersPage />, api);
    await screen.findByText("Marco Bellini");
    fireEvent.click(screen.getByRole("button", { name: /^Piano/ }));
    fireEvent.click(within(screen.getByRole("group", { name: "Piano" })).getByRole("button", { name: "Applica" }));
    expect(screen.getByText("Marco Bellini")).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Piano" })).toBeNull();
  });

  it("a slow answer for old filters never replaces the new one", async () => {
    let release: (v: UserList) => void = () => undefined;
    const api = fakeApi(me(ALL, true), (_m, _p, _b, q) => {
      if (!(q as { q?: string }).q) return new Promise<UserList>((r) => (release = r));
      return { ...LIST, users: [LIST.users[1]], total: 1, narrowed: true };
    });
    mount(<UsersPage />, api);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/users", expect.anything()));
    fireEvent.change(screen.getByLabelText("Cerca per nome o email"), { target: { value: "utente" } });
    await screen.findByText("1 utente corrisponde ai filtri", undefined, { timeout: 2000 });
    await act(async () => release(LIST));
    expect(screen.queryByText("Marco Bellini")).toBeNull();
  });

  it("Nuovo utente shows a taken e-mail on its field and opens the new page", async () => {
    let taken = true;
    mount(<UsersPage />, fakeApi(me(ALL, true), (m) => {
      if (m === "POST") {
        if (taken) throw new ApiError(422, "email_taken");
        return { id: 50200 };
      }
      return LIST;
    }));
    await screen.findByText("Marco Bellini");
    fireEvent.click(screen.getByRole("button", { name: /Nuovo utente/ }));
    const dialog = screen.getByRole("dialog");
    const go = within(dialog).getByRole("button", { name: "Crea utente" }) as HTMLButtonElement;
    fireEvent.change(within(dialog).getByLabelText(/^Email/), { target: { value: "carla@esempio.it" } });
    fireEvent.change(within(dialog).getByLabelText(/Password temporanea/), { target: { value: "corta" } });
    expect(go.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/Password temporanea/), { target: { value: "Secret-pass-12!" } });
    await act(async () => fireEvent.click(go));
    await within(dialog).findByText("Questa email è già usata da un altro account.");
    taken = false;
    await act(async () => fireEvent.click(go));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/utenti/scheda?id=50200"));
  });

  it("the CSV dialog says what goes in the file and downloads through api.blob", async () => {
    const blob = vi.fn(async () => new Blob(["x"]));
    const api = fakeApi(me(ALL, true), () => LIST);
    api.blob = blob as Api["blob"];
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    mount(<UsersPage />, api);
    await screen.findByText("Marco Bellini");
    fireEvent.click(screen.getByRole("button", { name: /Esporta CSV/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Il file contiene i 1.495 utenti dell’elenco.")).toBeTruthy();
    expect(within(dialog).getByText("Colonne: Email, Nome, Piano, Scadenza piano, Data di registrazione.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: /Scarica CSV/ }));
    await screen.findByText("File scaricato");
    expect(blob).toHaveBeenCalledWith("/users.csv", { plans: "", q: "" });
  });

  it("an error offers Riprova", async () => {
    let fail = true;
    const api = fakeApi(me(ALL, true), () => {
      if (fail) throw new ApiError(500, null);
      return LIST;
    });
    mount(<UsersPage />, api);
    await screen.findByText("Non è stato possibile caricare gli utenti");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await screen.findByText("Marco Bellini");
  });
});

describe("User page", () => {
  beforeEach(() => {
    nav.pathname = "/utenti/scheda";
    nav.search = "id=41377";
    nav.push.mockReset();
  });

  it("reads first: plan, store, history with who and why, consents", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL, true), () => userPage()));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    expect(screen.getByText("Abbonamento dello store")).toBeTruthy();
    expect(screen.getByText("Prossimo rinnovo")).toBeTruthy();
    expect(screen.getByText("Dato da Marta Ferri · 15/10/2026 · Tolto da Luca Bianchi · 31/10/2026")).toBeTruthy();
    expect(screen.getByText("«Prova interna»")).toBeTruthy();
    expect(screen.getByText("«Prova finita»")).toBeTruthy();
    expect(screen.getByText("Accettati il 10/10/2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Regala piano/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Revoca regalo/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Elimina account/ })).toBeTruthy();
    expect(screen.queryByText(/Ultimo accesso/)).toBeNull();
  });

  it("view only: the banner, no actions", async () => {
    mount(<UserPageRoute />, fakeApi(me(["console.users.view", "console.users.export"]), () => userPage()));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    expect(screen.getByText(/Puoi solo vedere/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Regala piano/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Modifica/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Elimina account/ })).toBeNull();
  });

  it("a missing user is «Utente non trovato» with the way back", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL, true), () => {
      throw new ApiError(404, null);
    }));
    await screen.findByRole("heading", { name: "Utente non trovato" });
    expect(screen.getByRole("link", { name: "Torna agli utenti" }).getAttribute("href")).toBe("/utenti");
  });

  it("Regala stays off until the form is complete, warns about the store, then saves", async () => {
    const after = userPage({
      plan: { ...userPage().plan, plan: "unlimited", source: "Regalo (sopra l’App Store)", revocable: true, gift: { plan: "unlimited", until: "2027-02-14", by: "Marta Ferri", at: "2026-11-14" } },
    });
    const posts: unknown[] = [];
    mount(<UserPageRoute />, fakeApi(me(ALL, true), (m, _p, body) => {
      if (m === "POST") {
        posts.push(body);
        return after;
      }
      return userPage();
    }));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Regala piano/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("L’utente paga ancora l’App Store")).toBeTruthy();
    const go = within(dialog).getByRole("button", { name: /^Regala$/ });
    expect((go as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(within(dialog).getByRole("radio", { name: /Unlimited/ }));
    fireEvent.change(within(dialog).getByLabelText(/Scadenza/), { target: { value: "01/01/2020" } });
    fireEvent.blur(within(dialog).getByLabelText(/Scadenza/));
    expect(within(dialog).getByText("La scadenza deve essere dopo oggi.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "3 mesi" }));
    fireEvent.change(within(dialog).getByLabelText(/Motivo/), { target: { value: "Ambassador" } });
    expect((go as HTMLButtonElement).disabled).toBe(false);
    await act(async () => fireEvent.click(go));
    await screen.findByText("Piano regalato");
    const [d, mo, y] = monthsAhead(3).split("/");
    expect(posts[0]).toEqual({ tier: "unlimited", until: `${y}-${mo}-${d}`, reason: "Ambassador" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: /Revoca regalo/ })).toBeTruthy();
  });

  it("a failed gift stays in the dialog and says the plan did not change", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL, true), (m) => {
      if (m === "POST") throw new ApiError(500, null);
      return userPage();
    }));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Regala piano/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("radio", { name: /Premium/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "1 anno" }));
    fireEvent.change(within(dialog).getByLabelText(/Motivo/), { target: { value: "x" } });
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: /^Regala$/ })));
    await within(dialog).findByText("Riprova. Il piano dell’utente non è cambiato.");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("revoke asks for a reason and shows where the user goes back to", async () => {
    const gifted = userPage({ plan: { ...userPage().plan, revocable: true }, words: { ...userPage().words, revoke: "Toglie Unlimited regalato (fino al 31/12/2026). L’utente torna Free." } });
    mount(<UserPageRoute />, fakeApi(me(ALL, true), (m) => (m === "POST" ? { ...userPage(), message: "Ora l’utente è Free." } : gifted)));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Revoca regalo/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Toglie Unlimited regalato (fino al 31/12/2026). L’utente torna Free.")).toBeTruthy();
    const go = within(dialog).getByRole("button", { name: "Revoca" });
    expect((go as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/Motivo/), { target: { value: "Fine" } });
    await act(async () => fireEvent.click(go));
    await screen.findByText("Ora l’utente è Free.");
  });

  it("delete needs the user's e-mail typed and warns about the store", async () => {
    const calls: [string, string, unknown][] = [];
    mount(<UserPageRoute />, fakeApi(me(ALL, true), (m, p, body) => {
      calls.push([m, p, body]);
      return m === "POST" ? null : userPage();
    }));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Elimina account/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Ha un abbonamento App Store attivo")).toBeTruthy();
    const go = within(dialog).getByRole("button", { name: "Elimina account" });
    fireEvent.change(within(dialog).getByLabelText(/scrivi l’email/), { target: { value: "altro@esempio.it" } });
    fireEvent.blur(within(dialog).getByLabelText(/scrivi l’email/));
    expect(within(dialog).getByText("L’email non corrisponde.")).toBeTruthy();
    expect((go as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/scrivi l’email/), { target: { value: "Marco.Bellini@posta.it" } });
    await act(async () => fireEvent.click(go));
    await screen.findByText("Account eliminato");
    expect(calls.find(([m]) => m === "POST")).toEqual(["POST", "/users/41377/delete", { confirm_email: "Marco.Bellini@posta.it" }]);
    expect(nav.push).toHaveBeenCalledWith("/utenti");
  });

  it("a revoke someone already did closes the dialog and shows the page as it is", async () => {
    const gifted = userPage({ plan: { ...userPage().plan, revocable: true }, words: { ...userPage().words, revoke: "Toglie Premium regalato." } });
    let gets = 0;
    mount(<UserPageRoute />, fakeApi(me(ALL, true), (m) => {
      if (m === "POST") throw new ApiError(409, "not_revocable");
      gets++;
      return gets === 1 ? gifted : userPage();
    }));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Revoca regalo/ }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/Motivo/), { target: { value: "x" } });
    await act(async () => fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Revoca" })));
    await screen.findByText("Il regalo era già stato revocato");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("button", { name: /Revoca regalo/ })).toBeNull();
  });

  it("the super admin gives console access from Modifica through the people API", async () => {
    const calls: [string, string, unknown][] = [];
    mount(<UserPageRoute />, fakeApi(me(ALL, true), (m, p, body) => {
      calls.push([m, p, body]);
      if (p === "/roles") return { roles: [{ id: 5, name: "Assistenza", locked: false }] };
      if (m === "PUT") return userPage();
      if (m === "POST") return {};
      return userPage({ access: null });
    }));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Modifica/ }));
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByRole("option", { name: "Assistenza" });
    fireEvent.change(within(dialog).getByLabelText("Accesso al pannello"), { target: { value: "5" } });
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Salva" })));
    await screen.findByText("Modifiche salvate");
    expect(calls).toContainEqual(["POST", "/people", { email: "marco.bellini@posta.it", role_id: 5 }]);
  });

  it("Togli immagine updates the page at once", async () => {
    const withPic = userPage({ user: { ...userPage().user, has_avatar: true, avatar_url: "https://example.com/a.png" } });
    mount(<UserPageRoute />, fakeApi(me(ALL), (m) => (m === "DELETE" ? userPage() : withPic)));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    expect(document.querySelector('img[src="https://example.com/a.png"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Modifica/ }));
    await act(async () => fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Togli immagine/ })));
    await waitFor(() => expect(document.querySelector('img[src="https://example.com/a.png"]')).toBeNull());
  });

  it("a staff account cannot be deleted from here", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL, true), () => userPage({ user: { ...userPage().user, staff: true } })));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    expect(screen.queryByRole("button", { name: /Elimina account/ })).toBeNull();
  });

  it("edit shows a taken e-mail inline and never a password field", async () => {
    mount(<UserPageRoute />, fakeApi(me(ALL), (m) => {
      if (m === "PUT") throw new ApiError(422, "email_taken");
      return userPage();
    }));
    await screen.findByRole("heading", { name: "Marco Bellini" });
    fireEvent.click(screen.getByRole("button", { name: /Modifica/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText(/Password/)).toBeNull();
    expect(within(dialog).queryByLabelText("Accesso al pannello")).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Email"), { target: { value: "preso@esempio.it" } });
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Salva" })));
    await within(dialog).findByText("Questa email è già usata da un altro account.");
  });
});
