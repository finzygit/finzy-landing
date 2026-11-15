"use client";

// MOB-1380: the small parts of the «Contenuti app» pages (design/v2/ui_adm_content.py,
// board Kit-ADM-CONTENT-1): switch, IT/EN choice, «Ultima modifica» line, save bar,
// drag grip, video chip, uploads tray. Built on the shell's classes (globals.css).

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { useConsole } from "@/lib/console";
import { duration, fill, longWhen, timeLeft, bytes } from "@/lib/content/format";
import { T } from "@/lib/content/texts";
import type { Lang, LastChange } from "@/lib/content/types";
import { cancelUpload, clearFinished, pauseUpload, resumeUpload, useUploads, type Upload } from "@/lib/content/uploads";

export const CRUMB = T.group;

export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="cc-switch"
      data-on={on}
    >
      <span />
    </button>
  );
}

export function LangSwitch({ value, onChange, label, marks }: { value: Lang; onChange: (l: Lang) => void; label: string; marks?: Partial<Record<Lang, boolean>> }) {
  return (
    <div className="segmented cc-lang" role="group" aria-label={label}>
      {(["it", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" aria-pressed={value === l} onClick={() => onChange(l)}>
          {l.toUpperCase()}
          {marks?.[l] ? <span className="cc-dot" aria-label="manca" /> : null}
        </button>
      ))}
    </div>
  );
}

/** «Ultima modifica: Marta Ferri, 12 nov 2026, 18:04 · Registro attività» (from the console's log). */
export function LastChangeLine({ change }: { change: LastChange }) {
  const { can } = useConsole();
  if (!change) return null;
  return (
    <p className="cc-last">
      <Icon name="pulse" size={14} />
      <span>{fill(T.last, { who: change.who ?? "—", when: longWhen(change.at) })}</span>
      {can("console.admin.view") ? (
        <>
          <span aria-hidden="true">·</span>
          <Link href="/admin/audit-log">{T.log_link}</Link>
        </>
      ) : null}
    </p>
  );
}

/** The bar that shows only after a change: «Modifiche non salvate · Annulla · Salva». */
export function SaveBar({ message = T.unsaved, saveLabel = T.save, busy, error, onCancel, onSave, saveDisabled }: {
  message?: string; saveLabel?: string; busy?: boolean; error?: string | null; onCancel: () => void; onSave: () => void; saveDisabled?: boolean;
}) {
  return (
    <div className="cc-savebar" role="region" aria-label={message}>
      <span className="cc-savebar-msg">
        <span className="cc-dot" aria-hidden="true" />
        {message}
      </span>
      {error ? <span className="error-line" role="alert">{error}</span> : null}
      <span style={{ flex: 1 }} />
      <button type="button" className="btn" onClick={onCancel} disabled={busy}>{T.cancel}</button>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy || saveDisabled} aria-busy={busy || undefined}>
        {busy ? "…" : saveLabel}
      </button>
    </div>
  );
}

