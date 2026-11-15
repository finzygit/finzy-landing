"use client";

// MOB-1375 (boards ADM-REV-04-azioni-apri/duplica, 05…08 the four steps,
// 09-modifica-*): one promotion.
// - new / duplicate / scheduled: four steps (Chi e quando → Formule e prezzi →
//   Offerte negli store → Controlla e crea), live totals × 3 and × 12, the
//   paywall preview, the server's PromotionRules errors on their field;
// - running: only the end moves, or «Termina ora» (decisions 4, 5);
// - finished, or a role without «Modifica»: read-only, with «Duplica».

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog } from "@/components/shell/overlays";
import { PageHead, Section, StateBlock } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { decimal, fullDayTime, priceForField, priceForServer, priceValue, toLocalInput, totalOf } from "./format";
import { PaywallPreview } from "./PaywallPreview";
import s from "./revenue.module.css";
import { fill, T } from "./texts";
import { COUNTRIES, CURRENCY, emptyDraft, FORMULAS, MONTHS, STATES, type Country, type FormulaKey, type PromoDetail, type PromoDraft, type UserState } from "./types";

export type EditorMode = { kind: "new" } | { kind: "open"; id: number } | { kind: "duplicate"; id: number };

/** ?new=1 · ?id=N · ?duplicate=N (the static export has no dynamic segments); null = the list. */
export function modeOf(q: URLSearchParams | null): EditorMode | null {
  const id = Number(q?.get("id"));
  const dup = Number(q?.get("duplicate"));
  if (q?.get("new") === "1") return { kind: "new" };
  if (Number.isInteger(id) && id > 0) return { kind: "open", id };
  if (Number.isInteger(dup) && dup > 0) return { kind: "duplicate", id: dup };
  return null;
}

const COUNTRY_LABEL: Record<Country, string> = { IT: T.it, GB: T.uk };
const STATE_LABEL: Record<UserState, string> = { trial: T.trial, free: T.free, premium: T.premium };
const SYM: Record<string, string> = { EUR: "€", GBP: "£" };
const F_TITLE: Record<FormulaKey, string> = { quarterly: T.fq, annual: T.fa };
const F_SUB: Record<FormulaKey, string> = { quarterly: T.fq_sub, annual: T.fa_sub };
/** «Ora di Roma» inside a sentence: «(ora di Roma)». */
const romeLower = `${T.rome.slice(0, 1).toLowerCase()}${T.rome.slice(1)}`;
const F_SHORT: Record<FormulaKey, string> = { quarterly: fill(T.months_n, { n: 3 }), annual: fill(T.months_n, { n: 12 }) };
const PRODUCT: Record<FormulaKey, string> = { quarterly: T.monthly, annual: T.annual };
const STEPS = [
  [T.st1, T.st1_sub],
  [T.st2, T.st2_sub],
  [T.st3, T.st3_sub],
  [T.st4, T.st4_sub],
] as const;

type Errors = Record<string, string>;

/** Which step holds a server field («formulas.annual.prices.GB» → 1). */
export function stepOf(field: string): number {
  if (/^formulas\.\w+\.(apple_offer_id|apple_offer_code|google_offer_id)$/.test(field)) return 2;
  if (field.startsWith("formulas")) return 1;
  return 0;
}

const CODE = /^[A-Z0-9]{1,64}$/;

