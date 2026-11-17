"use client";

// MOB-1372: the console's small parts (kit block design/v2/ui_admin.py,
// boards Kit-ADM-1/2): page head, section, banner, words for access levels,
// status, log verbs, page states, pager, toasts.

import type { ReactNode } from "react";
import { useConsole } from "@/lib/console";
import { Icon } from "./Icon";

export function PageHead({ title, sub, crumbs, actions }: { title: string; sub?: string; crumbs?: string[]; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        {crumbs?.length ? (
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={c} style={i === crumbs.length - 1 ? { color: "var(--text-2)" } : undefined}>
                {i > 0 ? "› " : ""}
                {c}
              </span>
            ))}
          </div>
        ) : null}
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 10, flex: "none" }}>{actions}</div> : null}
    </header>
  );
}

export function Section({ title, note, action, children, pad = "20px 24px" }: { title?: string; note?: string; action?: ReactNode; children: ReactNode; pad?: string }) {
  return (
    <section className="card" style={{ padding: pad, display: "flex", flexDirection: "column", gap: 16 }}>
      {title ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px 16px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
            {note ? <p className="note" style={{ fontSize: 14 }}>{note}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Banner({ kind = "warn", children, action }: { kind?: "warn" | "info"; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="banner" data-kind={kind} role="status">
      <Icon name={kind === "info" ? "info" : "alert"} size={17} />
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

export type LevelKind = "none" | "view" | "edit" | "all";
const LEVEL: Record<LevelKind, [string, string | null]> = {
  edit: ["Modifica", "edit"],
  view: ["Vede", "eye"],
  none: ["Nessun accesso", null],
  all: ["Tutto", "lock"],
};

/** A group's access in words, never a checkbox wall (Vanta-style). */
export function Level({ level, extras = [] }: { level: LevelKind; extras?: string[] }) {
  const [label, icon] = LEVEL[level];
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <span className="level" data-level={level}>
        {icon ? <Icon name={icon} size={15} /> : <span style={{ width: 10, height: 2, background: "var(--text-3)", borderRadius: 1 }} />}
        {label}
      </span>
      {extras.map((x) => (
        <span key={x} className="note" style={{ fontWeight: 600 }}>
          + {x}
        </span>
      ))}
    </span>
  );
}

export function LevelPicker({
  value,
  onChange,
  canEdit = true,
  label,
}: {
  value: "none" | "view" | "edit";
  onChange: (v: "none" | "view" | "edit") => void;
  canEdit?: boolean;
  label: string;
}) {
  const opts: ["none" | "view" | "edit", string][] = [
    ["none", "Nessuno"],
    ["view", "Vede"],
    ["edit", "Modifica"],
  ];
  return (
    <div className="segmented" role="group" aria-label={label}>
      {opts.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} disabled={v === "edit" && !canEdit} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Status({ kind, children }: { kind: "ok" | "warn" | "off"; children: ReactNode }) {
  return (
    <span className="status" data-kind={kind}>
      {children}
    </span>
  );
}

export function VerbChip({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <span className="chip" data-kind={kind}>
      {children}
    </span>
  );
}

export function StateBlock({ kind, title, body, action }: { kind: "denied" | "missing" | "error" | "empty" | "loading"; title?: string; body?: string; action?: ReactNode }) {
  if (kind === "loading") {
    return (
      <div aria-busy="true" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span className="skeleton" style={{ width: 220 }} />
        <span className="skeleton" style={{ width: 340, height: 30 }} />
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="skeleton" style={{ height: 18 }} />
          ))}
        </div>
      </div>
    );
  }
  const icon = { denied: "lock", missing: "search", error: "alert", empty: "info" }[kind];
  return (
    <div className="state" role={kind === "error" ? "alert" : undefined}>
      <span style={{ color: kind === "error" ? "var(--warn)" : "var(--accent-soft)" }}>
        <Icon name={icon} size={kind === "error" ? 40 : 26} />
      </span>
      {title ? <h2>{title}</h2> : null}
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function Pager({ page, perPage, total, label = "righe", onPage }: { page: number; perPage: number; total: number; label?: string; onPage: (p: number) => void }) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(total, page * perPage);
  // Italian thousands with a dot, whatever ICU the runtime has.
  const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (
    <div className="pager">
      <span>
        {fmt(first)}–{fmt(last)} di {fmt(total)} {label}
      </span>
      <button type="button" className="icon-btn" aria-label="Pagina precedente" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <span style={{ transform: "scaleX(-1)", display: "inline-flex" }}>
          <Icon name="chevron" size={18} />
        </span>
      </button>
      <button type="button" className="icon-btn" aria-label="Pagina successiva" disabled={last >= total} onClick={() => onPage(page + 1)}>
        <Icon name="chevron" size={18} />
      </button>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useConsole();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-kind={t.kind ?? "success"} role="status">
          <Icon name={t.kind === "error" ? "alert" : t.kind === "info" ? "info" : "check"} size={18} />
          <div style={{ flex: 1 }}>
            <strong>{t.title}</strong>
            {t.body ? <span>{t.body}</span> : null}
          </div>
          <button type="button" className="link-btn" onClick={() => dismiss(t.id)} aria-label="Chiudi">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
