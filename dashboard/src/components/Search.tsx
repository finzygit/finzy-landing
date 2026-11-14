"use client";

// MOB-1198 (FZW-WEB-02): web_search and web_results. The kit's search capsule
// (40 in the bar, 52 on the search page), results with the highlighted row,
// loading, no result, error with Riprova. Arrows move, Enter opens.
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useApp } from "@/lib/app";
import { formatChange, formatMoney, toNumber } from "@/lib/format";
import type { StockHeader } from "@/lib/types";
import { Icon, Notice, Skeleton, StockLogo } from "./ui";

export function stockHref(symbol: string, tab?: string): string {
  return `/titolo?s=${encodeURIComponent(symbol)}${tab && tab !== "summary" ? `&tab=${tab}` : ""}`;
}

export type ResultRow = Pick<StockHeader, "symbol" | "name" | "exchange" | "currency" | "last_price" | "day_change_percent" | "logo_url">;

export function metaLine(r: Pick<StockHeader, "symbol" | "exchange" | "currency">): string {
  return [r.symbol, r.exchange, r.currency].filter(Boolean).join(" · ");
}

export function ResultsList({
  rows,
  active,
  onPick,
  onHover,
  listId,
}: {
  rows: ResultRow[];
  active: number;
  onPick: (r: ResultRow) => void;
  onHover?: (i: number) => void;
  listId?: string;
}) {
  const { lang, t } = useApp();
  return (
    <ul id={listId} role="listbox" className="m-0 flex list-none flex-col p-0">
      {rows.map((r, i) => {
        const price = toNumber(r.last_price);
        return (
          <li key={r.symbol} role="option" aria-selected={i === active} id={listId ? `${listId}-${i}` : undefined}>
            <button
              type="button"
              tabIndex={-1}
              onMouseEnter={() => onHover?.(i)}
              onClick={() => onPick(r)}
              className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left ${i === active ? "bg-[rgba(255,255,255,0.06)]" : ""}`}
            >
              <StockLogo symbol={r.symbol} url={r.logo_url} size={32} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-row font-semibold text-ink">{r.name}</span>
                <span className="truncate text-meta text-ink-3">{metaLine(r)}</span>
              </span>
              <span className="flex flex-col items-end">
                {price === null ? <span className="text-meta text-ink-3">{t("na")}</span> : <span className="tnum text-row font-semibold text-ink">{formatMoney(price, r.currency, lang)}</span>}
                {r.day_change_percent !== null && (
                  <span className={`tnum text-label font-bold ${(r.day_change_percent ?? 0) > 0 ? "text-up" : (r.day_change_percent ?? 0) < 0 ? "text-down" : "text-ink-2"}`}>
                    <ChangeText value={r.day_change_percent} />
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChangeText({ value }: { value: number | null }) {
  const { lang } = useApp();
  if (value === null) return null;
  return <span>{formatChange(Number(value.toFixed(2)), lang)}</span>;
}

type SearchState = { q: string; status: "idle" | "loading" | "ready" | "error"; rows: ResultRow[] };

/** The search with its results. `hero`: the 52 capsule of the search page. */
export function StockSearch({ hero = false, autoFocus = false, onIdle }: { hero?: boolean; autoFocus?: boolean; onIdle?: (idle: boolean) => void }) {
  const { api, t } = useApp();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [state, setState] = useState<SearchState>({ q: "", status: "idle", rows: [] });
  const [active, setActive] = useState(0);
  const [focus, setFocus] = useState(false);
  const [tick, setTick] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const q = value.trim();

  useEffect(() => {
    onIdle?.(q === "");
  }, [q, onIdle]);

  useEffect(() => {
    if (q === "") return;
    let alive = true;
    const timer = window.setTimeout(() => {
      setState({ q, status: "loading", rows: [] });
      api
        .get<ResultRow[]>("/dashboard/search", { q })
        .then((rows) => alive && (setState({ q, status: "ready", rows: rows ?? [] }), setActive(0)))
        .catch(() => alive && setState({ q, status: "error", rows: [] }));
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [api, q, tick]);

  const open = (r: ResultRow) => {
    setValue("");
    router.push(stockHref(r.symbol));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (state.status !== "ready" || state.rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(state.rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      open(state.rows[active] ?? state.rows[0]);
    } else if (e.key === "Escape") {
      setValue("");
    }
  };

  const showPanel = q !== "" && (hero || focus);
  const current = state.q === q ? state : { q, status: "loading" as const, rows: [] };
  const h = hero ? "h-[52px]" : "h-10";

  return (
    <div className="relative w-full" onFocus={() => setFocus(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setTimeout(() => setFocus(false), 120)}>
      <div role="search" className={`${h} flex items-center gap-2.5 rounded-control pl-4 pr-3.5 ${focus || hero ? "capsule-focus" : "capsule"}`}>
        <Icon name="search" size={hero ? 20 : 18} className={focus || hero ? "text-accent" : "text-ink-3"} />
        <input
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder={t("search_ph")}
          aria-label={t("search_ph")}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={current.status === "ready" && current.rows.length ? `${listId}-${active}` : undefined}
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-3 ${hero ? "text-[17px]" : "text-row"}`}
          style={{ outline: "none" }}
        />
        {value && (
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[rgba(255,255,255,0.18)] text-ink"
          >
            <Icon name="close" size={12} stroke={3} />
          </button>
        )}
      </div>
      {showPanel && (
        <div className={`card z-20 mt-3 overflow-hidden py-1.5 ${hero ? "" : "absolute left-0 right-0 top-full"}`} style={{ borderRadius: 18 }}>
          {current.status === "loading" && (
            <div className="flex flex-col gap-3 px-3.5 py-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-[12px]" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          )}
          {current.status === "error" && (
            <div className="px-4 py-3">
              <Notice text={t("search_error")} action={t("retry")} onAction={() => setTick((n) => n + 1)} />
            </div>
          )}
          {current.status === "ready" && current.rows.length === 0 && (
            <div className="flex flex-col gap-1 px-4 py-3">
              <span className="text-row font-semibold text-ink">{t("search_empty", { q })}</span>
              <span className="text-meta text-ink-2">{t("search_scope")}</span>
            </div>
          )}
          {current.status === "ready" && current.rows.length > 0 && <ResultsList rows={current.rows} active={active} onPick={open} onHover={setActive} listId={listId} />}
        </div>
      )}
    </div>
  );
}