/** The same checks as PromotionRules, for the step being left (the server checks everything again on save). */
export function checkStep(step: number, d: PromoDraft): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!d.name.trim()) e.name = T.e_name;
    const code = d.code.trim().toUpperCase();
    if (!code) e.code = T.e_code;
    else if (!CODE.test(code)) e.code = T.e_code_chars;
    if (!d.starts_at) e.starts_at = T.e_start;
    if (!d.ends_at) e.ends_at = T.e_end;
    else if (d.starts_at && d.ends_at <= d.starts_at) e.ends_at = T.e_end_before;
    if (!d.countries.length) e.countries = T.e_countries;
    if (!d.statuses.length) e.statuses = T.e_states;
  }
  const on = FORMULAS.filter((f) => d.formulas[f].enabled);
  if (step === 1) {
    if (!on.length) e.formulas = T.e_formulas;
    for (const f of on)
      for (const c of d.countries)
        if (priceValue(d.formulas[f].prices[c] ?? "") === null)
          e[`formulas.${f}.prices.${c}`] = c === "GB" ? T.e_price_uk : T.e_price_it;
  }
  if (step === 2) {
    for (const f of on) {
      if (!d.formulas[f].apple_offer_id.trim()) e[`formulas.${f}.apple_offer_id`] = T.e_apple;
      if (!d.formulas[f].google_offer_id.trim()) e[`formulas.${f}.google_offer_id`] = T.e_play;
      const own = d.formulas[f].apple_offer_code.trim().toUpperCase();
      if (own && !CODE.test(own)) e[`formulas.${f}.apple_offer_code`] = T.e_code_chars;
    }
    if (on.length === 2) {
      const code = d.code.trim().toUpperCase();
      const q = d.formulas.quarterly.apple_offer_code.trim().toUpperCase() || code;
      const a = d.formulas.annual.apple_offer_code.trim().toUpperCase() || code;
      if (q && q === a) e[`formulas.${d.formulas.annual.apple_offer_code.trim() ? "quarterly" : "annual"}.apple_offer_code`] ??= T.e_two_codes;
    }
  }
  return e;
}

export function draftOf(p: PromoDetail): PromoDraft {
  const formulas = {} as PromoDraft["formulas"];
  for (const f of FORMULAS) {
    const x = p.formulas[f];
    formulas[f] = { ...x, prices: Object.fromEntries(Object.entries(x.prices).map(([c, v]) => [c, priceForField(v)])) };
  }
  return { name: p.name, code: p.code, starts_at: toLocalInput(p.starts_at), ends_at: toLocalInput(p.ends_at), countries: [...p.countries], statuses: [...p.statuses], formulas };
}

function duplicateOf(p: PromoDetail): PromoDraft {
  const d = draftOf(p);
  return {
    ...d,
    name: fill(T.copy_suffix, { n: p.name }),
    code: "",
    starts_at: "",
    ends_at: "",
    formulas: { quarterly: { ...d.formulas.quarterly, apple_offer_code: "" }, annual: { ...d.formulas.annual, apple_offer_code: "" } },
  };
}

/** The body the server takes: prices with a dot, only the chosen countries' prices. */
export function bodyOf(d: PromoDraft) {
  const formulas = {} as Record<FormulaKey, unknown>;
  for (const f of FORMULAS) {
    const x = d.formulas[f];
    formulas[f] = { ...x, prices: Object.fromEntries(d.countries.map((c) => [c, priceForServer(x.prices[c] ?? "")])) };
  }
  return { name: d.name, code: d.code.trim().toUpperCase(), starts_at: d.starts_at, ends_at: d.ends_at, countries: d.countries, statuses: d.statuses, formulas };
}

export function PromotionEditor({ mode }: { mode: EditorMode }) {
  const { api, can, toast } = useConsole();
  const router = useRouter();
  const id = mode.kind === "new" ? null : mode.id;
  const [res, setRes] = useState<{ id: number; data?: PromoDetail; error?: boolean } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (id === null) return;
    let live = true;
    api.get<PromoDetail>(`/promotions/${id}`).then(
      (d) => live && setRes({ id, data: d }),
      () => live && setRes({ id, error: true }),
    );
    return () => {
      live = false;
    };
  }, [api, id, retry]);

  const back = () => router.push("/promotions");
  if (id !== null && res?.id !== id) return <StateBlock kind="loading" />;
  if (id !== null && !res?.data)
    return (
      <>
        <PageHead title={T.promo_title} crumbs={[T.group, T.promo_title]} />
        <StateBlock kind="error" title={T.promo_err} body={T.promo_err_b} action={<button type="button" className="btn" onClick={() => setRetry((n) => n + 1)}>{T.retry}</button>} />
      </>
    );

  const detail = res?.data ?? null;
  const canUpdate = can("console.promotions.update");
  // A role that only sees cannot create or duplicate (the server answers 403 anyway).
  if (mode.kind !== "open" && !canUpdate) return <StateBlock kind="denied" title={T.denied_t} body={T.denied_b} />;
  if (mode.kind === "open" && detail && (detail.state === "ended" || !canUpdate)) return <ReadOnly p={detail} canDuplicate={canUpdate} />;
  if (mode.kind === "open" && detail && detail.state === "active")
    return <Running p={detail} onDone={back} api={api} toast={toast} reload={() => setRetry((n) => n + 1)} />;

  const initial = mode.kind === "duplicate" && detail ? duplicateOf(detail) : mode.kind === "open" && detail ? draftOf(detail) : emptyDraft();
  return <Stepper key={`${mode.kind}-${id ?? "new"}`} initial={initial} editing={mode.kind === "open" ? detail : null} duplicateOf={mode.kind === "duplicate" ? detail : null} onDone={back} onStale={() => setRetry((n) => n + 1)} />;
}

