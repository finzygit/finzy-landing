import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { bodyOf, checkStep, PromotionEditor, stepOf } from "./PromotionEditor";
import { ALL, fakeApi, invalid, withConsole } from "./testkit";
import { emptyDraft, type PromoDetail } from "./types";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/promotions",
  useRouter: () => ({ replace: vi.fn(), push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

function detail(over: Partial<PromoDetail> = {}): PromoDetail {
  return {
    id: 2,
    name: "Black Friday",
    code: "BLACKFRIDAY",
    starts_at: "2026-11-27T00:00:00+01:00",
    ends_at: "2026-11-30T23:59:59+01:00",
    countries: ["IT", "GB"],
    statuses: ["trial", "free", "premium"],
    formulas_on: ["quarterly", "annual"],
    state: "active",
    formulas: {
      quarterly: { enabled: true, prices: { IT: "5.99", GB: "4.99" }, apple_offer_id: "promo_unlimited_3m_bf26", apple_offer_code: "BLACKFRIDAY3", google_offer_id: "bf26-3m" },
      annual: { enabled: true, prices: { IT: "4.99", GB: "4.09" }, apple_offer_id: "promo_unlimited_12m_bf26", apple_offer_code: "BLACKFRIDAY12", google_offer_id: "bf26-12m" },
    },
    totals: {},
    history: { created: { by: "Marta Ferri", at: "2026-11-20T10:12:00+01:00" }, updated: { by: "Luca Neri", at: "2026-11-26T17:40:00+01:00" } },
    ...over,
  };
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("PromotionEditor · new", () => {
  beforeEach(() => nav.push.mockReset());

  it("step 1 refuses empty fields with the server's words", async () => {
    withConsole(fakeApi({}), <PromotionEditor mode={{ kind: "new" }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Avanti" }));

    expect(screen.getByText("Indica il nome.")).toBeTruthy();
    expect(screen.getByText("Indica il codice.")).toBeTruthy();
    expect(screen.getByText("Scegli almeno un paese.")).toBeTruthy();
    expect(screen.getByText("Correggi i campi segnati per andare avanti.")).toBeTruthy();
  });

  it("walks the four steps with live totals and the preview, then creates", async () => {
    const api = fakeApi({ post: (_p, body) => ({ ...detail(), ...(body as object), id: 9, state: "scheduled", starts_at: "2027-01-02T00:00:00+01:00" }) });
    withConsole(api, <PromotionEditor mode={{ kind: "new" }} />);
    await screen.findByRole("button", { name: "Avanti" });

    type("Nome", "Saldi di gennaio");
    type("Codice", "saldi");
    type("Inizio", "2027-01-02T00:00");
    type("Fine", "2027-01-15T23:59");
    fireEvent.click(screen.getByRole("checkbox", { name: "Italia" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Free" }));
    expect((screen.getByLabelText("Codice") as HTMLInputElement).value).toBe("SALDI");
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));

    fireEvent.click(screen.getByRole("switch", { name: "Formula trimestrale · 3 mesi" }));
    type("Prezzo mensile Italia", "6,99");
    expect(screen.getAllByText("€ 20,97").length).toBe(2); // the total under the field and the preview tile
    const preview = screen.getByRole("complementary", { name: "Anteprima nell’app" });
    expect(within(preview).getByText("Saldi di gennaio")).toBeTruthy();
    expect(within(preview).getByText("€ 6,99/mese")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));

    type("App Store · ID dell’offerta promozionale", "promo_unlimited_3m_saldi27");
    type("Google Play · ID dell’offerta", "saldi27-3m");
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));

    expect(screen.getByText("€ 6,99/mese → totale € 20,97")).toBeTruthy();
    expect(screen.getByText("promo_unlimited_3m_saldi27 · codice SALDI")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Crea promozione" }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const body = api.post.mock.calls[0][1] as ReturnType<typeof bodyOf>;
    expect(body.code).toBe("SALDI");
    expect((body.formulas.quarterly as { prices: Record<string, string> }).prices).toEqual({ IT: "6.99" });
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/promotions"));
  });

  it("server errors go back to their step and sit on their field", async () => {
    const api = fakeApi({ post: () => { throw invalid({ "formulas.quarterly.prices.IT": "Indica il prezzo mensile per l’Italia: il paese è fra i destinatari.", code: "Il codice NATALE è già usato da un’altra promozione." }); } });
    withConsole(api, <PromotionEditor mode={{ kind: "new" }} />);
    await screen.findByRole("button", { name: "Avanti" });
    type("Nome", "Natale");
    type("Codice", "NATALE");
    type("Inizio", "2026-12-14T00:00");
    type("Fine", "2026-12-26T23:59");
    fireEvent.click(screen.getByRole("checkbox", { name: "Italia" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Free" }));
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    fireEvent.click(screen.getByRole("switch", { name: "Formula annuale · 12 mesi" }));
    type("Prezzo mensile Italia", "5,49");
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    type("App Store · ID dell’offerta promozionale", "a");
    type("Google Play · ID dell’offerta", "g");
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    fireEvent.click(screen.getByRole("button", { name: "Crea promozione" }));

    expect(await screen.findByText("Il codice NATALE è già usato da un’altra promozione.")).toBeTruthy();
    expect(screen.getByLabelText("Codice").getAttribute("aria-invalid")).toBe("true");
  });

  it("leaving with changes asks first", async () => {
    withConsole(fakeApi({}), <PromotionEditor mode={{ kind: "new" }} />);
    await screen.findByRole("button", { name: "Avanti" });
    type("Nome", "Prova");
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));

    expect(screen.getByText("Uscire senza salvare?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Esci senza salvare" }));
    expect(nav.push).toHaveBeenCalledWith("/promotions");
  });
});

describe("PromotionEditor · existing", () => {
  beforeEach(() => nav.push.mockReset());

  it("a running promotion only moves its end (decision 4)", async () => {
    const api = fakeApi({ get: () => detail({ countries: ["IT"] }), put: () => ({ ...detail(), ends_at: "2026-12-01T23:59:59+01:00" }) });
    withConsole(api, <PromotionEditor mode={{ kind: "open", id: 2 }} />);

    expect(await screen.findByText(/La promozione è in corso/)).toBeTruthy();
    expect(screen.queryByLabelText("Nome")).toBeNull();
    expect(screen.getByText("€ 5,99/mese → totale € 17,97")).toBeTruthy();
    expect(screen.queryByText(/Regno Unito/)).toBeNull();
    expect(screen.getByText(/Creata da Marta Ferri il 20\/11 10:12/)).toBeTruthy();
    const save = screen.getByRole("button", { name: "Salva" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    type("Fine: si può spostare", "2026-12-01T23:59");
    fireEvent.click(save);

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put.mock.calls[0][0]).toBe("/promotions/2");
    // Only the end: a GB price outside the countries (as Filament stores it) must not read as a change.
    expect(api.put.mock.calls[0][1]).toEqual({ ends_at: "2026-12-01T23:59" });
  });

  it("a role that only sees cannot open the new or duplicate form", async () => {
    const perms = ALL.filter((p) => p !== "console.promotions.update");
    withConsole(fakeApi({}, perms), <PromotionEditor mode={{ kind: "new" }} />);

    expect(await screen.findByText("Non puoi aprire questa pagina")).toBeTruthy();
    expect(screen.queryByLabelText("Nome")).toBeNull();
  });

  it("a scheduled one that started before «Salva» reloads into the end-only page", async () => {
    let started = false;
    const api = fakeApi({
      get: () => detail({ state: started ? "active" : "scheduled" }),
      put: () => {
        started = true;
        throw new ApiError(422, "locked", { code: "locked" });
      },
    });
    withConsole(api, <PromotionEditor mode={{ kind: "open", id: 2 }} />);
    await screen.findByRole("button", { name: "Avanti" });
    fireEvent.click(screen.getByRole("button", { name: /Controlla e crea/ }));
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));

    expect(await screen.findByText(/La promozione è in corso/)).toBeTruthy();
  });

  it("«Termina ora» from the page ends it after the confirmation", async () => {
    const api = fakeApi({ get: () => detail(), post: () => detail({ state: "ended" }) });
    withConsole(api, <PromotionEditor mode={{ kind: "open", id: 2 }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Termina ora" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Termina ora" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/promotions/2/end"));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/promotions"));
  });

  it("the server's overlap on the end shows under the end", async () => {
    const msg = "Si sovrappone a «Natale» (14/12 00:00–26/12 23:59) per IT · free: una promozione per volta per lo stesso utente.";
    withConsole(fakeApi({ get: () => detail(), put: () => { throw invalid({ ends_at: msg }); } }), <PromotionEditor mode={{ kind: "open", id: 2 }} />);
    await screen.findByText(/La promozione è in corso/);
    type("Fine: si può spostare", "2026-12-20T23:59");
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));

    expect(await screen.findByText(msg)).toBeTruthy();
  });

  it("a finished promotion is read-only with «Duplica»", async () => {
    withConsole(fakeApi({ get: () => detail({ state: "ended", name: "Prova di novembre" }) }), <PromotionEditor mode={{ kind: "open", id: 2 }} />);

    expect(await screen.findByText("È finita: non si cambia più. Per rifarla uguale usa Duplica.")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: /Duplica/ })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Duplica/ }));
    expect(nav.push).toHaveBeenCalledWith("/promotions?duplicate=2");
  });

  it("a role that only sees opens even a scheduled one read-only", async () => {
    withConsole(fakeApi({ get: () => detail({ state: "scheduled" }) }, ALL.filter((p) => p !== "console.promotions.update")), <PromotionEditor mode={{ kind: "open", id: 2 }} />);
    await screen.findByText("BLACKFRIDAY");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Avanti" })).toBeNull());
    expect(screen.queryByRole("button", { name: /Duplica/ })).toBeNull();
  });

  it("a duplicate starts with code, dates and Apple codes empty", async () => {
    withConsole(fakeApi({ get: () => detail({ state: "ended" }) }), <PromotionEditor mode={{ kind: "duplicate", id: 2 }} />);

    expect(await screen.findByText(/Copia di «Black Friday»/)).toBeTruthy();
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Black Friday (copia)");
    expect((screen.getByLabelText("Codice") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Inizio") as HTMLInputElement).value).toBe("");
  });
});

