"use client";

// MOB-1380 (boards ADM-CONTENT-05-avatar-*): the profile avatars as a grid in
// the app's order. Drag the active ones to reorder («Salva ordine»); on / off
// applies at once with an «Annulla» (decision 8, no delete: whoever chose an
// avatar keeps it). A tile opens a drawer with the names and the picture
// (square PNG or WEBP, at least 512 px).

import { useCallback, useEffect, useState, type DragEvent } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { Drawer } from "@/components/shell/overlays";
import { Banner, PageHead, StateBlock } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { imageSize, postForm } from "@/lib/content/form";
import { fill } from "@/lib/content/format";
import { T } from "@/lib/content/texts";
import type { AvatarItem, Avatars } from "@/lib/content/types";
import { Card, CRUMB, Glyph, Grip, LastChangeLine, SaveBar, Switch } from "./bits";
import { FileButton } from "./LessonPage";
import "./content.css";

type Edit = { avatar: AvatarItem | null; name_it: string; name_en: string; file: File | null; error: string | null };

const MIN_PX = 512;

/** «L’immagine deve essere quadrata: questa è 800 × 600.» with the file's own size. */
export const squareError = (w: number, h: number) => T.a_err_square.replace("800 × 600", `${w} × ${h}`);

/** Why a picture is refused before it is sent (the server checks again). */
export function refusePicture(file: File, size: { width: number; height: number } | null): string | null {
  if (!["image/png", "image/webp"].includes(file.type)) return T.a_pic_hint;
  if (!size) return null;
  if (size.width !== size.height) return squareError(size.width, size.height);
  if (size.width < MIN_PX) return T.a_pic_hint;
  return null;
}