function Stepper({ initial, editing, duplicateOf: source, onDone, onStale }: { initial: PromoDraft; editing: PromoDetail | null; duplicateOf: PromoDetail | null; onDone: () => void; onStale: () => void }) {
  const { api, toast } = useConsole();
  const [d, setD] = useState<PromoDraft>(initial);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(editing ? 3 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const on = FORMULAS.filter((f) => d.formulas[f].enabled);
  const errorSteps = new Set(Object.keys(errors).map(stepOf));

  const set = (patch: Partial<PromoDraft>) => setD((x) => ({ ...x, ...patch }));
  const setF = (f: FormulaKey, patch: Partial<PromoDraft["formulas"][FormulaKey]>) => setD((x) => ({ ...x, formulas: { ...x.formulas, [f]: { ...x.formulas[f], ...patch } } }));
  const toggle = <K extends "countries" | "statuses">(k: K, v: PromoDraft[K][number], order: readonly string[]) =>
    setD((x) => {
      const list = x[k] as string[];
      const next = list.includes(v) ? list.filter((y) => y !== v) : [...list, v];
      return { ...x, [k]: order.filter((o) => next.includes(o)) };
    });

  const next = () => {
    const e = checkStep(step, d);
    setErrors(e);
    if (Object.keys(e).length) {
      setBanner(T.not_saved);
      return;
    }
    setBanner(null);
    setStep(step + 1);
    setReached((r) => Math.max(r, step + 1));
  };
  const go = (to: number) => {
    if (to <= reached) {
      setStep(to);
      setBanner(null);
    }
  };

  const save = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const body = bodyOf(d);
      const saved = editing ? await api.put<PromoDetail>(`/promotions/${editing.id}`, body) : await api.post<PromoDetail>("/promotions", body);
      toast(editing ? { title: T.saved } : { title: T.created, body: fill(T.created_sub, { n: saved.name, d: fullDayTime(saved.starts_at) }) });
      onDone();
    } catch (e) {
      setBusy(false);
      // It started (or ended) meanwhile: reload, the page then shows what may still change.
      if (e instanceof ApiError && (e.code === "locked" || e.code === "ended")) return onStale();
      const errs = e instanceof ApiError && e.status === 422 && e.code === "invalid" ? ((e.body as { errors?: Errors })?.errors ?? {}) : null;
      if (!errs) {
        setBanner(T.promo_err_b);
        return;
      }
      setErrors(errs);
      const first = Math.min(3, ...Object.keys(errs).map(stepOf));
      // An overlap that appeared after step 1 was checked: say so on the review step, then go back.
      setBanner(errs.statuses?.startsWith("Si sovrappone") ? T.server_moved : T.not_saved);
      setStep(first);
    }
  };

  const err = (k: string) => errors[k];
  const title = editing ? T.edit_title : T.new_title;

  return (
    <>
      <PageHead
        title={title}
        crumbs={[T.group, T.promo_title, editing ? editing.name : T.crumb_new]}
        actions={<button type="button" className="link-btn" style={{ color: "var(--accent)", fontWeight: 700, background: "none", border: 0, cursor: "pointer" }} onClick={() => (dirty ? setLeaving(true) : onDone())}>{T.cancel}</button>}
      />
      <div className={s.editor}>
        <ol className={s.steps} aria-label={T.a_steps}>
          {STEPS.map(([label, sub], i) => {
            const st = errorSteps.has(i) && i !== step ? "error" : i === step ? "current" : i < reached || (i < step) ? "done" : "todo";
            return (
              <li key={label} data-s={st} aria-current={i === step ? "step" : undefined}>
                <span>{st === "done" ? <Icon name="check" size={14} /> : i + 1}</span>
                <button type="button" className={s.stepBtn} disabled={i > reached} onClick={() => go(i)}>
                  <strong>{label}</strong>
                  <small>{sub}</small>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={s.formCol}>
          {source ? <Lock>{fill(T.dup_note, { n: source.name })}</Lock> : null}
          {banner ? (
            <p className="error-line" role="alert">
              {banner}
            </p>
          ) : null}

          {step === 0 ? (
            <>
              <Section title={T.card_promo}>
                <div className={s.grid2}>
                  <Field id="p-name" label={T.name} hint={T.name_hint} error={err("name")}>
                    <input id="p-name" className="input" value={d.name} maxLength={120} aria-invalid={!!err("name")} onChange={(e) => set({ name: e.target.value })} />
                  </Field>
                  <Field id="p-code" label={T.code} hint={T.code_hint} error={err("code")}>
                    <input id="p-code" className="input mono" value={d.code} maxLength={64} aria-invalid={!!err("code")} placeholder={fill(T.ph, { v: "SALDI" })} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
                  </Field>
                  <Field id="p-start" label={T.start} hint={T.rome} error={err("starts_at")}>
                    <input id="p-start" type="datetime-local" className="input" value={d.starts_at} aria-invalid={!!err("starts_at")} onChange={(e) => set({ starts_at: e.target.value })} />
                  </Field>
                  <Field id="p-end" label={T.end} hint={T.rome} error={err("ends_at")}>
                    <input id="p-end" type="datetime-local" className="input" value={d.ends_at} aria-invalid={!!err("ends_at")} onChange={(e) => set({ ends_at: e.target.value })} />
                  </Field>
                </div>
              </Section>
              <Section title={T.card_who}>
                <Checks label={T.countries} error={err("countries")} options={COUNTRIES.map((c) => [c, COUNTRY_LABEL[c]])} value={d.countries} onToggle={(c) => toggle("countries", c as Country, COUNTRIES)} />
                <Checks label={T.states} error={err("statuses")} options={STATES.map((x) => [x, STATE_LABEL[x]])} value={d.statuses} onToggle={(x) => toggle("statuses", x as UserState, STATES)} />
              </Section>
            </>
          ) : null}

          {step === 1 ? (
            <Section title={T.st2}>
              {err("formulas") ? <p className={s.err} role="alert">{err("formulas")}</p> : null}
              {FORMULAS.map((f) => (
                <div key={f} style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16, borderBottom: "1px solid var(--hair)" }}>
                  <div className={s.formulaHead}>
                    <div>
                      <strong style={{ fontSize: 17 }}>{F_TITLE[f]}</strong>
                      <span className={s.sub2} style={{ fontSize: 14 }}>{F_SUB[f]}</span>
                    </div>
                    <button type="button" role="switch" aria-checked={d.formulas[f].enabled} aria-label={F_TITLE[f]} className={s.switch} onClick={() => setF(f, { enabled: !d.formulas[f].enabled })} />
                  </div>
                  {d.formulas[f].enabled ? (
                    <div className={s.grid2}>
                      {d.countries.map((c) => {
                        const k = `formulas.${f}.prices.${c}`;
                        const v = priceValue(d.formulas[f].prices[c] ?? "");
                        const sym = SYM[CURRENCY[c]];
                        return (
                          <Field key={c} id={`p-${f}-${c}`} label={c === "IT" ? T.price_it : T.price_uk} error={err(k)}>
                            <span className={s.money}>
                              <input id={`p-${f}-${c}`} className="input" inputMode="decimal" value={d.formulas[f].prices[c] ?? ""} aria-invalid={!!err(k)} onChange={(e) => setF(f, { prices: { ...d.formulas[f].prices, [c]: e.target.value } })} />
                              <span>{CURRENCY[c]}</span>
                            </span>
                            <span className={s.hint}>
                              {T.total} <strong style={{ color: "var(--text)" }}>{v !== null ? `${sym} ${decimal(totalOf(v, MONTHS[f]))}` : "—"}</strong> · {fill(T.times, { n: MONTHS[f] })}
                            </span>
                          </Field>
                        );
                      })}
                    </div>
                  ) : (
                    <span className={s.hint}>{T.off}</span>
                  )}
                </div>
              ))}
              <p className="note" style={{ fontSize: 14 }}>{T.price_note}</p>
            </Section>
          ) : null}

          {step === 2
            ? on.map((f) => (
                <Section key={f} title={F_TITLE[f]}>
                  <div className={s.grid2}>
                    <Field id={`p-${f}-ao`} label={T.apple_offer} hint={fill(T.apple_offer_hint, { p: PRODUCT[f] })} error={err(`formulas.${f}.apple_offer_id`)}>
                      <input id={`p-${f}-ao`} className="input" value={d.formulas[f].apple_offer_id} aria-invalid={!!err(`formulas.${f}.apple_offer_id`)} onChange={(e) => setF(f, { apple_offer_id: e.target.value })} />
                    </Field>
                    <Field id={`p-${f}-ac`} label={T.apple_code} hint={T.apple_code_hint} error={err(`formulas.${f}.apple_offer_code`)}>
                      <input id={`p-${f}-ac`} className="input mono" value={d.formulas[f].apple_offer_code} aria-invalid={!!err(`formulas.${f}.apple_offer_code`)} placeholder={d.code} onChange={(e) => setF(f, { apple_offer_code: e.target.value.toUpperCase() })} />
                    </Field>
                    <Field id={`p-${f}-go`} label={T.play_offer} hint={fill(T.play_offer_hint, { p: PRODUCT[f] })} error={err(`formulas.${f}.google_offer_id`)}>
                      <input id={`p-${f}-go`} className="input" value={d.formulas[f].google_offer_id} aria-invalid={!!err(`formulas.${f}.google_offer_id`)} onChange={(e) => setF(f, { google_offer_id: e.target.value })} />
                    </Field>
                  </div>
                </Section>
              ))
            : null}

          {step === 3 ? (
            <>
              <Lock>{T.lock_review}</Lock>
              <Summary d={d} onEdit={go} />
            </>
          ) : null}

          <div className={s.footer}>
            {step > 0 ? (
              <button type="button" className="btn" onClick={() => go(step - 1)} disabled={busy}>
                {T.back}
              </button>
            ) : null}
            <span className={s.grow} />
            <span className="muted" style={{ fontSize: 14 }}>{fill(T.step_n, { n: step + 1 })}</span>
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={next}>
                {T.next}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={save} disabled={busy} aria-busy={busy || undefined}>
                {busy ? "…" : editing ? T.save : T.create}
              </button>
            )}
          </div>
        </div>

        <PaywallPreview draft={d} />
      </div>
      {leaving ? <ConfirmDialog title={T.leave_t} message={T.leave_b} confirmLabel={T.leave_ok} cancelLabel={T.leave_stay} onConfirm={onDone} onCancel={() => setLeaving(false)} /> : null}
    </>
  );
}

