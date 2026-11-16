"use client";

// MOB-1374: the parts only the Utenti pages use (design/v2/ui_adm_users.py,
// boards Kit-ADM-U-1/2): the plan pill, the user cell and avatar, the callout,
// the key/value rows, the copy button, the form dialog and the few icons the
// shell's Icon has not got. Everything else is the shell's (MOB-1372).

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { PLAN_LABEL, type Plan } from "./model";

const PILL: Record<Plan, React.CSSProperties> = {
  free: { background: "rgba(255,255,255,0.08)", color: "var(--text-2)" },
  // «In prova»: neutral with an outline, never a turquoise «choice».
  trial: { background: "transparent", boxShadow: "inset 0 0 0 1px rgba(236,244,241,0.36)", color: "var(--text)" },
  premium: { background: "rgba(200,208,217,0.16)", color: "#dde3ea" },
  unlimited: { background: "rgba(226,190,120,0.18)", color: "#f0d49a" },
};

export function PlanPill({ plan, small = false }: { plan: Plan; small?: boolean }) {
  return (
    <span
      data-plan={plan}
      style={{ display: "inline-flex", alignItems: "center", width: "fit-content", height: small ? 22 : 26, padding: "0 10px", borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 700, whiteSpace: "nowrap", ...PILL[plan] }}
    >
      {PLAN_LABEL[plan]}
    </span>
  );
}

const TONES = ["#173A3C", "#2B2A3F", "#3A2F22", "#1F3328", "#33242C", "#22303F"];
function tone(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function UserAvatar({ name, email, size = 36, url }: { name: string | null; email: string; size?: number; url?: string | null }) {
  const style: React.CSSProperties = { flex: "none", width: size, height: size, borderRadius: "36%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: tone(email), border: "1px solid rgba(255,255,255,0.10)", fontSize: Math.round(size * 0.42), fontWeight: 700, overflow: "hidden" };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimiser
    return <img src={url} alt="" aria-hidden="true" style={{ ...style, objectFit: "cover" }} />;
  }
  return (
    <span aria-hidden="true" style={style}>
      {(name || email).slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Name (or «Senza nome») over the e-mail, one line each. */
export function UserCell({ name, email }: { name: string | null; email: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <UserAvatar name={name} email={email} />
      <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        {name ? <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</strong> : <span className="muted" style={{ fontStyle: "italic" }}>Senza nome</span>}
        <span className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowWrap: "anywhere" }}>{email}</span>
      </span>
    </span>
  );
}

/** A tinted box inside a dialog: warn (amber) or info (turquoise). */
/** `alert` only for a failure that just happened; a standing warning is a note (no announcement on open). */
export function Callout({ kind = "warn", title, alert = false, children }: { kind?: "warn" | "info"; title: string; alert?: boolean; children?: ReactNode }) {
  const warn = kind === "warn";
  return (
    <div
      role={alert ? "alert" : "note"}
      data-kind={kind}
      style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 14, background: warn ? "rgba(242,184,75,0.10)" : "rgba(39,204,216,0.08)", border: `1px solid ${warn ? "rgba(242,184,75,0.32)" : "rgba(39,204,216,0.26)"}` }}
    >
      <span style={{ flex: "none", marginTop: 1, color: warn ? "var(--warn)" : "var(--accent)" }}>
        <Icon name={warn ? "alert" : "info"} size={18} />
      </span>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <strong style={{ fontSize: 14, lineHeight: "20px", color: warn ? "var(--warn)" : "var(--accent)" }}>{title}</strong>
        {children ? <span style={{ fontSize: 14, lineHeight: "20px", color: "rgba(244,247,246,0.86)" }}>{children}</span> : null}
      </div>
    </div>
  );
}

