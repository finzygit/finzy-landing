import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { ConsoleProvider } from "@/lib/console";
import { EditDrawer } from "./EditDrawer";
import { EDIT, fakeApi, page } from "./testing";

vi.mock("next/navigation", () => ({
  usePathname: () => "/titoli/scheda",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("id=1"),
}));

function setup(put: unknown, stock = page()) {
  const api = fakeApi(EDIT, { "PUT /stocks/1": put });
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<ConsoleProvider api={api}><EditDrawer stock={stock} onClose={onClose} onSaved={onSaved} /></ConsoleProvider>);
  return { api, onClose, onSaved };
}

const save = () => screen.getByRole("button", { name: "Salva" });

describe("Edit drawer (MOB-1377)", () => {
  it("only four things: no price, official name, ticker or CIK field", () => {
    setup(page());
    expect(screen.getByLabelText("Nome comune")).toBeTruthy();
    expect(screen.getByLabelText("Ticker alternativi")).toBeTruthy();
    expect(screen.queryByLabelText(/Prezzo|Ticker$|CIK|Nome ufficiale/)).toBeNull();
    expect((save() as HTMLButtonElement).disabled).toBe(true);
  });

  it("adds a ticker and sends only what changed; the toast says where to find it", async () => {
    const { api, onSaved } = setup(page({ alternatives: ["NVDA.US", "NVDA.MX"] }));
    const input = screen.getByLabelText("Ticker alternativi");
    fireEvent.change(input, { target: { value: "nvda.mx" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("NVDA.MX")).toBeTruthy();
    fireEvent.click(save());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === "PUT")?.arg).toEqual({ alternatives: ["NVDA.US", "NVDA.MX"] });
  });

  it("a ticker of another stock: the server's refusal under the field, nothing closes", async () => {
    const { onSaved } = setup(new ApiError(422, "duplicate_ticker", { code: "duplicate_ticker", ticker: "NVD.DE" }));
    const input = screen.getByLabelText("Ticker alternativi");
    fireEvent.change(input, { target: { value: "NVD.DE" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(save());
    expect(await screen.findByText("«NVD.DE» è già il ticker di un altro titolo.")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("a new common name is locked by default", async () => {
    const { api } = setup(page({ common_name: "Nvidia" }), page({ common_name: "NVIDIA", common_name_source: "ai", common_name_locked: false }));
    fireEvent.change(screen.getByLabelText("Nome comune"), { target: { value: "Nvidia" } });
    expect(screen.getByRole("switch", { name: "Blocca il nome" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(save());
    await waitFor(() => expect(api.calls.find((c) => c.method === "PUT")?.arg).toEqual({ common_name: "Nvidia", common_name_locked: true }));
  });

  it("unlocking a locked name needs a confirmation", () => {
    setup(page());
    fireEvent.click(screen.getByRole("switch", { name: "Blocca il nome" }));
    expect(screen.getByText("Togliere il blocco al nome?")).toBeTruthy();
    expect(screen.getByText(/l’AI può sostituire «Nvidia»/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Togli il blocco" }));
    expect(screen.getByRole("switch", { name: "Blocca il nome" }).getAttribute("aria-checked")).toBe("false");
  });

  it("closing with changes asks before losing them", () => {
    const { onClose } = setup(page());
    fireEvent.change(screen.getByLabelText("Nome comune"), { target: { value: "Nvidia Corp" } });
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));
    expect(screen.getByText("Uscire senza salvare?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Esci senza salvare" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("a logo over 1 MB is refused before sending; the rest can still be saved", async () => {
    const { api } = setup(page());
    const big = new File([new Uint8Array(4.2 * 1024 * 1024)], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Scegli il file: Logo"), { target: { files: [big] } });
    expect(screen.getByText("Il file pesa 4,2 MB: il massimo è 1 MB.")).toBeTruthy();
    expect((save() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Nome comune"), { target: { value: "Nvidia Corp" } });
    fireEvent.click(save());
    await waitFor(() => expect(api.calls.find((c) => c.method === "PUT")?.arg).toEqual({ common_name: "Nvidia Corp", common_name_locked: true }));
  });

  it("removing the refused ticker clears the refusal and Salva works again", async () => {
    setup(new ApiError(422, "duplicate_ticker", { code: "duplicate_ticker", ticker: "NVD.DE" }));
    const input = screen.getByLabelText("Ticker alternativi");
    fireEvent.change(input, { target: { value: "NVD.DE" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(save());
    expect(await screen.findByText("«NVD.DE» è già il ticker di un altro titolo.")).toBeTruthy();
    expect((save() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Togli NVD.DE" }));
    expect(screen.queryByText("«NVD.DE» è già il ticker di un altro titolo.")).toBeNull();
  });

  it("after taking the lock off, editing the name does not lock it again by itself", () => {
    setup(page());
    fireEvent.click(screen.getByRole("switch", { name: "Blocca il nome" }));
    fireEvent.click(screen.getByRole("button", { name: "Togli il blocco" }));
    fireEvent.change(screen.getByLabelText("Nome comune"), { target: { value: "Nvidia Corp" } });
    expect(screen.getByRole("switch", { name: "Blocca il nome" }).getAttribute("aria-checked")).toBe("false");
  });

  it("removing the banner happens at Salva, without a dialog", async () => {
    const { api } = setup(page({ banner: { url: null } }), page({ banner: { url: "https://cdn.example/b.png" } }));
    fireEvent.click(screen.getByRole("button", { name: "Togli" }));
    expect(screen.getByText(/Lo togli salvando/)).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(save());
    await waitFor(() => expect(api.calls.find((c) => c.method === "PUT")?.arg).toEqual({ banner: null }));
  });

  it("a failed save says so and keeps the drawer", async () => {
    const { onSaved } = setup(new ApiError(500, null));
    fireEvent.change(screen.getByLabelText("Nome comune"), { target: { value: "Nvidia Corp" } });
    fireEvent.click(save());
    expect(await screen.findByText("Salvataggio non riuscito. Riprova.")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
