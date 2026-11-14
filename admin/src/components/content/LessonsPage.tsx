"use client";

// MOB-1380 (boards ADM-CONTENT-01-lezioni-*): the Impara lessons, one table
// grouped by section in the app's order. Quick filters with counts, search,
// status chips per language, drag to reorder inside a section («Salva ordine»),
// multiple selection to show or hide. The six old sections sit closed at the
// bottom; their lessons can be shown only after moving them (decision 3).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { Banner, PageHead, StateBlock, Status } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { fill, shortWhen } from "@/lib/content/format";
import { T } from "@/lib/content/texts";
import type { Library, LessonRow, LessonSection } from "@/lib/content/types";
import { CRUMB, Glyph, Grip, SaveBar, Thumb, UploadsTray, VideoChip } from "./bits";
import "./content.css";

type Quick = "all" | "vis" | "noit" | "noen";
const OPEN_FIRST = 2;

const matches = (l: LessonRow, quick: Quick, q: string) =>
  (quick === "all" || (quick === "vis" && l.active) || (quick === "noit" && !l.videos.it) || (quick === "noen" && !l.videos.en)) &&
  (!q || l.title.toLowerCase().includes(q.toLowerCase()));

export function LessonsPage() {
  const { api, can, toast } = useConsole();
  const router = useRouter();
  const canEdit = can("console.content.update");
  const [lib, setLib] = useState<Library | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [quick, setQuick] = useState<Quick>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string> | null>(null);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<{ key: string; ids: number[] } | null>(null);
  const [drag, setDrag] = useState<{ id: number; section: string; over: number | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api.get<Library>("/lessons").then(
        (l) => {
          setLib(l);
          setState("ready");
        },
        () => setState("error"),
      ),
    [api],
  );
  useEffect(() => {
    load();
  }, [load]);
  const reload = () => {
    setState("loading");
    load();
  };

  const filtering = quick !== "all" || query.trim() !== "";
  const current = useMemo(() => lib?.sections.filter((s) => !s.legacy) ?? [], [lib]);
  const legacy = useMemo(() => lib?.sections.filter((s) => s.legacy) ?? [], [lib]);
  const isOpen = (s: LessonSection, i: number) => filtering || (open ? open.has(s.key) : i < OPEN_FIRST);
  const toggle = (s: LessonSection, i: number) => {
    const next = new Set(open ?? current.slice(0, OPEN_FIRST).map((x) => x.key));
    if (isOpen(s, i)) next.delete(s.key);
    else next.add(s.key);
    setOpen(next);
  };

  const rowsOf = (s: LessonSection) => {
    if (order?.key === s.key) return order.ids.map((id) => s.lessons.find((l) => l.id === id)!).filter(Boolean);
    return s.lessons.filter((l) => matches(l, quick, query.trim()));
  };

  const move = (s: LessonSection, id: number, to: number) => {
    const ids = (order?.key === s.key ? order.ids : s.lessons.map((l) => l.id)).filter((x) => x !== id);
    ids.splice(Math.max(0, Math.min(to, ids.length)), 0, id);
    const same = ids.every((x, i) => x === s.lessons[i]?.id);
    setOrder(same ? null : { key: s.key, ids });
  };

  const saveOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      setLib(await api.post<Library>("/lessons/reorder", { category: order.key, ids: order.ids }));
      setOrder(null);
      toast({ title: T.reorder_save, body: "La modifica è nel registro attività." });
    } catch {
      toast({ title: T.save_err, kind: "error" });
    }
    setBusy(false);
  };

  const bulk = async (active: boolean) => {
    setBusy(true);
    setBulkError(null);
    try {
      await api.post("/lessons/visibility", { ids: [...selected], active });
      setSelected(new Set());
      toast({ title: active ? T.bulk_show : T.bulk_hide, body: "La modifica è nel registro attività." });
      await load();
    } catch {
      setBulkError(T.save_err);
    }
    setBusy(false);
  };

  const all = lib?.sections.flatMap((s) => s.lessons) ?? [];
  const selectedRows = all.filter((l) => selected.has(l.id));
  const noVideo = selectedRows.filter((l) => !l.videos.it && !l.videos.en).length;
  const legacyIds = new Set(legacy.flatMap((s) => s.lessons.map((l) => l.id)));
  const anyLegacy = selectedRows.some((l) => legacyIds.has(l.id));
  const shown = lib ? [...current, ...(legacyOpen || filtering ? legacy : [])].reduce((n, s) => n + rowsOf(s).length, 0) : 0;
  const pills: [Quick, string, number][] = lib
    ? [["all", T.q_all, lib.counts.all], ["vis", T.q_vis, lib.counts.visible], ["noit", T.q_noit, lib.counts.no_it], ["noen", T.q_noen, lib.counts.no_en]]
    : [];
  const cols = canEdit ? 5 : 4;

  const row = (s: LessonSection, l: LessonRow, i: number) => {
    const sortable = canEdit && !filtering && !s.legacy;
    const dragProps = sortable
      ? {
          draggable: !order || order.key === s.key,
          onDragStart: (e: DragEvent) => {
            e.dataTransfer.effectAllowed = "move";
            setDrag({ id: l.id, section: s.key, over: null });
          },
          onDragOver: (e: DragEvent) => {
            if (!drag || drag.section !== s.key) return;
            e.preventDefault();
            if (drag.over !== l.id) setDrag({ ...drag, over: l.id });
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            if (drag && drag.section === s.key && drag.id !== l.id) move(s, drag.id, rowsOf(s).findIndex((x) => x.id === l.id));
            setDrag(null);
          },
          onDragEnd: () => setDrag(null),
        }
      : {};
    return (
      <tr key={l.id} data-dragging={drag?.id === l.id || undefined} data-over={drag?.over === l.id && drag.id !== l.id ? true : undefined} {...dragProps}>
        {canEdit ? (
          <td style={{ width: 84 }}>
            <span className="cc-row">
              <input
                type="checkbox"
                className="cc-check"
                aria-label={`Seleziona ${l.title}`}
                checked={selected.has(l.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(l.id);
                  else next.delete(l.id);
                  setSelected(next);
                }}
              />
              {sortable && (!order || order.key === s.key) ? <Grip label={`Sposta ${l.title}`} onMove={(d) => move(s, l.id, i + d)} /> : null}
            </span>
          </td>
        ) : null}
        <td>
          <span className="cc-title-cell">
            <span className="cc-num">{i + 1}</span>
            <Thumb url={l.thumbnail_url} size={36} />
            <Link href={`/contenuti/lezioni/scheda?id=${l.id}`} title={l.title}>{l.title}</Link>
          </span>
        </td>
        <td style={{ width: 220 }}>
          <span className="cc-row">
            <VideoChip lang="it" video={l.videos.it} />
            <VideoChip lang="en" video={l.videos.en} />
          </span>
        </td>
        <td style={{ width: 130 }}>{l.active ? <Status kind="ok">{T.vis_on}</Status> : <Status kind="off">{T.vis_off}</Status>}</td>
        <td style={{ width: 150 }} className="muted">{shortWhen(l.updated_at)}</td>
      </tr>
    );
  };

  const band = (s: LessonSection, i: number, nested = false) => {
    const opened = nested || isOpen(s, i);
    const visible = s.lessons.filter((l) => l.active).length;
    return (
      <tr className="cc-band" key={`band-${s.key}`}>
        <td colSpan={cols - (canEdit && !s.legacy ? 1 : 0)}>
          <button type="button" className="cc-band-toggle" aria-expanded={opened} onClick={() => (nested ? undefined : toggle(s, i))} disabled={nested}>
            {nested ? null : <Icon name={opened ? "down" : "chevron"} size={16} />}
            {s.title} <small>{fill(T.band, { n: s.lessons.length, v: visible })}</small>
          </button>
        </td>
        {canEdit && !s.legacy ? (
          <td style={{ textAlign: "right" }}>
            <button type="button" className="link-btn" onClick={() => router.push(`/contenuti/lezioni/scheda?nuova=1&sezione=${s.key}`)}>{T.add_here}</button>
          </td>
        ) : null}
      </tr>
    );
  };

  let body;
  if (state === "loading") body = <StateBlock kind="loading" />;
  else if (state === "error" || !lib)
    body = <StateBlock kind="error" title={T.l_err} action={<button type="button" className="btn" onClick={reload}>{T.retry}</button>} />;
  else
    body = (
      <>
        <div className="cc-filters">
          <label className="cc-search">
            <Icon name="search" size={18} />
            <span className="sr-only">{T.l_search}</span>
            <input className="input" type="search" placeholder={T.l_search} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {pills.map(([k, label, n]) => (
            <button key={k} type="button" className="cc-pill" aria-pressed={quick === k} onClick={() => setQuick(k)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
        {selected.size ? (
          <div className="card cc-bulk" style={{ padding: "12px 18px", marginBottom: 16 }} role="region" aria-label={fill(T.bulk_n, { n: selected.size })}>
            <strong>{fill(T.bulk_n, { n: selected.size })}</strong>
            {noVideo ? <span className="note" style={{ color: "var(--warn)" }}>{fill(T.bulk_note, { n: noVideo })}</span> : null}
            {bulkError ? <span className="error-line" role="alert">{bulkError}</span> : null}
            <span style={{ flex: 1 }} />
            {anyLegacy ? <span className="note">{T.legacy_locked}</span> : null}
            <button type="button" className="btn" disabled={busy || anyLegacy} onClick={() => bulk(true)}>{T.bulk_show}</button>
            <button type="button" className="btn" disabled={busy} onClick={() => bulk(false)}>{T.bulk_hide}</button>
            <button type="button" className="link-btn" onClick={() => setSelected(new Set())}>{T.bulk_clear}</button>
          </div>
        ) : null}
        {filtering && shown === 0 ? (
          <div className="card">
            <StateBlock
              kind="missing"
              title={T.l_empty_t}
              body={query.trim() ? fill(T.l_empty_b, { q: query.trim() }) : undefined}
              action={
                <button type="button" className="btn" onClick={() => (setQuery(""), setQuick("all"))}>
                  {T.clear_filters}
                </button>
              }
            />
          </div>
        ) : (
          <section className="card" style={{ padding: 8 }}>
            <table className="table cc-lessons">
              <caption className="sr-only">{T.l_title}</caption>
              <thead>
                <tr>
                  {canEdit ? <th scope="col"><span className="sr-only">Selezione</span></th> : null}
                  <th scope="col">{T.col_lesson}</th>
                  <th scope="col">{T.col_video}</th>
                  <th scope="col">{T.col_state}</th>
                  <th scope="col" style={{ width: 150, whiteSpace: "nowrap" }}>{T.col_changed}</th>
                </tr>
              </thead>
              <tbody>
                {current.map((s, i) => {
                  const rows = rowsOf(s);
                  if (filtering && !rows.length) return null;
                  return (
                    <Fragment key={s.key}>
                      {band(s, i)}
                      {isOpen(s, i) ? rows.map((l, j) => row(s, l, j)) : null}
                    </Fragment>
                  );
                })}
                {legacy.length && !filtering ? (
                  <tr className="cc-band">
                    <td colSpan={cols}>
                      <button type="button" className="cc-band-toggle" aria-expanded={legacyOpen} onClick={() => setLegacyOpen(!legacyOpen)}>
                        <Icon name={legacyOpen ? "down" : "chevron"} size={16} />
                        {T.legacy_title}{" "}
                        <small>
                          {legacy.length} sezioni · {legacy.reduce((n, s) => n + s.lessons.length, 0)} lezioni · {legacy.reduce((n, s) => n + s.lessons.filter((l) => l.active).length, 0)} visibili
                        </small>
                      </button>
                    </td>
                  </tr>
                ) : null}
                {legacyOpen && !filtering ? (
                  <tr>
                    <td colSpan={cols}>
                      <p className="note" style={{ fontSize: 14 }}>{T.legacy_note}</p>
                    </td>
                  </tr>
                ) : null}
                {legacyOpen || filtering
                  ? legacy.map((s, i) => {
                      const rows = rowsOf(s);
                      if (filtering && !rows.length) return null;
                      return (
                        <Fragment key={s.key}>
                          {band(s, i, true)}
                          {rows.map((l, j) => row(s, l, j))}
                        </Fragment>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </section>
        )}
        {order ? (
          <SaveBar
            message={fill(T.reorder_msg, { s: lib.sections.find((s) => s.key === order.key)?.title ?? "" })}
            saveLabel={T.reorder_save}
            busy={busy}
            onCancel={() => setOrder(null)}
            onSave={saveOrder}
          />
        ) : null}
      </>
    );

  return (
    <AdminFrame title={T.l_title} banner={!canEdit ? <Banner kind="info">{T.readonly}</Banner> : undefined}>
      <PageHead
        title={T.l_title}
        sub={T.l_sub}
        crumbs={[CRUMB, T.l_title]}
        actions={canEdit ? <button type="button" className="btn btn-primary" onClick={() => router.push("/contenuti/lezioni/scheda?nuova=1")}><Glyph name="plus" size={16} />{T.l_new}</button> : undefined}
      />
      {body}
      <UploadsTray />
    </AdminFrame>
  );
}
