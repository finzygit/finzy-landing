"use client";

// MOB-1378 (AllocationTable, InstrumentsTable, PortfolioCard): a generation
// read as tables instead of today's raw JSON. A weight is a % aligned right
// with a thin bar (Uniswap, Monarch); classes, then their instruments.

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { RISK_WORD, STATUS_WORD, T, categoryOf, date, pct, type Allocation, type Instrument, type PortfolioCardData } from "@/lib/ai-reports";
import { CatBar, Dot, NUM, ReportStatus, WeightBar } from "./parts";
import { Status } from "@/components/shell/parts";

export function CatLegend({ cats }: { cats: Allocation[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
      {cats.map((c) => (
        <span key={c.category} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-2)" }}>
          <Dot colour={categoryOf(c.category).colour} />
          {categoryOf(c.category).label}
          <strong style={{ color: "var(--text)", ...NUM }}>{pct(c.weight)}</strong>
        </span>
      ))}
    </div>
  );
}

export function AllocationTable({ cats }: { cats: Allocation[] }) {
  const total = Math.round(cats.reduce((s, c) => s + (c.weight ?? 0), 0) * 100) / 100;
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th scope="col" style={{ width: 200 }}>Classe</th>
            <th scope="col" style={{ width: 190 }}>Peso</th>
            <th scope="col">Perché, secondo il modello</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => {
            const cat = categoryOf(c.category);
            return (
              <tr key={c.category}>
                <td><span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 600 }}><Dot colour={cat.colour} />{cat.label}</span></td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <strong style={{ width: 44, textAlign: "right", ...NUM }}>{pct(c.weight)}</strong>
                    <WeightBar value={c.weight} colour={cat.colour} />
                  </span>
                </td>
                <td style={{ color: "var(--text-2)", fontSize: 14, lineHeight: "20px" }}>{c.rationale || "—"}</td>
              </tr>
            );
          })}
          <tr>
            <td><strong>Totale</strong></td>
            <td><strong style={{ display: "inline-block", width: 44, textAlign: "right", ...NUM }}>{pct(total)}</strong></td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function InstrumentsTable({ cats, instruments }: { cats: Allocation[]; instruments: Instrument[] }) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const toggle = (k: string) => {
    const next = new Set(closed);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setClosed(next);
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Strumento</th>
            <th scope="col" style={{ width: 90 }}>Rischio</th>
            <th scope="col" style={{ width: 70, textAlign: "right" }}>Peso</th>
            <th scope="col">Motivazione</th>
          </tr>
        </thead>
        {cats.map((c) => {
          const cat = categoryOf(c.category);
          const mine = instruments.filter((i) => i.category === c.category);
          const open = !closed.has(c.category);
          return (
            <tbody key={c.category}>
              <tr>
                <td colSpan={4} style={{ padding: "10px 0 4px", height: "auto", borderBottom: 0 }}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggle(c.category)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px", background: "rgba(255,255,255,0.03)", border: 0, borderRadius: 12, color: "var(--text)", cursor: "pointer", fontSize: 15 }}
                  >
                    <Icon name={open ? "up" : "down"} size={16} />
                    <Dot colour={cat.colour} />
                    <strong>{cat.label}</strong>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>{mine.length} strumenti</span>
                    <span style={{ flex: 1 }} />
                    <strong style={NUM}>{pct(c.weight)}</strong>
                  </button>
                </td>
              </tr>
              {open
                ? mine.map((i) => (
                    <tr key={`${i.category}-${i.symbol}`}>
                      <td style={{ minWidth: 220 }}>
                        <strong style={{ display: "block", fontSize: 15, lineHeight: "20px", overflowWrap: "anywhere" }}>{i.name}</strong>
                        <span className="sub">{i.symbol}</span>
                      </td>
                      <td style={{ color: "var(--text-2)", fontSize: 14 }}>{i.risk ? RISK_WORD[i.risk] ?? i.risk : "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, ...NUM }}>{pct(i.weight)}</td>
                      <td style={{ color: "var(--text-2)", fontSize: 14, lineHeight: "19px" }}>{i.rationale || "—"}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

/** One portfolio of the Builder with its latest generation; opens it. */
export function PortfolioCard({ p }: { p: PortfolioCardData }) {
  const state = !p.enabled ? "off" : p.latest?.status === "failed" ? "gen_failed" : p.latest?.status === "running" || p.latest?.status === "pending" ? "running" : p.published ? "published" : "none";
  const weights = Object.entries(p.published?.categories ?? {});
  const meta = [
    p.published ? `${p.published.instruments} strumenti` : null,
    p.published ? `prompt v${p.published.prompt_version}` : null,
    p.published?.published_at ? `pubblicato ${date(p.published.published_at)}` : null,
  ].filter(Boolean).join(" · ");
  const note = !p.enabled ? T.pf_off : !p.latest ? T.pf_none : null;
  const target = p.latest?.id ?? p.published?.id;
  const inner = (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <strong style={{ fontSize: 17, color: "var(--text)" }}>{p.name}</strong>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)" }}>{p.risk_profile}</span>
        </div>
        {state === "none" ? null : state === "off" ? <Status kind="off">{STATUS_WORD.off[0]}</Status> : <ReportStatus status={state} />}
      </div>
      {weights.length ? <CatBar weights={weights} /> : <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />}
      {meta ? <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", ...NUM }}>{meta}</span> : null}
      {note ? <span style={{ fontSize: 13, color: "var(--text-3)", lineHeight: "18px" }}>{note}</span> : null}
    </>
  );
  const style: React.CSSProperties = { minHeight: 168, display: "flex", flexDirection: "column", gap: 12, padding: "18px 20px", opacity: p.enabled ? 1 : 0.72, fontWeight: 500 };
  return target && p.enabled ? (
    <Link href={`/portfolio-builder/generazione?id=${target}`} className="card" style={style} aria-label={`${p.name}: apri l’ultima generazione`}>
      {inner}
    </Link>
  ) : (
    <div className="card" style={style}>{inner}</div>
  );
}