export function AvatarsPage() {
  const { api, can, toast } = useConsole();
  const canEdit = can("console.content.update");
  const [data, setData] = useState<Avatars | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [order, setOrder] = useState<number[] | null>(null);
  const [drag, setDrag] = useState<{ id: number; over: number | null } | null>(null);
  const [undo, setUndo] = useState<AvatarItem | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api.get<Avatars>("/avatars").then(
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
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);

  const all = data?.avatars ?? [];
  const activeBase = all.filter((a) => a.active);
  const active = order ? order.map((id) => activeBase.find((a) => a.id === id)!).filter(Boolean) : activeBase;
  const inactive = all.filter((a) => !a.active);

  const move = (id: number, to: number) => {
    const ids = active.map((a) => a.id).filter((x) => x !== id);
    ids.splice(Math.max(0, Math.min(to, ids.length)), 0, id);
    setOrder(ids.every((x, i) => x === activeBase[i]?.id) ? null : ids);
  };

  const saveOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      setData(await api.post<Avatars>("/avatars/reorder", { ids: order }));
      setOrder(null);
      toast({ title: T.a_order_msg, body: "La modifica è nel registro attività." });
    } catch {
      toast({ title: T.save_err, kind: "error" });
    }
    setBusy(false);
  };

  const setActive = async (a: AvatarItem, on: boolean, quiet = false) => {
    try {
      const saved = await api.put<AvatarItem>(`/avatars/${a.id}`, { active: on });
      setData((d) => (d ? { ...d, avatars: d.avatars.map((x) => (x.id === a.id ? saved : x)) } : d));
      setOrder(null);
      if (!quiet) setUndo(on ? null : saved);
    } catch {
      toast({ title: T.save_err, kind: "error" });
    }
  };

  const openEdit = (a: AvatarItem | null) => setEdit({ avatar: a, name_it: a?.name_it ?? "", name_en: a?.name_en ?? "", file: null, error: null });

  const pick = async (file: File) => {
    if (!edit) return;
    const why = refusePicture(file, await imageSize(file));
    setEdit({ ...edit, file: why ? null : file, error: why });
  };

  const saveEdit = async () => {
    if (!edit) return;
    if (!edit.name_it.trim() || !edit.name_en.trim() || (!edit.avatar && !edit.file)) {
      setEdit({ ...edit, error: !edit.avatar && !edit.file ? T.a_pic_hint : T.save_err });
      return;
    }
    setBusy(true);
    try {
      if (edit.avatar) {
        await api.put(`/avatars/${edit.avatar.id}`, { name_it: edit.name_it, name_en: edit.name_en });
        if (edit.file) {
          const form = new FormData();
          form.append("image", edit.file);
          await postForm(api, `/avatars/${edit.avatar.id}/image`, form);
        }
      } else {
        const form = new FormData();
        form.append("name_it", edit.name_it);
        form.append("name_en", edit.name_en);
        form.append("image", edit.file!);
        await postForm(api, "/avatars", form);
      }
      toast({ title: T.a_saved, body: "La modifica è nel registro attività." });
      setEdit(null);
      await load();
    } catch (e) {
      const c = e instanceof ApiError ? e.code : null;
      const body = e instanceof ApiError ? (e.body as { width?: number; height?: number } | null) : null;
      setEdit({
        ...edit,
        error: c === "not_square" && body ? squareError(body.width ?? 0, body.height ?? 0) : c === "too_small" || c === "bad_type" || c === "too_large" ? T.a_pic_hint : T.save_err,
      });
    }
    setBusy(false);
  };

  const tile = (a: AvatarItem, i: number | null) => {
    const sortable = canEdit && i !== null;
    const dragProps = sortable
      ? {
          draggable: true,
          onDragStart: () => setDrag({ id: a.id, over: null }),
          onDragOver: (e: DragEvent) => {
            if (!drag) return;
            e.preventDefault();
            if (drag.over !== a.id) setDrag({ ...drag, over: a.id });
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            if (drag && drag.id !== a.id) move(drag.id, active.findIndex((x) => x.id === a.id));
            setDrag(null);
          },
          onDragEnd: () => setDrag(null),
        }
      : {};
    return (
      <li key={a.id} className="cc-tile" data-off={!a.active || undefined} data-over={drag?.over === a.id && drag.id !== a.id ? true : undefined} {...dragProps}>
        <button type="button" className="cc-tile-img" aria-label={`${T.a_edit}: ${a.name_it}`} onClick={() => (canEdit ? openEdit(a) : undefined)} disabled={!canEdit}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {a.image_url ? <img src={a.image_url} alt="" /> : <Icon name="user" size={28} />}
        </button>
        {i !== null ? <span className="cc-badge">{i + 1}</span> : null}
        {sortable ? <Grip label={`Sposta ${a.name_it}`} onMove={(d) => move(a.id, i + d)} /> : null}
        <strong style={{ fontSize: 15 }}>{a.name_it}</strong>
        <span className="cc-row" style={{ justifyContent: "space-between" }}>
          <span className="note">{a.active ? T.a_on : T.a_off}</span>
          <Switch on={a.active} label={`${a.name_it}: ${a.active ? T.a_on : T.a_off}`} disabled={!canEdit} onChange={(v) => setActive(a, v)} />
        </span>
      </li>
    );
  };

  let body;
  if (state === "loading") body = <StateBlock kind="loading" />;
  else if (state === "error" || !data) body = <StateBlock kind="error" title={T.a_err} action={<button type="button" className="btn" onClick={() => (setState("loading"), load())}>{T.retry}</button>} />;
  else
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card title={`${T.a_active} · ${active.length}`}>
          {canEdit ? <p className="note" style={{ fontSize: 14, marginTop: -8 }}>{T.a_drag_hint} {T.a_switch_note}</p> : null}
          <ul className="cc-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>{active.map((a, i) => tile(a, i))}</ul>
        </Card>
        {inactive.length ? (
          <Card title={`${T.a_inactive} · ${inactive.length}`}>
            <p className="note" style={{ fontSize: 14, marginTop: -8 }}>{T.a_inactive_note}</p>
            <ul className="cc-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>{inactive.map((a) => tile(a, null))}</ul>
          </Card>
        ) : null}
      </div>
    );

  return (
    <AdminFrame title={T.a_title} banner={!canEdit ? <Banner kind="info">{T.readonly}</Banner> : undefined}>
      <PageHead
        title={T.a_title}
        sub={T.a_sub}
        crumbs={[CRUMB, T.a_title]}
        actions={canEdit ? <button type="button" className="btn btn-primary" onClick={() => openEdit(null)}><Glyph name="plus" size={16} />{T.a_new}</button> : undefined}
      />
      {data ? <div style={{ marginTop: -14, marginBottom: 22 }}><LastChangeLine change={data.last_change} /></div> : null}
      {body}
      {order ? <SaveBar message={T.a_order_msg} saveLabel={T.reorder_save} busy={busy} onCancel={() => setOrder(null)} onSave={saveOrder} /> : null}
      {undo ? (
        <div className="toasts" aria-live="polite" style={{ bottom: 100 }}>
          <div className="toast" role="status">
            <Icon name="check" size={18} />
            <div style={{ flex: 1 }}>
              <strong>{fill(T.a_off_toast, { n: undo.name_it })}</strong>
            </div>
            <button type="button" className="link-btn" onClick={() => (setActive(undo, true, true), setUndo(null))}>{T.a_undo}</button>
          </div>
        </div>
      ) : null}

      {edit ? (
        <Drawer
          title={edit.avatar ? T.a_edit : T.a_new}
          sub={edit.avatar ? edit.avatar.name_it : undefined}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setEdit(null)}>{T.cancel}</button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={saveEdit}>{busy ? "…" : edit.avatar ? T.save : T.a_create}</button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="a-it">{T.a_name_it}</label>
            <input id="a-it" className="input" value={edit.name_it} onChange={(e) => setEdit({ ...edit, name_it: e.target.value, error: null })} />
          </div>
          <div className="field">
            <label htmlFor="a-en">{T.a_name_en}</label>
            <input id="a-en" className="input" value={edit.name_en} onChange={(e) => setEdit({ ...edit, name_en: e.target.value, error: null })} />
            <p className="note">{T.a_name_hint}</p>
          </div>
          <div className="field">
            <label>{T.a_picture}</label>
            <div className="cc-imgpick">
              <span className="cc-imgbox" style={{ width: 96, height: 96 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {edit.avatar?.image_url && !edit.file ? <img src={edit.avatar.image_url} alt="" /> : <Icon name="user" size={22} />}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="note">{edit.file ? edit.file.name : T.a_pic_hint}</span>
                <FileButton label={edit.avatar || edit.file ? T.v_replace : "Carica"} accept="image/png,image/webp" onFile={pick} />
              </div>
            </div>
          </div>
          {!edit.avatar ? <p className="note" style={{ fontSize: 14 }}>{T.a_active_desc}</p> : null}
          {edit.error ? <p className="error-line" role="alert">{edit.error}</p> : null}
        </Drawer>
      ) : null}
    </AdminFrame>
  );
}