/** A running promotion (decisions 4, 5): only the end moves, or it ends now. */
function Running({ p, onDone, api, toast, reload }: { p: PromoDetail; onDone: () => void; api: ReturnType<typeof useConsole>["api"]; toast: ReturnType<typeof useConsole>["toast"]; reload: () => void }) {
  const draft = useMemo(() => draftOf(p), [p]);
  const [end, setEnd] = useState(draft.ends_at);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stopping, setStopping] = useState<{ busy: boolean; error: string | null } | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    setBanner(null);
    try {
      // Only the end: fields left out stay as stored on the server (a Filament row may hold prices the form does not show).
      const saved = await api.put<PromoDetail>(`/promotions/${p.id}`, { ends_at: end });
      toast({ title: T.saved, body: fill(T.saved_sub, { n: saved.name, d: fullDayTime(saved.ends_at) }) });
      onDone();
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 422 && e.code === "invalid") setError((e.body as { errors?: Errors })?.errors?.ends_at ?? T.not_saved);
      else if (e instanceof ApiError && (e.code === "locked" || e.code === "ended")) reload();
      else setBanner(T.promo_err_b);
    }
  };
  const stop = async () => {
    setStopping({ busy: true, error: null });
    try {
      await api.post(`/promotions/${p.id}/end`);
      toast({ title: T.stop_done, body: fill(T.stop_done_sub, { n: p.name }) });
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setStopping(null);
        return reload();
      }
      setStopping({ busy: false, error: T.stop_err });
    }
  };

  return (
    <>
      <PageHead title={T.edit_title} crumbs={[T.group, T.promo_title, p.name]} actions={<button type="button" className="link-btn" style={{ color: "var(--accent)", fontWeight: 700, background: "none", border: 0, cursor: "pointer" }} onClick={onDone}>{T.cancel}</button>} />
      <div className={s.editor} data-steps="false">
        <div className={s.formCol}>
          <Lock>{T.lock_running}</Lock>
          {banner ? <p className="error-line" role="alert">{banner}</p> : null}
          <Section title={T.st1}>
            <div style={{ maxWidth: 500 }}>
              <Field id="p-end" label={T.end_field} hint={T.rome} error={error ?? undefined}>
                <input id="p-end" type="datetime-local" className="input" value={end} aria-invalid={!!error} onChange={(e) => setEnd(e.target.value)} />
              </Field>
            </div>
            <div className={s.grid2}>
              <Locked label={T.name}>{p.name}</Locked>
              <Locked label={T.code}><span className={s.code}>{p.code}</span></Locked>
              <Locked label={T.start}>{fullDayTime(p.starts_at)} ({romeLower})</Locked>
              <Locked label={T.countries_short}>{p.countries.map((c) => COUNTRY_LABEL[c]).join(", ")}</Locked>
              <Locked label={T.states}>{p.statuses.map((x) => STATE_LABEL[x]).join(", ")}</Locked>
            </div>
          </Section>
          <FormulaRows p={p} />
          <OfferRows p={p} />
          <div className={s.footer}>
            <button type="button" className="btn btn-danger" onClick={() => setStopping({ busy: false, error: null })}>
              {T.m_stop}
            </button>
            <span className={s.grow} />
            <button type="button" className="btn btn-primary" disabled={busy || end === draft.ends_at} onClick={save}>
              {busy ? "…" : T.save}
            </button>
          </div>
          <History p={p} />
        </div>
        <PaywallPreview draft={draft} />
      </div>
      {stopping ? (
        <ConfirmDialog
          title={fill(T.stop_t, { n: p.name })}
          message={T.stop_b}
          confirmLabel={T.m_stop}
          busy={stopping.busy}
          error={stopping.error}
          onConfirm={stop}
          onCancel={() => !stopping.busy && setStopping(null)}
        />
      ) : null}
    </>
  );
}

