"use client";

// MOB-1380 (boards ADM-CONTENT-04-tutorial-*): the page tutorials. App pages on
// the left, the chosen page's steps in order (drag, «Salva ordine»), and the
// step as the app draws it on the right with an IT / EN switch. A step opens
// in a drawer; the analytics feature is chosen once, at creation.

import { useCallback, useEffect, useState, type DragEvent } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog, Drawer } from "@/components/shell/overlays";
import { Banner, PageHead, StateBlock } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { postForm } from "@/lib/content/form";
import { fill, pageLabel } from "@/lib/content/format";
import { T } from "@/lib/content/texts";
import type { Lang, TutorialStep, Tutorials } from "@/lib/content/types";
import { Card, CRUMB, UploadsTray, Glyph, Grip, LangSwitch, LastChangeLine, SaveBar } from "./bits";
import { FileButton } from "./LessonPage";
import "./content.css";

type Edit = { step: TutorialStep | null; title_it: string; body_it: string; title_en: string; body_en: string; feature: string; files: Partial<Record<Lang, File>>; error: string | null };

const missingEn = (s: TutorialStep) => !(s.title_en ?? "").trim() || !(s.body_en ?? "").trim();
/** MOB-1487: «1 passo», «0 passi», «3 passi». */
const stepsLabel = (n: number) => (n === 1 ? T.t_steps_one : fill(T.t_steps, { n }));
const imageFor = (s: TutorialStep, l: Lang) => s.images[l] ?? s.images[l === "it" ? "en" : "it"] ?? s.images.legacy;

