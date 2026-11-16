"use client";

// MOB-1372: the drawer from the right (a log row, a role, a person) and the
// confirm dialog. Esc and the scrim close both; the dialog keeps focus inside
// and asks to type a word before an action that cannot be undone.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

// Escape closes only the overlay opened last (a dialog over a drawer closes the dialog).
const stack: number[] = [];
let nextId = 0;
function useEscape(onClose: () => void) {
  useEffect(() => {
    const id = ++nextId;
    stack.push(id);
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === id) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      stack.splice(stack.indexOf(id), 1);
    };
  }, [onClose]);
}

export function Drawer({ title, sub, footer, loading, onClose, children }: { title: string; sub?: string; footer?: ReactNode; loading?: boolean; onClose: () => void; children?: ReactNode }) {
  useEscape(onClose);
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => back?.focus?.();
  }, []);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={id}>
        <header>
          <div>
            <h2 id={id}>{title}</h2>
            {sub ? <span className="sub" style={{ fontSize: 14 }}>{sub}</span> : null}
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Chiudi" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="body" aria-busy={loading || undefined}>
          {loading ? (
            <>
              <span className="skeleton" style={{ width: "60%", height: 18 }} />
              <span className="skeleton" style={{ width: "90%" }} />
              <span className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            </>
          ) : (
            children
          )}
        </div>
        {footer ? <footer>{footer}</footer> : null}
      </aside>
    </>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  kind = "destructive",
  typed,
  busy = false,
  error,
  onConfirm,
  onCancel,
  cancelLabel = "Annulla",
  safeIsConfirm = false,
  children,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  kind?: "destructive" | "primary";
  typed?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  /** The confirm button is the safe answer («Resta collegato»): Escape, the scrim and the first focus go to it. */
  safeIsConfirm?: boolean;
  children?: ReactNode;
}) {
  const safe = safeIsConfirm ? onConfirm : onCancel;
  useEscape(safe);
  const [value, setValue] = useState("");
  const ok = !typed || value.trim() === typed;
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // The safe answer gets the focus, unless a field inside the dialog wants it.
    if (document.activeElement && document.activeElement.closest?.("[role=alertdialog]")) return;
    (safeIsConfirm ? confirmRef : cancelRef).current?.focus();
  }, [safeIsConfirm]);
  return (
    <>
      <div className="scrim" onClick={safe} />
      <div className="dialog-wrap">
        <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={id}>
          <div>
            <h2 id={id}>{title}</h2>
            <p style={{ marginTop: 8 }}>{message}</p>
          </div>
          {children}
          {typed ? (
            <div className="field">
              <label htmlFor={`${id}-typed`}>Per confermare scrivi {typed}</label>
              <input id={`${id}-typed`} className="input" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
            </div>
          ) : null}
          {error ? (
            <p className="error-line" role="alert">
              {error}
            </p>
          ) : null}
          <div className="actions">
            <button ref={cancelRef} type="button" className="btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button ref={confirmRef} type="button" className={kind === "destructive" ? "btn btn-danger" : "btn btn-primary"} disabled={!ok || busy} aria-busy={busy || undefined} onClick={onConfirm}>
              {busy ? "…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
