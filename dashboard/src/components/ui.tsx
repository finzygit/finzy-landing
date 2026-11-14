// MOB-1198: the small pieces of the Kit-W boards (ui.py «evo-web» block):
// icons, card, stat tile, key-value rows, skeleton, notices, empty and
// error states, buttons, segmented control, source line, change pill.
import type { ReactNode } from "react";
import { formatChange, type Lang } from "@/lib/format";

// ---------------------------------------------------------------- icons

const PATHS: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5S9.6 6.1 12 3.5Z" />
    </>
  ),
  chevron_down: <path d="m7 10 5 5 5-5" />,
  chevron_right: <path d="m10 7 5 5-5 5" />,
  close: <path d="M7 7l10 10M17 7 7 17" />,
  check: <path d="m6 12.5 4 4 8-9" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.2" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.2" />
    </>
  ),
  download: <path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  doc: (
    <>
      <path d="M7 3.5h6.5L18 8v12.5H7Z" />
      <path d="M13.5 3.5V8H18M9.5 12.5h5M9.5 16h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
};

export function Icon({ name, size = 18, className = "", stroke = 2 }: { name: keyof typeof PATHS | string; size?: number; className?: string; stroke?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}

export function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" />
    </svg>
  );
}

export function AppleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className="animate-spin motion-reduce:animate-none">
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------- surfaces