/** A drag handle that also moves with the arrow keys (the same order change, without a mouse). */
export function Grip({ label, onMove, style }: { label: string; onMove?: (delta: -1 | 1) => void; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const onKey = (e: KeyboardEvent) => {
    if (!onMove) return;
    const d = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : 0;
    if (d) {
      e.preventDefault();
      onMove(d);
      // The row moved in the DOM: keep the focus on its grip so the next arrow keeps moving it.
      requestAnimationFrame(() => ref.current?.focus());
    }
  };
  return (
    <span ref={ref} className="cc-grip" role="button" tabIndex={0} aria-label={label} aria-keyshortcuts="ArrowUp ArrowDown" onKeyDown={onKey} style={style}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        {[3, 7, 11].flatMap((y) => [4, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />))}
      </svg>
    </span>
  );
}

/** «IT manca» / «EN ▸ 5:42» in the lessons list. */
export function VideoChip({ lang, video }: { lang: Lang; video: { duration: number | null } | null }) {
  return (
    <span className="cc-vchip" data-has={!!video}>
      <b>{lang.toUpperCase()}</b>
      {video ? (
        <>
          <Glyph name="play" size={11} />
          {duration(video.duration) || "—"}
        </>
      ) : (
        T.missing
      )}
    </span>
  );
}

/** The lesson's picture, or the section's drawing when it has none. */
export function Thumb({ url, size = 44 }: { url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="cc-thumb" style={{ width: size * 1.36, height: size }} />
  ) : (
    <span className="cc-thumb cc-thumb-empty" style={{ width: size * 1.36, height: size }} aria-hidden="true">
      <Icon name="layers" size={16} />
    </span>
  );
}

export function uploadLine(u: Upload): string {
  if (u.status === "paused" || u.status === "error") return fill(T.v_paused, { d: bytes(u.sent), t: bytes(u.size) });
  if (u.status === "checking") return T.v_check;
  if (u.status === "done") return T.tray_done;
  const left = u.rate > 0 ? timeLeft((u.size - u.sent) / u.rate) : "";
  return fill(T.v_progress, { d: bytes(u.sent), t: bytes(u.size), left }).replace(/ · $/, "");
}

/** The docked «Caricamenti» tray: every running upload, with pause, resume and cancel; it stays while the admin browses. */
export function UploadsTray() {
  const { me } = useConsole();
  const all = useUploads();
  const meId = me?.user.id ?? null;
  // Another admin signed in in this tab: the previous admin's uploads stop and leave the tray.
  useEffect(() => {
    if (meId !== null) all.filter((u) => u.owner !== null && u.owner !== meId).forEach((u) => cancelUpload(u.id));
  }, [all, meId]);
  const uploads = all.filter((u) => u.owner === null || u.owner === meId);
  if (!uploads.length) return null;
  const live = uploads.filter((u) => u.status !== "done");
  return (
    <aside className="cc-tray" aria-label={live.length ? fill(T.tray_n, { n: live.length }) : T.tray_done}>
      <header>
        <strong>{live.length ? fill(T.tray_n, { n: live.length }) : T.tray_done}</strong>
        {!live.length ? (
          <button type="button" className="icon-btn" aria-label="Chiudi" onClick={clearFinished}>
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </header>
      {live.length ? <p className="note">{T.tray_note}</p> : null}
      <ul>
        {uploads.map((u) => (
          <li key={u.id}>
            <div className="cc-tray-row">
              <span className="cc-tray-name">
                <b>{u.lang.toUpperCase()}</b> {u.lessonTitle}
              </span>
              <Link href={`/content/lessons/detail?id=${u.lessonId}`}>{T.tray_open}</Link>
            </div>
            <Progress value={u.size ? u.sent / u.size : 0} paused={u.status === "paused" || u.status === "error"} />
            <div className="cc-tray-row">
              <span className="note" role={u.status === "error" ? "alert" : undefined}>{u.status === "error" ? T.v_err_net : uploadLine(u)}</span>
              <UploadButtons u={u} />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function UploadButtons({ u }: { u: Upload }) {
  if (u.status === "done" || u.status === "checking") return null;
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      {u.status === "uploading" || u.status === "starting" ? (
        <button type="button" className="link-btn" onClick={() => pauseUpload(u.id)}>{T.v_pause}</button>
      ) : (
        <button type="button" className="link-btn" onClick={() => resumeUpload(u.id)}>{u.status === "error" ? T.tray_retry : T.v_resume}</button>
      )}
      <button type="button" className="link-btn" style={{ color: "var(--text-2)" }} onClick={() => cancelUpload(u.id)}>{T.v_cancel}</button>
    </span>
  );
}

export function Progress({ value, paused }: { value: number; paused?: boolean }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <span className="cc-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} data-paused={paused || undefined}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}

/** The upload arrow and the play mark of the boards (the shell's Icon set has neither). */
export function Glyph({ name, size = 18 }: { name: "upload" | "play" | "plus"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
      {name === "plus" ? (
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      ) : name === "upload" ? (
        <path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
      )}
    </svg>
  );
}

export function Card({ title, icon, action, children, style }: { title?: ReactNode; icon?: string; action?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <section className="card cc-card" style={style}>
      {title ? (
        <header className="cc-card-head">
          <h2>
            {icon ? <Icon name={icon} size={18} /> : null}
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