describe("rules on the client", () => {
  it("map server fields to steps and mirror PromotionRules", () => {
    expect(stepOf("name")).toBe(0);
    expect(stepOf("statuses")).toBe(0);
    expect(stepOf("formulas")).toBe(1);
    expect(stepOf("formulas.annual.prices.GB")).toBe(1);
    expect(stepOf("formulas.annual.apple_offer_code")).toBe(2);

    const d = emptyDraft();
    d.code = "BLACK FRIDAY";
    d.starts_at = "2026-12-02T00:00";
    d.ends_at = "2026-12-01T00:00";
    const e = checkStep(0, d);
    expect(e.code).toBe("Il codice può avere solo lettere e numeri, senza spazi (al massimo 64).");
    expect(e.ends_at).toBe("La fine deve essere dopo l’inizio.");

    d.code = "BF";
    d.countries = ["GB"];
    d.formulas.quarterly = { enabled: true, prices: { GB: "4,9x" }, apple_offer_id: "a", apple_offer_code: "", google_offer_id: "g" };
    d.formulas.annual = { enabled: true, prices: { GB: "4" }, apple_offer_id: "a", apple_offer_code: "", google_offer_id: "g" };
    expect(checkStep(1, d)).toEqual({ "formulas.quarterly.prices.GB": "Indica il prezzo mensile per il Regno Unito: il paese è fra i destinatari." });
    expect(checkStep(2, d)).toEqual({ "formulas.annual.apple_offer_code": "Con due formule servono due codici Apple diversi: scrivi il codice di questa formula." });
    expect(bodyOf({ ...d, formulas: { ...d.formulas, quarterly: { ...d.formulas.quarterly, prices: { GB: "4,99", IT: "9" } } } }).formulas.quarterly).toMatchObject({ prices: { GB: "4.99" } });
  });
});