export function Card({
  title,
  action,
  onAction,
  note,
  children,
  className = "",
  pad = "px-5 py-[18px] sm:px-6 sm:py-[22px]",
}: {
  title?: string;
  action?: string;
  onAction?: () => void;
  note?: string | null;
  children?: ReactNode;
  className?: string;
  pad?: string;
}) {
  return (
    <section className={`card ${pad} ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          {title && <h2 className="m-0 text-card font-[650] tracking-[-0.01em] text-ink">{title}</h2>}
          {action && (
            <button type="button" onClick={onAction} className="inline-flex items-center gap-0.5 whitespace-nowrap text-label font-semibold text-accent">
              {action}
              <Icon name="chevron_right" size={16} />
            </button>
          )}
        </div>
      )}
      {note && <p className="-mt-2 mb-4 text-tiny text-ink-3">{note}</p>}
      {children}
    </section>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`skeleton block ${className}`} />;
}

/** web_stat: a figure on a tile; missing → «Non disponibile» in grey, never 0. */
export function Stat({ label, value, na, loading = false }: { label: string; value: string | null; na: string; loading?: boolean }) {
  return (
    <div className="tile flex min-w-0 flex-col gap-1.5 px-[18px] py-4">
      <span className="text-meta font-semibold text-ink-2">{label}</span>
      {loading ? (
        <Skeleton className="h-[26px] w-20" />
      ) : value === null ? (
        <span className="text-row text-ink-3">{na}</span>
      ) : (
        <span className="tnum text-stat font-[650] tracking-[-0.01em] text-ink">{value}</span>
      )}
    </div>
  );
}

/** web_kv: label left, value right; a link value is turquoise; missing is grey. */
export function KeyValue({ rows, na, columns = 1 }: { rows: { label: string; value: string | null; href?: string }[]; na: string; columns?: 1 | 2 }) {
  return (
    <dl className={`m-0 grid gap-x-10 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {rows.map((r) => (
        <div key={r.label} className="flex min-h-[44px] items-center justify-between gap-4 border-b border-hair py-2.5 last:border-b-0">
          <dt className="text-row text-ink-2">{r.label}</dt>
          <dd className="m-0 min-w-0 text-right text-row font-semibold break-words">
            {r.value === null ? (
              <span className="font-normal text-ink-3">{na}</span>
            ) : r.href ? (
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-accent">
                {r.value}
              </a>
            ) : (
              <span className="text-ink">{r.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** web_na_line and the soft notices: an info line on a quiet box. */
export function InfoLine({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" }) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`flex items-start gap-3 rounded-tile px-4 py-3.5 text-label ${tone === "error" ? "text-warn" : "text-ink-2"}`}
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <Icon name={tone === "error" ? "alert" : "info"} size={18} className="mt-px" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/** kit notice: one amber line with an optional turquoise action (errors are never a box). */
export function Notice({ text, action, onAction, className = "" }: { text: string; action?: string; onAction?: () => void; className?: string }) {
  return (
    <p role="alert" className={`m-0 flex items-center gap-2 text-label text-warn ${className}`}>
      <Icon name="alert" size={16} />
      <span>
        {text}
        {action && (
          <>
            {" "}
            <button type="button" onClick={onAction} className="font-semibold text-accent">
              {action}
            </button>
          </>
        )}
      </span>
    </p>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="raised flex h-14 w-14 items-center justify-center rounded-tile text-accent-soft">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="m-0 text-card font-[650] text-ink">{title}</h3>
      {body && <p className="m-0 max-w-[420px] text-row text-ink-2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, retry, onRetry }: { title: string; retry: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <span className="raised flex h-14 w-14 items-center justify-center rounded-tile text-warn">
        <Icon name="alert" size={26} />
      </span>
      <h3 className="m-0 text-card font-[650] text-ink">{title}</h3>
      <SecondaryButton onClick={onRetry}>{retry}</SecondaryButton>
    </div>
  );
}

// ---------------------------------------------------------------- buttons

export function PrimaryButton({ children, disabled, loading, type = "submit", onClick }: { children: ReactNode; disabled?: boolean; loading?: boolean; type?: "submit" | "button"; onClick?: () => void }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className="primary flex h-[46px] w-full items-center justify-center gap-2 rounded-control text-[16px] font-bold"
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  full = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`raised inline-flex h-[46px] items-center justify-center gap-2.5 rounded-control px-5 text-[16px] font-semibold text-ink disabled:opacity-40 ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-row font-semibold text-accent">
      {children}
    </button>
  );
}

/** The kit's segmented control: the lighter pill marks the choice. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`chip flex h-[46px] items-center gap-1 rounded-full p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex h-full min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full border border-transparent px-3 text-row font-semibold sm:px-6 ${o.value === value ? "pill-on" : "text-ink-2"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** web_source: the data source, the update date and the notice, at the foot of every tab. */
export function SourceLine({ source, disclaimer, updated }: { source: string; disclaimer: string; updated?: string | null }) {
  return (
    <footer className="mt-2 flex flex-col gap-1.5 border-t border-hair pt-4 text-tiny text-ink-3">
      <span>{updated ? `${source} · ${updated}` : source}</span>
      <span>{disclaimer}</span>
    </footer>
  );
}

/** The day's change pill: lime rise, red fall, grey zero with no sign. */
export function ChangePill({ value, lang, size = "md" }: { value: number | null; lang: Lang; size?: "md" | "sm" }) {
  if (value === null) return null;
  const rounded = Number(value.toFixed(2));
  const tone = rounded > 0 ? "bg-[rgba(137,243,54,0.14)] text-up" : rounded < 0 ? "bg-[rgba(255,69,58,0.14)] text-down" : "bg-[rgba(255,255,255,0.08)] text-ink-2";
  return (
    <span className={`tnum inline-flex items-center whitespace-nowrap rounded-badge px-2 font-bold ${size === "md" ? "h-6 text-label" : "h-[22px] text-meta"} ${tone}`}>
      {formatChange(rounded, lang)}
    </span>
  );
}

/** A stock's logo, or its initials on the raised tile (kit.monogram). */
export function StockLogo({ symbol, url, size = 40 }: { symbol: string; url?: string | null; size?: number }) {
  const radius = size >= 52 ? 18 : 12;
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation server
      <img src={url} alt="" width={size} height={size} className="flex-none object-cover" style={{ width: size, height: size, borderRadius: radius, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)" }} />
    );
  }
  return (
    <span
      aria-hidden
      className="raised inline-flex flex-none items-center justify-center font-bold text-ink"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size >= 52 ? 17 : 12 }}
    >
      {symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
    </span>
  );
}
