"use client";

// MOB-1380 (boards ADM-CONTENT-06-impostazioni-*): «Impostazioni app», a typed
// form over what the app reads from the server. Maintenance applies at once
// (turning it on asks first, decision 2); legal links, review prompts and the
// minimum 1.x build wait for «Salva», and a new legal address asks first
// (decision 1: no new consent). No raw keys, no secrets (MOB-1370).

import { useCallback, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog } from "@/components/shell/overlays";
import { Banner, PageHead, StateBlock, Status } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { day, fill, hour, longWhen } from "@/lib/content/format";
import { T } from "@/lib/content/texts";
import type { AppSettings, Lang } from "@/lib/content/types";
import { Card, CRUMB, UploadsTray, LastChangeLine, SaveBar, Switch } from "./bits";
import "./content.css";

type Form = { links: Record<string, string>; ask_review: boolean; ask_review_android: boolean; min_version: string };

const DOC_LABEL: Record<string, string> = { privacy_url: T.lg_privacy, terms_url: T.lg_terms };
const linkKey = (doc: string, l: Lang) => `${doc}_${l}`;
export const validUrl = (v: string) => /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]+$/i.test(v.trim());

const formOf = (s: AppSettings): Form => ({
  links: Object.fromEntries(s.legal.flatMap((d) => (["it", "en"] as Lang[]).map((l) => [linkKey(d.key, l), d.links[l].value ?? ""]))),
  ask_review: s.ask_review,
  ask_review_android: s.ask_review_android,
  min_version: String(s.min_version),
});

