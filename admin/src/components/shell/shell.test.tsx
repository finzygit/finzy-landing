import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";
import { ConfirmDialog } from "./overlays";
import { Level, LevelPicker, Pager } from "./parts";

type Row = { id: number; name: string };
const cols = [{ key: "n", label: "Nome", render: (r: Row) => r.name }];

describe("DataTable", () => {
  it("draws rows and opens one with the keyboard", () => {
    const open = vi.fn();
    render(<DataTable<Row> columns={cols} rows={[{ id: 1, name: "Marta" }, { id: 2, name: "Luca" }]} rowKey={(r) => r.id} selectedKey={2} onRowClick={open} />);
    expect(screen.getByText("Marta")).toBeTruthy();
    expect(screen.getByText("Luca").closest("tr")?.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(screen.getByText("Marta").closest("tr")!, { key: "Enter" });
    expect(open).toHaveBeenCalledWith({ id: 1, name: "Marta" });
  });

  it("has a loading, filtered and error state", () => {
    const retry = vi.fn();
    const clear = vi.fn();
    const { rerender, container } = render(<DataTable<Row> columns={cols} rows={[]} rowKey={(r) => r.id} state="loading" />);
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
    rerender(<DataTable<Row> columns={cols} rows={[]} rowKey={(r) => r.id} state="filtered" onClearFilters={clear} />);
    fireEvent.click(screen.getByText("Togli i filtri"));
    expect(clear).toHaveBeenCalled();
    rerender(<DataTable<Row> columns={cols} rows={[]} rowKey={(r) => r.id} state="error" onRetry={retry} errorText="Non è stato possibile caricare" />);
    expect(screen.getByRole("alert").textContent).toContain("Non è stato possibile caricare");
    fireEvent.click(screen.getByText("Riprova"));
    expect(retry).toHaveBeenCalled();
  });
});

describe("ConfirmDialog", () => {
  it("turns the answer on only when the word is typed", () => {
    const ok = vi.fn();
    render(<ConfirmDialog title="Togliere l’accesso?" message="…" confirmLabel="Togli l’accesso" typed="TOGLI" onConfirm={ok} onCancel={() => undefined} />);
    const btn = screen.getByText("Togli l’accesso") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Per confermare scrivi TOGLI"), { target: { value: "TOGL" } });
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Per confermare scrivi TOGLI"), { target: { value: "TOGLI" } });
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(ok).toHaveBeenCalled();
  });

  it("Escape and Annulla cancel; Annulla has the focus first", () => {
    const cancel = vi.fn();
    render(<ConfirmDialog title="Eliminare?" message="…" confirmLabel="Elimina" onConfirm={() => undefined} onCancel={cancel} />);
    expect(document.activeElement?.textContent).toBe("Annulla");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});

describe("permission words", () => {
  it("says the level in words, with the extras", () => {
    render(<Level level="edit" extras={["Esporta"]} />);
    expect(screen.getByText("Modifica")).toBeTruthy();
    expect(screen.getByText("+ Esporta")).toBeTruthy();
  });

  it("the picker cannot choose Modifica where the area has nothing to save", () => {
    const change = vi.fn();
    render(<LevelPicker label="Home" value="view" canEdit={false} onChange={change} />);
    expect((screen.getByText("Modifica") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText("Nessuno"));
    expect(change).toHaveBeenCalledWith("none");
  });
});

describe("Pager", () => {
  it("counts in Italian and turns the arrows off at the ends", () => {
    render(<Pager page={1} perPage={50} total={1495} onPage={() => undefined} />);
    expect(screen.getByText("1–50 di 1.495 righe")).toBeTruthy();
    expect((screen.getByLabelText("Pagina precedente") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Pagina successiva") as HTMLButtonElement).disabled).toBe(false);
  });
});