export function TutorialPage() {
  const { api, can, toast } = useConsole();
  const canEdit = can("console.content.update");
  const [data, setData] = useState<Tutorials | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [page, setPage] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [lang, setLang] = useState<Lang>("it");
  const [order, setOrder] = useState<number[] | null>(null);
  const [drag, setDrag] = useState<{ id: number; over: number | null } | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api.get<Tutorials>("/tutorial-steps").then(
        (d) => {
          setData(d);
          setState("ready");
        },
        () => setState("error"),
      ),
    [api],
  );
  useEffect(() => {
    load();
  }, [load]);

  const pageKey = page ?? data?.pages[0]?.key ?? null;
  const steps = data?.pages.find((p) => p.key === pageKey)?.steps ?? [];
  const shown = order ? order.map((id) => steps.find((s) => s.id === id)!).filter(Boolean) : steps;
  const current = shown.find((s) => s.id === sel) ?? shown[0] ?? null;
  const idx = current ? shown.indexOf(current) : -1;

  const choosePage = (key: string) => {
    setPage(key);
    setSel(null);
    setOrder(null);
  };

  const move = (id: number, to: number) => {
    const ids = shown.map((s) => s.id).filter((x) => x !== id);
    ids.splice(Math.max(0, Math.min(to, ids.length)), 0, id);
    setOrder(ids.every((x, i) => x === steps[i]?.id) ? null : ids);
  };

  const saveOrder = async () => {
    if (!order || !pageKey) return;
    setBusy(true);
    try {
      setData(await api.post<Tutorials>("/tutorial-steps/reorder", { page: pageKey, ids: order }));
      setOrder(null);
      toast({ title: T.reorder_save, body: "La modifica è nel registro attività." });
    } catch {
      toast({ title: T.save_err, kind: "error" });
    }
    setBusy(false);
  };

  const openEdit = (s: TutorialStep | null) =>
    setEdit({ step: s, title_it: s?.title_it ?? "", body_it: s?.body_it ?? "", title_en: s?.title_en ?? "", body_en: s?.body_en ?? "", feature: s?.feature ?? "", files: {}, error: null });

  const saveStep = async () => {
    if (!edit || !pageKey) return;
    if (!edit.step && !/^[a-z0-9_]+$/.test(edit.feature)) {
      setEdit({ ...edit, error: T.t_feature_pick });
      return;
    }
    setBusy(true);
    let created: TutorialStep | null = edit.step;
    try {
      const texts = { title_it: edit.title_it, body_it: edit.body_it, title_en: edit.title_en, body_en: edit.body_en };
      let step = edit.step
        ? await api.put<TutorialStep>(`/tutorial-steps/${edit.step.id}`, texts)
        : await api.post<TutorialStep>("/tutorial-steps", { ...texts, page: pageKey, feature: edit.feature });
      // Created: a failing picture below must not make «Aggiungi passo» create it twice.
      created = step;
      for (const l of ["it", "en"] as Lang[]) {
        const f = edit.files[l];
        if (!f) continue;
        const form = new FormData();
        form.append("lang", l);
        form.append("file", f);
        step = await postForm<TutorialStep>(api, `/tutorial-steps/${step.id}/image`, form);
      }
      toast({ title: T.t_saved, body: "La modifica è nel registro attività." });
      setEdit(null);
      setSel(step.id);
      await load();
    } catch (e) {
      setEdit({ ...edit, step: created, error: e instanceof ApiError && (e.code === "bad_type" || e.code === "too_large") ? T.c_err : T.save_err });
      if (created && !edit.step) await load();
    }
    setBusy(false);
  };

  const removeImage = async (l: Lang) => {
    if (!edit?.step) return;
    setBusy(true);
    try {
      const step = await api.del<TutorialStep>(`/tutorial-steps/${edit.step.id}/image/${l}`);
      setEdit({ ...edit, step });
      await load();
    } catch {
      setEdit({ ...edit, error: T.save_err });
    }
    setBusy(false);
  };

  const deleteStep = async () => {
    if (!edit?.step) return;
    setBusy(true);
    try {
      await api.del(`/tutorial-steps/${edit.step.id}`);
      setConfirmDel(false);
      setEdit(null);
      setSel(null);
      toast({ title: T.t_del, body: "La modifica è nel registro attività." });
      await load();
    } catch {
      toast({ title: T.save_err, kind: "error" });
    }
    setBusy(false);
  };

  const dragProps = (s: TutorialStep) =>
    canEdit
      ? {
          draggable: true,
          onDragStart: () => setDrag({ id: s.id, over: null }),
          onDragOver: (e: DragEvent) => {
            if (!drag) return;
            e.preventDefault();
            if (drag.over !== s.id) setDrag({ ...drag, over: s.id });
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            if (drag && drag.id !== s.id) move(drag.id, shown.findIndex((x) => x.id === s.id));
            setDrag(null);
          },
          onDragEnd: () => setDrag(null),
        }
      : {};

  let body;
  if (state === "loading") body = <StateBlock kind="loading" />;
  else if (state === "error" || !data) body = <StateBlock kind="error" title={T.t_err} action={<button type="button" className="btn" onClick={() => (setState("loading"), load())}>{T.retry}</button>} />;
  else
    body = (
      <div className="cc-three">
        <Card title={T.t_pages} style={{ padding: "18px 12px" }}>
          <ul className="cc-pages">
            {data.pages.map((p) => (
              <li key={p.key}>
                <button type="button" aria-current={p.key === pageKey || undefined} onClick={() => choosePage(p.key)}>
                  <span>
                    {pageLabel(p.key)}
                    {p.steps.some(missingEn) ? <span className="cc-dot" aria-label={T.t_missing_en} /> : null}
                  </span>
                  <small>{stepsLabel(p.steps.length)}</small>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {pageLabel(pageKey ?? "")}
              <small className="note" style={{ fontWeight: 500, fontSize: 14 }}>{stepsLabel(steps.length)}</small>
            </span>
          }
          action={canEdit ? <button type="button" className="btn" onClick={() => openEdit(null)}><Glyph name="plus" size={16} />{T.t_add}</button> : undefined}
        >
          {shown.length === 0 ? (
            <StateBlock kind="empty" title={T.t_empty_t} body={T.t_empty_b} />
          ) : (
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {shown.map((s, i) => (
                <li
                  key={s.id}
                  className="cc-step"
                  tabIndex={0}
                  aria-label={`${i + 1}. ${s.title_it || s.title_en || s.step_key}`}
                  aria-current={current?.id === s.id || undefined}
                  data-over={drag?.over === s.id && drag.id !== s.id ? true : undefined}
                  onClick={() => setSel(s.id)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setSel(s.id);
                    }
                  }}
                  {...dragProps(s)}
                >
                  {canEdit ? <Grip label={`Sposta il passo ${i + 1}`} onMove={(d) => move(s.id, i + d)} /> : <span style={{ width: 8 }} />}
                  <span className="cc-stepnum">{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <h3>{s.title_it || s.title_en || s.step_key}</h3>
                      <p>{s.body_it || s.body_en}</p>
                    </div>
                    <span className="cc-row" style={{ flexWrap: "wrap" }}>
                      {(["it", "en"] as Lang[]).map((l) => (
                        <span key={l} className="cc-imgpill" data-has={!!s.images[l]}>
                          <Icon name="layers" size={12} />
                          {l.toUpperCase()}
                        </span>
                      ))}
                      <span className="note">{s.feature}</span>
                    </span>
                    {missingEn(s) ? <span className="note" style={{ color: "var(--warn)" }}>{T.t_missing_en}</span> : null}
                  </div>
                  {canEdit ? (
                    <button type="button" className="icon-btn" aria-label={`${T.t_edit} ${i + 1}`} onClick={(e) => (e.stopPropagation(), openEdit(s))}>
                      <Icon name="edit" size={16} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title={T.pv_title} action={<LangSwitch value={lang} onChange={setLang} label={T.pv_title} />} style={{ gridColumn: undefined }}>
          <div className="cc-phone cc-tut-preview">
            <span className="cc-phone-ghost" />
            <span className="cc-phone-ghost" />
            {current ? (
              <div className="cc-tip" aria-label={T.pv_title}>
                <span className="cc-row" style={{ justifyContent: "space-between" }}>
                  <span className="note">{idx + 1} / {shown.length}</span>
                  <Icon name="close" size={16} />
                </span>
                <div className="cc-tip-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {imageFor(current, lang) ? <img src={imageFor(current, lang)!} alt="" /> : null}
                  {lang === "en" && !current.images.en && current.images.it ? <span className="cc-lang-tag">IT</span> : null}
                </div>
                {lang === "en" && !current.images.en && current.images.it ? <span className="note">{T.t_fallback}</span> : null}
                <h3>{(lang === "en" ? current.title_en : current.title_it) || current.title_it}</h3>
                <p>{(lang === "en" ? current.body_en : current.body_it) || current.body_it}</p>
                <span className="btn btn-primary btn-wide" aria-hidden="true">{idx === shown.length - 1 ? T.done : T.next}</span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );

  const step = edit?.step ?? null;
  return (
    <AdminFrame title={T.t_title} banner={!canEdit ? <Banner kind="info">{T.readonly}</Banner> : undefined}>
      <PageHead title={T.t_title} sub={T.t_sub} crumbs={[CRUMB, T.t_title]} />
      {data ? <div style={{ marginTop: -14, marginBottom: 22 }}><LastChangeLine change={data.last_change} /></div> : null}
      {body}
      {order ? <SaveBar message={fill(T.t_order_msg, { p: pageLabel(pageKey ?? "") })} saveLabel={T.reorder_save} busy={busy} onCancel={() => setOrder(null)} onSave={saveOrder} /> : null}

      {edit ? (
        <Drawer
          title={step ? T.t_edit : T.t_new}
          sub={fill(T.t_pos, { p: pageLabel(pageKey ?? ""), i: step ? shown.findIndex((x) => x.id === step.id) + 1 : steps.length + 1, n: step ? steps.length : steps.length + 1 })}
          onClose={() => setEdit(null)}
          footer={
            <>
              {step ? <button type="button" className="btn btn-danger" style={{ marginRight: "auto" }} onClick={() => setConfirmDel(true)}>{T.t_del}</button> : null}
              <button type="button" className="btn" onClick={() => setEdit(null)}>{T.cancel}</button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={saveStep}>{busy ? "…" : step ? T.save : T.t_create}</button>
            </>
          }
        >
          {(["it", "en"] as Lang[]).map((l) => (
            <div key={l} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="note" style={{ fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l === "it" ? T.t_it : T.t_en}</span>
              <div className="field">
                <label htmlFor={`t-title-${l}`}>{T.t_title_f}</label>
                <input id={`t-title-${l}`} className="input" value={l === "it" ? edit.title_it : edit.title_en} onChange={(e) => setEdit({ ...edit, [`title_${l}`]: e.target.value, error: null })} />
              </div>
              <div className="field">
                <label htmlFor={`t-body-${l}`}>{T.t_body_f}</label>
                <textarea id={`t-body-${l}`} className="input" rows={3} value={l === "it" ? edit.body_it : edit.body_en} onChange={(e) => setEdit({ ...edit, [`body_${l}`]: e.target.value, error: null })} />
              </div>
              {l === "en" && (!edit.title_en.trim() || !edit.body_en.trim()) ? <p className="note" style={{ color: "var(--warn)" }}>{T.t_missing_en}</p> : null}
              <hr className="cc-hr" />
            </div>
          ))}
          <div className="field">
            <label htmlFor="t-feature">{T.t_feature}</label>
            {step ? (
              <input id="t-feature" className="input mono" value={step.feature ?? ""} disabled />
            ) : (
              <>
                <input id="t-feature" className="input mono" list="t-features" placeholder={T.t_feature_pick} value={edit.feature} onChange={(e) => setEdit({ ...edit, feature: e.target.value.trim().toLowerCase(), error: null })} />
                <datalist id="t-features">
                  {data?.features.map((f) => <option key={f} value={f} />)}
                </datalist>
              </>
            )}
            <p className="note">{T.t_feature_hint}</p>
          </div>
          {(["it", "en"] as Lang[]).map((l) => {
            const file = edit.files[l];
            const url = step?.images[l] ?? null;
            return (
              <div key={`img-${l}`} className="field">
                <label>{l === "it" ? T.t_img_it : T.t_img_en}</label>
                <div className="cc-imgpick">
                  <span className="cc-imgbox">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {url && !file ? <img src={url} alt="" /> : <Icon name="layers" size={18} />}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="note">{file ? file.name : url ? "" : l === "en" ? T.t_img_none : ""}</span>
                    <span className="cc-row">
                      <FileButton label={url || file ? T.v_replace : "Carica"} accept="image/jpeg,image/png,image/webp" onFile={(f) => setEdit({ ...edit, files: { ...edit.files, [l]: f }, error: null })} />
                      {url && !file ? <button type="button" className="btn btn-danger" disabled={busy} onClick={() => removeImage(l)}>{T.v_remove}</button> : null}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {edit.error ? <p className="error-line" role="alert">{edit.error}</p> : null}
        </Drawer>
      ) : null}
      {confirmDel && step ? (
        <ConfirmDialog
          title={T.t_del_q}
          message={fill(T.t_del_b, { t: step.title_it || step.step_key, p: pageLabel(step.page) })}
          confirmLabel={T.del_go}
          busy={busy}
          onConfirm={deleteStep}
          onCancel={() => setConfirmDel(false)}
        />
      ) : null}
      <UploadsTray />
    </AdminFrame>
  );
}