export function SettingsPage() {
  const { api, can, toast } = useConsole();
  const canEdit = can("console.content.update");
  const [data, setData] = useState<AppSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"maintenance" | "legal" | null>(null);

  const load = useCallback(
    () =>
      api.get<AppSettings>("/app-settings").then(
        (s) => {
          setData(s);
          setForm(formOf(s));
          setState("ready");
        },
        () => setState("error"),
      ),
    [api],
  );
  useEffect(() => {
    load();
  }, [load]);

  const base = data ? formOf(data) : null;
  const changedLinks = form && base ? Object.keys(form.links).filter((k) => form.links[k].trim() !== base.links[k]) : [];
  const dirty = !!form && !!base && (changedLinks.length > 0 || form.ask_review !== base.ask_review || form.ask_review_android !== base.ask_review_android || form.min_version.trim() !== base.min_version);
  const badLinks = form ? changedLinks.filter((k) => !validUrl(form.links[k])) : [];
  const badMin = !!form && (!/^\d{1,7}$/.test(form.min_version.trim()) || Number(form.min_version.trim()) > 1000000);

  const put = async (body: Record<string, unknown>, okTitle: string) => {
    setBusy(true);
    setError(null);
    try {
      const s = await api.put<AppSettings>("/app-settings", body);
      setData(s);
      setForm(formOf(s));
      setConfirm(null);
      toast({ title: okTitle, body: "La modifica è nel registro attività." });
    } catch {
      setError(T.save_err_srv);
    }
    setBusy(false);
  };

  // Maintenance applies at once and keeps whatever else is being edited on the page.
  const maintenance = async (on: boolean) => {
    setBusy(true);
    try {
      const s = await api.put<AppSettings>("/app-settings", { maintenance: on });
      setData((d) => (d ? { ...d, maintenance: s.maintenance, last_change: s.last_change } : s));
      setConfirm(null);
      toast({ title: on ? T.m_toast_on : T.m_toast_off, body: "La modifica è nel registro attività." });
    } catch {
      setConfirm(null);
      toast({ title: T.save_err, kind: "error" });
    }
    setBusy(false);
  };

  const save = () => {
    if (!form || !base || badLinks.length || badMin) return;
    if (changedLinks.length && confirm !== "legal") {
      setConfirm("legal");
      return;
    }
    const body: Record<string, unknown> = {};
    if (changedLinks.length) {
      // An address equal to the standard one goes back to «standard» (the row is removed).
      body.links = Object.fromEntries(
        changedLinks.map((k) => {
          const [doc, l] = [k.slice(0, -3), k.slice(-2) as Lang];
          const std = data!.legal.find((d) => d.key === doc)?.links[l].default ?? null;
          const v = form.links[k].trim();
          return [k, v === std ? null : v];
        }),
      );
    }
    if (form.ask_review !== base.ask_review) body.ask_review = form.ask_review;
    if (form.ask_review_android !== base.ask_review_android) body.ask_review_android = form.ask_review_android;
    if (form.min_version.trim() !== base.min_version) body.min_version = Number(form.min_version.trim());
    put(body, T.s_saved);
  };

  const resetLink = (doc: string, l: Lang) => {
    const std = data?.legal.find((d) => d.key === doc)?.links[l].default ?? "";
    if (form) setForm({ ...form, links: { ...form.links, [linkKey(doc, l)]: std ?? "" } });
  };

  const on = data?.maintenance.on ?? false;
  const banner = !canEdit ? (
    <Banner kind="info">{T.readonly}</Banner>
  ) : on && data ? (
    <Banner action={<button type="button" className="link-btn" disabled={busy} onClick={() => maintenance(false)}>{T.m_banner_go}</button>}>
      {data.maintenance.since ? fill(T.m_banner, { t: longWhen(data.maintenance.since) }) : T.m_banner.replace(" dal {t}", "")}
    </Banner>
  ) : undefined;

  let body;
  if (state === "loading") body = <StateBlock kind="loading" />;
  else if (state === "error" || !data || !form) body = <StateBlock kind="error" title={T.s_err} action={<button type="button" className="btn" onClick={() => (setState("loading"), load())}>{T.retry}</button>} />;
  else
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <div className="cc-toggle-row">
            <div>
              <h2 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 12 }}>
                {T.m_title}
                {on ? <Status kind="warn">{data.maintenance.since ? fill(T.m_on, { t: hour(data.maintenance.since) }) : "Accesa"}</Status> : <Status kind="off">{T.m_off}</Status>}
              </h2>
              <p className="note" style={{ fontSize: 14, marginTop: 6 }}>{on ? fill(T.m_desc_on, { who: data.maintenance.by ?? "—" }) : T.m_desc_off}</p>
            </div>
            {canEdit ? (
              on ? (
                <button type="button" className="btn" disabled={busy} onClick={() => maintenance(false)}>{T.m_turn_off}</button>
              ) : (
                <button type="button" className="btn" disabled={busy} onClick={() => setConfirm("maintenance")}>{T.m_turn_on}</button>
              )
            ) : null}
          </div>
        </Card>

        <Card title={T.lg_title}>
          <p className="note" style={{ fontSize: 14, marginTop: -8 }}>{T.lg_note}</p>
          {data.legal.map((d, i) => (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {i ? <hr className="cc-hr" /> : null}
              <strong>{DOC_LABEL[d.key] ?? d.key}</strong>
              {(["it", "en"] as Lang[]).map((l) => {
                const k = linkKey(d.key, l);
                const v = form.links[k];
                const std = d.links[l].default;
                const isStd = v.trim() === (std ?? "");
                const bad = badLinks.includes(k);
                return (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="cc-link-row">
                      <span className="cc-lang-label">{l.toUpperCase()}</span>
                      <input
                        className="input"
                        aria-label={`${DOC_LABEL[d.key] ?? d.key} ${l.toUpperCase()}`}
                        value={v}
                        disabled={!canEdit}
                        aria-invalid={bad || undefined}
                        onChange={(e) => setForm({ ...form, links: { ...form.links, [k]: e.target.value } })}
                      />
                      {validUrl(v) ? (
                        <a href={v.trim()} target="_blank" rel="noreferrer noopener" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {T.lg_open} <Icon name="external" size={15} />
                        </a>
                      ) : (
                        <span />
                      )}
                      {isStd ? (
                        <span className="cc-std">{T.lg_default}</span>
                      ) : canEdit ? (
                        <button type="button" className="btn" style={{ height: 32, padding: "0 12px" }} onClick={() => resetLink(d.key, l)}>{T.lg_reset}</button>
                      ) : null}
                    </div>
                    {bad ? <p className="error-line" role="alert">{T.lg_err}</p> : null}
                  </div>
                );
              })}
              {d.version ? <p className="note">{fill(T.lg_version, { d: day(d.version) })}</p> : null}
            </div>
          ))}
        </Card>

        <Card title={T.rv_title}>
          {([
            ["ask_review", T.rv_ios],
            ["ask_review_android", T.rv_android],
          ] as const).map(([k, label], i) => (
            <div key={k}>
              {i ? <hr className="cc-hr" style={{ marginBottom: 16 }} /> : null}
              <div className="cc-toggle-row">
                <div>
                  <strong>{label}</strong>
                  <p className="note" style={{ fontSize: 14 }}>{T.rv_desc}</p>
                </div>
                <Switch on={form[k]} label={label} disabled={!canEdit} onChange={(v) => setForm({ ...form, [k]: v })} />
              </div>
            </div>
          ))}
        </Card>

        <Card title={T.mv_title}>
          <div className="cc-toggle-row">
            <div>
              <label htmlFor="s-min" style={{ fontWeight: 700 }}>{T.mv_label}</label>
              <p className="note" style={{ fontSize: 14 }}>{T.mv_desc}</p>
            </div>
            <input
              id="s-min"
              className="input"
              inputMode="numeric"
              style={{ width: 120 }}
              value={form.min_version}
              disabled={!canEdit}
              aria-invalid={badMin || undefined}
              onChange={(e) => setForm({ ...form, min_version: e.target.value })}
            />
          </div>
        </Card>

        <p className="cc-last" style={{ marginTop: 0 }}>
          <Icon name="lock" size={14} />
          {T.s_hidden}
        </p>
      </div>
    );

  return (
    <AdminFrame title={T.s_title} banner={banner}>
      <PageHead title={T.s_title} sub={T.s_sub} crumbs={[CRUMB, T.s_title]} />
      {data ? <div style={{ marginTop: -14, marginBottom: 22 }}><LastChangeLine change={data.last_change} /></div> : null}
      {body}
      {canEdit && dirty ? (
        <SaveBar busy={busy} error={error} saveDisabled={badLinks.length > 0 || badMin} onCancel={() => (base ? setForm(base) : undefined, setError(null))} onSave={save} />
      ) : null}
      {confirm === "maintenance" ? (
        <ConfirmDialog title={T.m_q} message={T.m_b} confirmLabel={T.m_turn_on} busy={busy} error={error} onConfirm={() => maintenance(true)} onCancel={() => setConfirm(null)} />
      ) : null}
      {confirm === "legal" ? (
        <ConfirmDialog
          title={T.lg_q}
          message={[...new Set(changedLinks.map((k) => DOC_LABEL[k.slice(0, -3)] ?? k))].map((d) => fill(T.lg_b, { d })).join(" ")}
          confirmLabel={T.lg_go}
          kind="primary"
          busy={busy}
          error={error}
          onConfirm={save}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      <UploadsTray />
    </AdminFrame>
  );
}
