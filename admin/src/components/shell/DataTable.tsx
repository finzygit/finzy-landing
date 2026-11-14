"use client";

// MOB-1372: the console's data table (server pagination lives in <Pager>).
// States: default, loading (skeleton rows), empty (the page's own empty
// state), filtered (no row with these filters: «Togli i filtri»), error
// («Riprova»). A row may open a drawer (onRowClick); the open one is marked.

import type { ReactNode } from "react";
import { StateBlock } from "./parts";

export type Column<T> = { key: string; label: string; width?: string; align?: "left" | "right"; render: (row: T) => ReactNode };
export type TableState = "default" | "loading" | "empty" | "filtered" | "error";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  state = "default",
  selectedKey,
  onRowClick,
  empty,
  errorText = "Non è stato possibile caricare l’elenco",
  onRetry,
  onClearFilters,
  loadingRows = 6,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  state?: TableState;
  selectedKey?: string | number | null;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  errorText?: string;
  onRetry?: () => void;
  onClearFilters?: () => void;
  loadingRows?: number;
  caption?: string;
}) {
  const head = (
    <thead>
      <tr>
        {columns.map((c) => (
          <th key={c.key} style={{ width: c.width, textAlign: c.align ?? "left" }} scope="col">
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  );
  let body: ReactNode;
  if (state === "loading") {
    body = Array.from({ length: loadingRows }, (_, r) => (
      <tr key={r} aria-hidden="true">
        {columns.map((c, i) => (
          <td key={c.key}>
            <span className="skeleton" style={{ width: ["70%", "55%", "40%", "60%"][(i + r) % 4] }} />
          </td>
        ))}
      </tr>
    ));
  } else if (state !== "default") {
    const inner =
      state === "error" ? (
        <StateBlock kind="error" title={errorText} action={onRetry ? <button type="button" className="btn" onClick={onRetry}>Riprova</button> : undefined} />
      ) : state === "filtered" ? (
        <StateBlock
          kind="empty"
          title="Nessun risultato con questi filtri"
          body="Cambia o togli i filtri per vedere altre righe."
          action={onClearFilters ? <button type="button" className="btn" onClick={onClearFilters}>Togli i filtri</button> : undefined}
        />
      ) : (
        empty
      );
    body = (
      <tr>
        <td colSpan={columns.length} style={{ height: "auto" }}>
          {inner}
        </td>
      </tr>
    );
  } else {
    body = rows.map((row) => {
      const k = rowKey(row);
      return (
        <tr
          key={k}
          data-clickable={onRowClick ? "true" : undefined}
          aria-selected={selectedKey === k ? true : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={onRowClick ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(row)) : undefined}
        >
          {columns.map((c) => (
            <td key={c.key} style={{ textAlign: c.align ?? "left" }}>
              {c.render(row)}
            </td>
          ))}
        </tr>
      );
    });
  }
  return (
    <div style={{ overflowX: "auto" }} aria-busy={state === "loading" || undefined}>
      <table className="table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {head}
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}
