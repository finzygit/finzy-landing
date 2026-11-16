import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AvatarItem, Avatars } from "@/lib/content/types";
import { AvatarsPage, refusePicture } from "./AvatarsPage";
import { EDITOR, READER, fakeApi, renderPage } from "./testkit";

vi.mock("next/navigation", () => ({
  usePathname: () => "/content/avatars",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const av = (id: number, name: string, sort: number, active: boolean): AvatarItem => ({ id, slug: name.toLowerCase(), name_it: name, name_en: name, sort, active, image_url: null });
const DATA: Avatars = { avatars: [av(1, "Finn", 1, true), av(2, "Astronauta", 2, true), av(3, "Gufo", 3, false)], last_change: { who: "Marta Ferri", at: "2026-11-07T10:15:00+01:00" } };

describe("Avatar", () => {
  it("shows the active ones numbered and the others apart", async () => {
    renderPage(<AvatarsPage />, fakeApi(EDITOR, { "GET /avatars": DATA }).api);
    expect(await screen.findByText("Attivi · 2")).toBeTruthy();
    expect(screen.getByText("Non attivi · 1")).toBeTruthy();
    expect(screen.getByText("Non compaiono nella scelta. Chi li ha già scelti li tiene.")).toBeTruthy();
  });

  it("switching one off applies at once, and «Annulla» turns it back on", async () => {
    const fake = fakeApi(EDITOR, { "GET /avatars": DATA, "PUT /avatars/1": (b: unknown) => ({ ...DATA.avatars[0], ...(b as object) }) });
    renderPage(<AvatarsPage />, fake.api);
    fireEvent.click(await screen.findByRole("switch", { name: "Finn: Attivo" }));
    expect(await screen.findByText("«Finn» non è più nella scelta dell’app")).toBeTruthy();
    expect(screen.getByText("Attivi · 1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));
    await waitFor(() => expect(fake.writes().map((w) => w.body)).toEqual([{ active: false }, { active: true }]));
  });

  it("moving an avatar asks to save the order of the active ones", async () => {
    const fake = fakeApi(EDITOR, { "GET /avatars": DATA, "POST /avatars/reorder": DATA });
    renderPage(<AvatarsPage />, fake.api);
    fireEvent.keyDown(await screen.findByRole("button", { name: "Sposta Astronauta" }), { key: "ArrowLeft" });
    fireEvent.click(within(screen.getByRole("region", { name: "Ordine degli avatar cambiato" })).getByRole("button", { name: "Salva ordine" }));
    await waitFor(() => expect(fake.writes()[0]).toEqual({ method: "POST", path: "/avatars/reorder", body: { ids: [2, 1] } }));
  });

  it("a picture must be a square PNG or WEBP of at least 512 px", () => {
    const png = new File(["x"], "a.png", { type: "image/png" });
    expect(refusePicture(png, { width: 800, height: 600 })).toBe("L’immagine deve essere quadrata: questa è 800 × 600.");
    expect(refusePicture(png, { width: 1000, height: 1000 })).toBeNull();
    expect(refusePicture(png, { width: 256, height: 256 })).toContain("almeno 512");
    expect(refusePicture(new File(["x"], "a.jpg", { type: "image/jpeg" }), { width: 600, height: 600 })).toContain("PNG o WEBP");
  });

  it("a reader cannot switch, move or add", async () => {
    renderPage(<AvatarsPage />, fakeApi(READER, { "GET /avatars": DATA }).api);
    expect(((await screen.findByRole("switch", { name: "Finn: Attivo" })) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /^Sposta/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nuovo avatar" })).toBeNull();
  });
});