export function Kv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div>
      {rows.map(([k, v]) => (
        <div className="kv" key={k}>
          <span>{k}</span>
          <span style={{ textAlign: "right" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function Fact({ label, children, muted = false }: { label: string; children: ReactNode; muted?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>{label}</span>
      <span className={muted ? "muted" : undefined} style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {children}
      </span>
    </div>
  );
}

/** The e-mail with a copy button («Copiato» for two seconds). */
export function CopyText({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // clipboard blocked: nothing to do, the text is selectable
    }
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <span style={{ color: "var(--text-2)", fontSize: 15, overflowWrap: "anywhere" }}>{text}</span>
      <button type="button" className="link-btn" onClick={copy} aria-label={done ? "Copiato" : `Copia ${text}`} style={{ display: "inline-flex", padding: 4 }}>
        <Icon name={done ? "check" : "copy"} size={15} />
      </button>
    </span>
  );
}

const PATHS: Record<string, ReactNode> = {
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8c-1.5-3-5-3.5-5-1s3 1 5 1c2 0 5 1.5 5-1s-3.5-2-5 1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  replay: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  // MOB-1462: «Sospendi» / «Sospeso».
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
};

/** MOB-1462: the red «Sospeso» pill next to the plan (list row, page head). */
export function SuspendedPill({ small = false }: { small?: boolean }) {
  return (
    <span
      data-suspended="true"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, width: "fit-content", height: small ? 22 : 26, padding: "0 9px", borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 700, whiteSpace: "nowrap", background: "rgba(255,69,58,0.14)", color: "#ff8a80" }}
    >
      <UIcon name="ban" size={small ? 12 : 14} /> Sospeso
    </span>
  );
}

/** Icons the shell's set has not got (gift, plus, trash, replay, calendar, ban). */
export function UIcon({ name, size = 18 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/**
 * A dialog with a form (gift, revoke, edit, new user, delete, CSV), on the
 * shell's .dialog surface. Escape and the scrim cancel, except while busy
 * (nothing closes while a write runs); the first field gets the focus.
 */
export function FormDialog({
  title,
  sub,
  icon,
  children,
  actions,
  busy = false,
  onCancel,
  width = 520,
}: {
  title: string;
  sub?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions: ReactNode;
  busy?: boolean;
  onCancel: () => void;
  width?: number;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>("input, textarea, select, button:not([data-skip-focus])");
    first?.focus();
    return () => back?.focus?.();
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // A shell dialog above this one (the idle «Sei ancora qui?») takes the keys first.
      if (document.querySelector("[role=alertdialog]")) return;
      if (e.key === "Escape" && !busy) {
        e.stopPropagation();
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !box.current) return;
      // Tab stays inside the dialog.
      const items = Array.from(box.current.querySelectorAll<HTMLElement>("input, textarea, select, button, a[href]")).filter((el) => !el.hasAttribute("disabled"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [busy, onCancel]);
  return (
    <>
      <div className="scrim" onClick={busy ? undefined : onCancel} />
      <div className="dialog-wrap">
        <div ref={box} className="dialog" role="dialog" aria-modal="true" aria-labelledby={id} aria-busy={busy || undefined} style={{ width: `min(${width}px, 100%)`, maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {icon ? <span style={{ flex: "none", width: 40, height: 40, borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", color: "var(--accent-soft)" }}>{icon}</span> : null}
            <div style={{ minWidth: 0 }}>
              <h2 id={id}>{title}</h2>
              {sub ? <p style={{ marginTop: 4, overflowWrap: "anywhere" }}>{sub}</p> : null}
            </div>
          </div>
          {children}
          <div className="actions">{actions}</div>
        </div>
      </div>
    </>
  );
}

/** A labelled field with its hint or error under it. */
export function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string | null; hint?: string | null; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true" style={{ color: "var(--text-3)" }}> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="error-line" role="alert" id={`${id}-msg`}>
          {error}
        </p>
      ) : hint ? (
        <p className="note" id={`${id}-msg`} style={{ paddingLeft: 4 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A button that keeps its label's place while busy: «Salvataggio…». */
export function BusyButton({ busy, busyLabel, children, className = "btn btn-primary", disabled, onClick, type = "button" }: { busy: boolean; busyLabel: string; children: ReactNode; className?: string; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} className={className} disabled={disabled || busy} aria-busy={busy || undefined} onClick={onClick}>
      {busy ? busyLabel : children}
    </button>
  );
}