/** A finished promotion, or a role that only sees: read-only, «Duplica». */
function ReadOnly({ p, canDuplicate }: { p: PromoDetail; canDuplicate: boolean }) {
  const router = useRouter();
  return (
    <>
      <PageHead
        title={p.name}
        crumbs={[T.group, T.promo_title, p.name]}
        actions={canDuplicate ? <button type="button" className="btn" onClick={() => router.push(`/promotions?duplicate=${p.id}`)}><Icon name="copy" size={17} /> {T.m_dup}</button> : null}
      />
      <div className={s.formCol}>
        {p.state === "ended" ? <Lock>{T.ended_note}</Lock> : null}
        <Summary d={draftOf(p)} />
        <History p={p} />
      </div>
    </>
  );
}

function Summary({ d, onEdit }: { d: PromoDraft; onEdit?: (step: number) => void }) {
  const on = FORMULAS.filter((f) => d.formulas[f].enabled);
  const edit = (i: number) =>
    onEdit ? (
      <button type="button" className="link-btn" style={{ color: "var(--accent)", fontWeight: 700, background: "none", border: 0, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }} onClick={() => onEdit(i)}>
        <Icon name="edit" size={16} /> {T.m_edit}
      </button>
    ) : undefined;
  const when = (v: string) => (v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)} · ${v.slice(11, 16)} (${romeLower})` : "—");
  return (
    <>
      <Section title={T.st1} action={edit(0)}>
        <div>
          <Row k={T.name} v={d.name} />
          <Row k={T.code} v={<span className={s.code}>{d.code.toUpperCase()}</span>} />
          <Row k={T.start} v={when(d.starts_at)} />
          <Row k={T.end} v={when(d.ends_at)} />
          <Row k={T.countries_short} v={d.countries.map((c) => COUNTRY_LABEL[c]).join(", ")} />
          <Row k={T.states} v={d.statuses.map((x) => STATE_LABEL[x]).join(", ")} />
        </div>
      </Section>
      <Section title={T.st2} action={edit(1)}>
        <div>
          {on.flatMap((f) =>
            d.countries.map((c) => {
              const v = priceValue(d.formulas[f].prices[c] ?? "");
              const sym = SYM[CURRENCY[c]];
              return <Row key={`${f}${c}`} k={`${F_SHORT[f]} · ${COUNTRY_LABEL[c]}`} v={v !== null ? fill(T.price_total, { p: `${sym} ${decimal(v)}`, t: `${sym} ${decimal(totalOf(v, MONTHS[f]))}` }) : "—"} />;
            }),
          )}
        </div>
      </Section>
      <Section title={T.st3} action={edit(2)}>
        <div>
          {on.flatMap((f) => [
            <Row key={`${f}a`} k={`${F_SHORT[f]} · App Store`} v={fill(T.offer_code, { o: d.formulas[f].apple_offer_id, c: (d.formulas[f].apple_offer_code || d.code).toUpperCase() })} />,
            <Row key={`${f}g`} k={`${F_SHORT[f]} · Google Play`} v={d.formulas[f].google_offer_id} />,
          ])}
        </div>
      </Section>
    </>
  );
}

function FormulaRows({ p }: { p: PromoDetail }) {
  const d = draftOf(p);
  return (
    <Section title={T.st2}>
      <div>
        {FORMULAS.filter((f) => d.formulas[f].enabled).flatMap((f) =>
          d.countries.map((c) => {
            const v = priceValue(d.formulas[f].prices[c] ?? "");
            const sym = SYM[CURRENCY[c]];
            return <Row key={`${f}${c}`} k={`${F_SHORT[f]} · ${COUNTRY_LABEL[c]}`} v={v !== null ? fill(T.price_total, { p: `${sym} ${decimal(v)}`, t: `${sym} ${decimal(totalOf(v, MONTHS[f]))}` }) : "—"} />;
          }),
        )}
      </div>
    </Section>
  );
}

function OfferRows({ p }: { p: PromoDetail }) {
  const d = draftOf(p);
  return (
    <Section title={T.st3}>
      <div>
        {FORMULAS.filter((f) => d.formulas[f].enabled).flatMap((f) => [
          <Row key={`${f}a`} k={`${F_SHORT[f]} · App Store`} v={fill(T.offer_code, { o: d.formulas[f].apple_offer_id, c: (d.formulas[f].apple_offer_code || d.code).toUpperCase() })} />,
          <Row key={`${f}g`} k={`${F_SHORT[f]} · Google Play`} v={d.formulas[f].google_offer_id} />,
        ])}
      </div>
    </Section>
  );
}

function History({ p }: { p: PromoDetail }) {
  const c = p.history.created;
  const u = p.history.updated;
  if (!c || !u) return null;
  const short = (iso: string) => {
    const x = fullDayTime(iso);
    return `${x.slice(0, 5)} ${x.slice(-5)}`;
  };
  return <p className="note" style={{ fontSize: 13 }}>{fill(T.history, { a: c.by ?? "—", d: short(c.at), b: u.by ?? "—", e: short(u.at) })}</p>;
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className={s.reviewRow}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

function Locked({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className={s.lockedLabel}>
        {label} <Icon name="lock" size={13} />
      </span>
      <strong>{children}</strong>
    </div>
  );
}

function Lock({ children }: { children: ReactNode }) {
  return (
    <div className={s.lock} role="note">
      <Icon name="lock" size={16} />
      <span>{children}</span>
    </div>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <span className={s.err} role="alert">{error}</span> : hint ? <span className={s.hint}>{hint}</span> : null}
    </div>
  );
}

function Checks({ label, options, value, onToggle, error }: { label: string; options: [string, string][]; value: string[]; onToggle: (v: string) => void; error?: string }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <span className={s.hint} style={{ fontSize: 14, color: "var(--text-2)", paddingLeft: 4 }}>{label}</span>
      <div className={s.checks}>
        {options.map(([v, l]) => (
          <button key={v} type="button" role="checkbox" aria-checked={value.includes(v)} aria-invalid={!!error || undefined} className={s.check} onClick={() => onToggle(v)}>
            <span className={s.box}>{value.includes(v) ? <Icon name="check" size={12} /> : null}</span>
            {l}
          </button>
        ))}
      </div>
      {error ? <span className={s.err} role="alert">{error}</span> : null}
    </div>
  );
}
