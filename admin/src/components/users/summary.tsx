"use client";

// MOB-1462 (boards ADM-UB-01…ADM-UB-08, kit Kit-ADM-UB-1, design PR #751):
// the numbers above the Utenti list, the two «solo abbonati» donuts with
// their legend, the links to AppsFlyer and Mixpanel, and the «Definizioni»
// footer. Texts are the board's (design/v2/ADMIN-ADM-USERS-B.md); the
// «nuovo» ones wait for Victor's OK (D385).

import type { ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { countryName, fmt, pct, PLATFORM_LABEL, type UsersSummary } from "./model";

const TILE: React.CSSProperties = {
  flex: "1 1 200px",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "16px 18px",
  borderRadius: 22,
  background: "var(--surface)",
  border: "1px solid var(--hair)",
};

function Tile({ label, value, sub, action, loading }: { label: string; value: string; sub?: ReactNode; action?: ReactNode; loading?: boolean }) {
  return (
    <div style={TILE} data-tile={label}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{label}</span>
        {action}
      </div>
      {loading ? (
        <span className="skeleton" aria-hidden="true" style={{ width: 70, height: 30, borderRadius: 8 }} />
      ) : (
        <strong style={{ fontSize: 28, lineHeight: "34px", fontVariantNumeric: "tabular-nums" }}>{value}</strong>
      )}
      <span className="sub" style={{ minHeight: 16, fontVariantNumeric: "tabular-nums" }}>{loading ? "" : sub}</span>
    </div>
  );
}

/** «Paganti», «Free», «Omaggi attivi» (with «Mostra»), «Conversioni 90 gg». */
export function SummaryTiles({ data, failed, onShowGifts }: { data: UsersSummary | null; failed?: boolean; onShowGifts?: () => void }) {
  const loading = !data && !failed;
  const na = "Non disponibile";
  const v = (n: number | undefined) => (data && n !== undefined ? fmt(n) : failed ? "—" : "");
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} aria-busy={loading || undefined}>
      <Tile label="Paganti" loading={loading} value={v(data?.paying.count)} sub={data ? `${pct(data.paying.pct)} del totale` : failed ? na : ""} />
      <Tile label="Free" loading={loading} value={v(data?.free.count)} sub={data ? `${pct(data.free.pct)} del totale` : failed ? na : ""} />
      <Tile
        label="Omaggi attivi"
        loading={loading}
        value={v(data?.gifts_active)}
        sub={data?.gifts_by_tier ? `Premium ${fmt(data.gifts_by_tier.premium)} · Unlimited ${fmt(data.gifts_by_tier.unlimited)}` : failed ? na : ""}
        action={
          data && data.gifts_active > 0 && onShowGifts ? (
            <button type="button" className="link-btn" aria-label="Mostra gli utenti con un omaggio attivo" style={{ fontSize: 13, padding: 0, display: "inline-flex", alignItems: "center", gap: 2 }} onClick={onShowGifts}>
              Mostra <Icon name="chevron" size={14} />
            </button>
          ) : null
        }
      />
      <Tile
        label="Conversioni 90 gg"
        loading={loading}
        value={v(data?.conversions_90d.total)}
        sub={data ? `Premium ${fmt(data.conversions_90d.premium)} · Unlimited ${fmt(data.conversions_90d.unlimited)}` : failed ? na : ""}
      />
    </div>
  );
}

const SLICES = ["#27d8c7", "#b9a4ff", "#7fa7e8", "#f2b84b", "#ff8a7a", "#9eebe5"];
const UNKNOWN = "rgba(236,244,241,0.36)";

type Slice = { label: string; count: number; color: string };

