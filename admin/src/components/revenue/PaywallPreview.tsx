"use client";

// MOB-1375 (kit R.paywall_preview): the paywall card as the app draws it,
// with the form's prices. Total and monthly price come from the form; in the
// app the stores give them (preview_note). Gold only here (kit rule).

import { useState } from "react";
import { decimal, priceValue, totalOf } from "./format";
import s from "./revenue.module.css";
import { fill, monthsN, T } from "./texts";
import { COUNTRIES, CURRENCY, FORMULAS, MONTHS, type Country, type PromoDraft } from "./types";

const SYM: Record<string, string> = { EUR: "€", GBP: "£" };
const LABEL: Record<Country, string> = { IT: T.it, GB: T.uk };

export function PaywallPreview({ draft }: { draft: PromoDraft }) {
  const offered = draft.countries.length ? COUNTRIES.filter((c) => draft.countries.includes(c)) : COUNTRIES;
  const [picked, setPicked] = useState<Country>("IT");
  const country = offered.includes(picked) ? picked : offered[0];
  const on = FORMULAS.filter((f) => draft.formulas[f].enabled);
  const sym = SYM[CURRENCY[country]];

  return (
    <aside className={s.previewCol} aria-label={T.preview}>
      <strong style={{ fontSize: 17 }}>{T.preview}</strong>
      {offered.length > 1 ? (
        <div className="segmented" role="group" aria-label={T.a_preview_country}>
          {offered.map((c) => (
            <button key={c} type="button" aria-pressed={c === country} onClick={() => setPicked(c)}>
              {LABEL[c]}
            </button>
          ))}
        </div>
      ) : null}
      <div className={s.paywall}>
        {draft.name.trim() ? (
          <span className={s.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
            </svg>{" "}
            {draft.name.trim()}
          </span>
        ) : null}
        <p className={s.unlimited}>Unlimited</p>
        {on.length ? (
          <div className={s.tiles}>
            {on.map((f, i) => {
              const monthly = priceValue(draft.formulas[f].prices[country] ?? "");
              return (
                <div key={f} className={s.tile} data-first={i === 0}>
                  <span>{monthsN(MONTHS[f])}</span>
                  <strong>{monthly !== null ? `${sym} ${decimal(totalOf(monthly, MONTHS[f]))}` : "—"}</strong>
                  <small>{monthly !== null ? fill(T.per_month, { v: `${sym} ${decimal(monthly)}` }) : " "}</small>
                  <i aria-hidden="true" />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="note">{T.preview_empty}</p>
        )}
      </div>
      <p className="note" style={{ fontSize: 13 }}>{T.preview_note}</p>
    </aside>
  );
}
