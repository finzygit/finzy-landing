"use client";

// MOB-1378 (CoverageRegion, CoverageCard): the coverage of the US and EU
// universes. One stacked bar per region and its three counters; each counter
// is a button that opens «Universo» with that region and group (Deel, Fresha).

import { Icon } from "@/components/shell/Icon";
import { Section } from "@/components/shell/parts";
import { REGION_LABEL, T, freshness, type Coverage, type CoverageGroup } from "@/lib/ai-reports";
import { NUM, StackBar } from "./parts";

const GROUPS: [CoverageGroup, string, string][] = [
  ["complete", T.cov_complete, "var(--accent)"],
  ["incomplete", T.cov_incomplete, "var(--warn)"],
  ["no_filing", T.cov_nofiling, "rgba(236,244,241,0.30)"],
];

/** A coverage filter: a region, a group or both (either may be left open). */
export type CoveragePick = { region?: string; group?: CoverageGroup } | null;

function Region({ region, counts, size, note, selected, onPick }: { region: string; counts: Record<CoverageGroup, number>; size: number; note?: string; selected: CoverageGroup | null; onPick: (g: CoverageGroup) => void }) {
  const tot = GROUPS.reduce((s, [g]) => s + counts[g], 0);
  const name = REGION_LABEL[region] ?? region;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <strong style={{ fontSize: 16 }}>{name}</strong>
        <span style={{ fontSize: 13, color: "var(--text-3)", ...NUM }}>{size} titoli</span>
      </div>
      <StackBar parts={GROUPS.map(([g, , c]) => [counts[g], c])} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {GROUPS.map(([g, label, colour]) => {
          const n = counts[g];
          const on = selected === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              aria-label={`${name}: ${label} ${n}`}
              onClick={() => onPick(g)}
              style={{
                flex: "1 1 120px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderRadius: 14, textAlign: "left", cursor: "pointer",
                background: "rgba(255,255,255,0.025)", border: 0, color: "var(--text)",
                boxShadow: on ? "0 0 0 1px rgba(109,217,225,0.70), 0 0 14px rgba(109,217,225,0.20)" : undefined,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: colour }} />
                {label}
              </span>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 650, lineHeight: "26px", color: n === 0 ? "var(--text-3)" : "var(--text)", ...NUM }}>{n}</span>
                {tot ? <span style={{ fontSize: 13, color: "var(--text-3)", ...NUM }}>· {Math.round((100 * n) / tot)}%</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}

export function CoverageCard({ data, state, picked, onPick, onRetry }: { data: Coverage | null; state: "loading" | "error" | "default"; picked: CoveragePick; onPick: (p: CoveragePick) => void; onRetry: () => void }) {
  let body;
  if (state === "loading") {
    body = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 28 }} aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="skeleton" style={{ width: "40%", height: 16 }} />
            <span className="skeleton" style={{ height: 10 }} />
            <span className="skeleton" style={{ height: 62, borderRadius: 14 }} />
          </div>
        ))}
      </div>
    );
  } else if (state === "error" || !data) {
    body = (
      <p className="error-line" role="alert" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {T.cov_error}
        <button type="button" className="link-btn" onClick={onRetry}>Riprova</button>
      </p>
    );
  } else if (!data.computed_at) {
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <strong style={{ fontSize: 16 }}>{T.cov_empty_t}</strong>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: "20px" }}>{T.cov_empty_b}</p>
      </div>
    );
  } else {
    body = (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 28 }}>
          {Object.entries(data.regions).map(([region, c]) => {
            const euEmpty = region === "EU" && c.complete === 0 && c.incomplete === 0 && c.no_filing > 0;
            return (
              <Region
                key={region}
                region={region}
                counts={c}
                size={c.size}
                note={euEmpty ? T.cov_eu_note : undefined}
                selected={picked?.region === region ? (picked.group ?? null) : null}
                onPick={(g) => onPick(picked?.region === region && picked.group === g ? null : { region, group: g })}
              />
            );
          })}
        </div>
        <div style={{ paddingTop: 14, borderTop: "1px solid var(--hair)", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-3)", fontSize: 13, ...NUM }}>
          <Icon name="info" size={14} />
          {freshness(data.computed_at)}
        </div>
      </>
    );
  }
  return (
    <Section title={T.cov_title} note={T.cov_note}>
      {body}
    </Section>
  );
}