/** A donut with the total in the hole and a legend with count and % (Kajabi on Mobbin). */
function Donut({ title, slices, total }: { title: string; slices: Slice[]; total: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  // The ring and the % share the slices' own sum, so a count that differs from the hole never leaves a gap.
  const sum = slices.reduce((n, s) => n + s.count, 0) || 1;
  // Where each slice starts on the ring: the sum of the slices before it.
  const arcs = slices.map((s, i) => ({ ...s, len: (s.count / sum) * c, start: slices.slice(0, i).reduce((n, p) => n + (p.count / sum) * c, 0) }));
  return (
    <section aria-label={title} style={{ ...TILE, flex: "1 1 340px", gap: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 7, background: "rgba(39,216,199,0.12)", color: "var(--accent-soft)" }}>solo abbonati</span>
      </div>
      {total === 0 ? (
        <p className="muted" style={{ margin: "18px 0", fontSize: 14 }}>Ancora nessun abbonato</p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${fmt(total)} abbonati`} style={{ flex: "none" }}>
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
            {arcs.map((s) => (
              <circle key={s.label} cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${Math.max(s.len - 2, 0.5)} ${c}`} strokeDashoffset={-s.start} transform="rotate(-90 60 60)" />
            ))}
            <text x="60" y="60" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--text)">{fmt(total)}</text>
            <text x="60" y="78" textAnchor="middle" fontSize="11" fill="var(--text-3)">abbonati</text>
          </svg>
          <ul style={{ flex: "1 1 160px", listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {slices.map((s) => (
              <li key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: "none" }} />
                <span style={{ flex: 1, minWidth: 0 }}>{s.label}</span>
                <strong style={{ fontVariantNumeric: "tabular-nums" }}>{s.count}</strong>
                <span className="muted" style={{ width: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round((s.count * 100) / sum)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** «Abbonati per piattaforma» and «Abbonati per Paese», then the AppsFlyer / Mixpanel line. */
export function PayingPies({ data, loading = false }: { data: UsersSummary | null; loading?: boolean }) {
  if (!data) {
    // While the numbers load, keep the donuts' room (no jump when they arrive).
    return loading ? <div className="skeleton" aria-hidden="true" style={{ height: 190, borderRadius: 22 }} /> : null;
  }
  const total = data.paying.count;
  const platform: Slice[] = data.segments.platform.map((p, i) => ({ label: PLATFORM_LABEL[p.key] ?? p.key, count: p.count, color: SLICES[i % SLICES.length] }));
  // «Non noto» last, in grey.
  const known = data.segments.country.filter((c) => c.code);
  const unknown = data.segments.country.filter((c) => !c.code).reduce((n, c) => n + c.count, 0);
  // The five largest, then «Altri», then «Non noto» last in grey.
  const others = known.slice(5).reduce((n, c) => n + c.count, 0);
  const country: Slice[] = [
    ...known.slice(0, 5).map((c, i) => ({ label: countryName(c.code), count: c.count, color: SLICES[i % SLICES.length] })),
    ...(others ? [{ label: "Altri", count: others, color: SLICES[5] }] : []),
    ...(unknown ? [{ label: countryName(null), count: unknown, color: UNKNOWN }] : []),
  ];
  const links = (data.links ?? []).filter((l) => l.url.startsWith("https://"));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Donut title="Abbonati per piattaforma" slices={platform} total={total} />
        <Donut title="Abbonati per Paese" slices={country} total={total} />
      </div>
      {links.length ? (
        <p className="sub" style={{ margin: 0 }}>
          Per tutti gli utenti, non solo gli abbonati:{" "}
          {links.map((l, i) => (
            <span key={l.label}>
              {i ? " · " : ""}
              <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>{l.label}</a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

const DEFS: [string, string][] = [
  ["Paganti", "Utenti con un abbonamento pagato attivo su App Store, Google Play o web, anche se hanno un omaggio sopra. Non contano le prove gratuite."],
  ["Free", "Utenti per cui l’app vede il piano Free. Il resto sono paganti, omaggi e prove gratuite."],
  ["Omaggi attivi", "Piani regalati dal pannello non ancora scaduti né revocati."],
  ["Conversioni 90 gg", "Utenti che hanno iniziato il primo abbonamento pagato negli ultimi 90 giorni. Una prova gratuita conta il giorno in cui diventa pagata; gli omaggi non contano mai."],
  ["Ultimo accesso", "L’ultima volta che l’utente ha usato l’app con il suo accesso. Si registra dal 16/11/2026: prima compare «—»."],
  ["Generazioni 30 gg", "Stock Snapshot, report finanziari e portafogli del portale chiesti dall’utente negli ultimi 30 giorni. Un report avviato da uno Snapshot conta come una generazione in più. Articoli e immagini non contano: non sono di un utente."],
  ["Termini accettati, Privacy accettata", "Quando l’utente ha accettato termini e informativa nell’app. «—»: account più vecchio della data registrata. Nella tabella da 1440 in su; sempre nella scheda."],
  ["Grafici «solo abbonati»", "I grafici contano solo gli abbonati paganti: la piattaforma è lo store dell’abbonamento (Web: pagato sul sito), il Paese quello dello store. «Non noto»: lo store non lo dice."],
];

/** «Definizioni» under the table (item 14 asks for the conversion one; the others say what each number counts). */
export function Definitions() {
  return (
    <section aria-label="Definizioni" style={{ ...TILE, padding: "20px 24px", gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Definizioni</h3>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px 28px" }}>
        {DEFS.map(([t, d]) => (
          <div key={t}>
            <dt style={{ fontSize: 14, fontWeight: 700 }}>{t}</dt>
            <dd style={{ margin: "4px 0 0", fontSize: 13, lineHeight: "19px", color: "var(--text-2)" }}>{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
