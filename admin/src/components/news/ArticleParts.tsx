"use client";

// MOB-1376 (board ADM-NEWS-03): the article page's blocks: the app-like
// preview, the linked stocks with their verdicts, the stock search to add one.

import { useEffect, useRef, useState } from "react";
import { useConsole } from "@/lib/console";
import { dayTime, type Article, type Link, type SummaryBlock } from "@/lib/news";
import { NewsIcon } from "./NewsIcon";
import { Confidence, StockLogo, TypeChip, VerdictButtons, type Verdict } from "./parts";
import styles from "./news.module.css";

const SECTIONS: Record<"it" | "en", [keyof SummaryBlock, string][]> = {
  it: [["happening", "1. Cosa sta succedendo?"], ["meaning", "2. Che cosa significa?"], ["effects", "3. Che effetti avrà sul mercato?"], ["care", "4. Perché dovrei interessarmi?"]],
  en: [["happening", "1. What is happening?"], ["meaning", "2. What does it mean?"], ["effects", "3. What effect will it have on the market?"], ["care", "4. Why should I care?"]],
};

/** «Come lo vede l’app»: picture, title, source and time, the 4-section AI summary (read-only, decision 3). */
export function AppPreview({ a, lang }: { a: Article; lang: "it" | "en" }) {
  const summary = a.summary?.[lang] ?? null;
  const title = a.title[lang] || a.title.it || a.title.en;
  return (
    <div className={styles.phone} aria-label="Anteprima dell’app">
      {a.image?.url ?? a.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.image?.url ?? a.image_url ?? ""} alt="" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 20 }} />
      ) : (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16 / 9", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "var(--text-3)" }}>
          <NewsIcon name="clock" size={22} />
        </span>
      )}
      <h3>{title}</h3>
      <span className="note">{a.source?.name} · {dayTime(a.created_at)}</span>
      {summary ? (
        <>
          <span className="note">{lang === "it" ? "Sintesi generata da IA" : "AI-generated summary"}</span>
          {SECTIONS[lang].map(([k, label]) =>
            summary[k] ? (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h4>{label}</h4>
                <p>{summary[k]}</p>
              </div>
            ) : null,
          )}
        </>
      ) : (
        <p className="note" style={{ fontSize: 14 }}>
          {a.is_movement ? "Un movimento: l’app mostra solo il titolo." : a.summary_state === "ready" ? "Il riassunto in questa lingua non c’è." : a.summary_state === "pending" ? "Riassunto in preparazione: l’app non mostra ancora l’articolo." : "Non è nel feed della Home: l’app non mostra questo articolo."}
        </p>
      )}
    </div>
  );
}

export function LinkLine({ l, readOnly, busy, onVerdict }: { l: Link; readOnly: boolean; busy: Verdict | null; onVerdict: (v: Verdict) => void }) {
  return (
    <div className={styles.linkRow} data-removed={l.removed || undefined}>
      <StockLogo symbol={l.symbol} url={l.logo_url} />
      <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <span>
          <strong>{l.symbol}</strong> <span style={{ color: "var(--text-2)" }}>{l.name}</span>
        </span>
        <span style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <TypeChip type={l.type} legacy={l.legacy} />
          {l.confidence !== null ? <Confidence value={l.confidence} /> : null}
          {l.removed ? <span className="muted">Rimosso dall’articolo</span> : null}
        </span>
        {l.reason ? <span className="note" style={{ fontSize: 14 }}>{l.reason}</span> : null}
        {l.reviewed_by && l.review ? <span className="note">Giudicato da {l.reviewed_by.name}, {dayTime(l.reviewed_at)}</span> : null}
      </div>
      {l.removed ? null : <VerdictButtons review={l.review} onVerdict={onVerdict} disabled={readOnly} busy={busy} />}
    </div>
  );
}

type Hit = { id: number; symbol: string; name: string; logo_url: string | null; exchange: string | null };

/** «Aggiungi un titolo»: search by symbol or name (10 answers, never the whole list: the old select loaded 32k stocks). */
export function StockSearch({ onPick, onClose }: { onPick: (h: Hit) => void; onClose: () => void }) {
  const { api } = useConsole();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (!q.trim()) return;
    let live = true;
    const t = setTimeout(() => {
      api.get<{ rows: Hit[] }>("/news/stocks", { q: q.trim() }).then(
        (r) => live && (setHits(r.rows), setError(false)),
        () => live && setError(true),
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [api, q]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 520 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          ref={input}
          className="input"
          style={{ height: 44 }}
          placeholder="Cerca un titolo per simbolo o nome"
          aria-label="Cerca un titolo"
          value={q}
          onChange={(e) => (setQ(e.target.value), e.target.value.trim() ? undefined : setHits(null))}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
        <button type="button" className="btn" style={{ height: 44 }} onClick={onClose}>
          Annulla
        </button>
      </div>
      {error ? <p className="error-line">Ricerca non riuscita. Riprova.</p> : null}
      {hits && q.trim() ? (
        hits.length ? (
          <ul aria-label="Titoli trovati" style={{ listStyle: "none", margin: 0, padding: 6, borderRadius: 16, background: "var(--menu-bg)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {hits.map((h) => (
              <li key={h.id}>
                <button type="button" className="link-btn" style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", padding: "8px 10px", color: "var(--text)", textAlign: "left" }} onClick={() => onPick(h)}>
                  <StockLogo symbol={h.symbol} url={h.logo_url} size={28} />
                  <strong>{h.symbol}</strong>
                  <span style={{ color: "var(--text-2)", fontWeight: 500, flex: 1 }}>{h.name}</span>
                  <span className="muted" style={{ fontWeight: 500 }}>{h.exchange}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">Nessun titolo trovato.</p>
        )
      ) : null}
    </div>
  );
}
