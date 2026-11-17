"use client";

// MOB-1380 (boards ADM-CONTENT-02-lezione-*): one lesson. Texts IT/EN, section
// and visibility wait for «Salva» (save bar); videos go straight to storage and
// link themselves when done (no Salva, decision 7: «Sostituisci» keeps the old
// one live until then, «Rimuovi» asks and deletes at once); cover upload; the
// card as the app draws it. «?new=1» is the new-lesson form: videos and cover
// come after «Crea lezione».

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog } from "@/components/shell/overlays";
import { Banner, PageHead, StateBlock, Status } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { postForm } from "@/lib/content/form";
import { bytes, day, duration, fill } from "@/lib/content/format";
import { T } from "@/lib/content/texts";
import { LANGS, type Lang, type Library, type LessonDetail, type LessonVideo, type PerLang } from "@/lib/content/types";
import { refuseVideo, startVideoUpload, useUploads, type Upload } from "@/lib/content/uploads";
import { Card, CRUMB, Glyph, Grip, LangSwitch, LastChangeLine, Progress, SaveBar, Switch, Thumb, UploadButtons, UploadsTray, uploadLine } from "./bits";
import "./content.css";

type Draft = { title: PerLang<string>; summary: PerLang<string>; objectives: PerLang<string[]>; hashtags: string[]; category: string; active: boolean };

const draftOf = (d: LessonDetail): Draft => ({
  title: { ...d.title },
  summary: { ...d.summary },
  objectives: { it: [...d.objectives.it], en: [...d.objectives.en] },
  hashtags: [...d.hashtags],
  category: d.category,
  active: d.active,
});
const blank = (category: string): Draft => ({ title: { it: "", en: "" }, summary: { it: "", en: "" }, objectives: { it: [], en: [] }, hashtags: [], category, active: false });
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const LANG_WORD: Record<Lang, string> = { it: "italiano", en: "inglese" };

export function normalizeTag(raw: string): string | null {
  const t = raw.replace(/\s+/g, "").replace(/^#+/, "");
  return t ? `#${t}` : null;
}

export function LessonPage() {
  const params = useSearchParams();
  const id = Number(params.get("id") ?? 0);
  const isNew = params.get("new") === "1";
  const wanted = params.get("section");
  const { api, can, toast, me } = useConsole();
  const router = useRouter();
  const canEdit = can("console.content.update");

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [sections, setSections] = useState<{ key: string; title: string; legacy: boolean }[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lang, setLang] = useState<Lang>("it");
  const [previewLang, setPreviewLang] = useState<Lang>("it");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"title" | "server" | "legacy" | null>(null);
  const [confirm, setConfirm] = useState<"delete" | Lang | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const live = useRef(true);
  useEffect(() => () => void (live.current = false), []);

  const load = useCallback(() => {
    const lib = api.get<Library>("/lessons").then((l) => l.sections.map(({ key, title, legacy }) => ({ key, title, legacy })));
    if (isNew) {
      return lib.then(
        (s) => {
          setSections(s);
          const first = s.find((x) => !x.legacy && x.key === wanted) ?? s.find((x) => !x.legacy);
          setDraft(blank(first?.key ?? ""));
          setState("ready");
        },
        () => setState("error"),
      );
    }
    return Promise.all([api.get<LessonDetail>(`/lessons/${id}`), lib]).then(
      ([d, s]) => {
        setLesson(d);
        setDraft(draftOf(d));
        setSections(s);
        setState("ready");
      },
      (e) => setState(e instanceof ApiError && e.status === 404 ? "missing" : "error"),
    );
  }, [api, id, isNew, wanted]);
  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!draft && (isNew || (!!lesson && !same(draft, draftOf(lesson))));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
    setError(null);
  };
  const setLangField = (k: "title" | "summary", v: string) => draft && set(k, { ...draft[k], [lang]: v });

  const save = async () => {
    if (!draft) return;
    if (!draft.title.it.trim()) {
      setLang("it");
      setError("title");
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        const created = await api.post<LessonDetail>("/lessons", { ...draft, active: false });
        toast({ title: T.saved });
        router.replace(`/content/lessons/detail?id=${created.id}`);
      } else if (lesson) {
        const base = draftOf(lesson);
        const body: Record<string, unknown> = {};
        (Object.keys(draft) as (keyof Draft)[]).forEach((k) => {
          if (!same(draft[k], base[k])) body[k] = draft[k];
        });
        const saved = await api.put<LessonDetail>(`/lessons/${lesson.id}`, body);
        setLesson(saved);
        setDraft(draftOf(saved));
        toast({ title: T.saved, body: "La modifica è nel registro attività." });
      }
    } catch (e) {
      setError(e instanceof ApiError && e.code === "legacy_section" ? "legacy" : "server");
    }
    setBusy(false);
  };

  const removeVideo = async (l: Lang) => {
    if (!lesson) return;
    setBusy(true);
    try {
      const d = await api.del<LessonDetail>(`/lessons/${lesson.id}/videos/${l}`);
      setLesson((cur) => (cur ? { ...cur, videos: d.videos, last_change: d.last_change } : d));
      setConfirm(null);
    } catch {
      setConfirmError(T.save_err);
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!lesson) return;
    setBusy(true);
    try {
      await api.del(`/lessons/${lesson.id}`);
      toast({ title: T.e_delete_t, body: "La modifica è nel registro attività." });
      router.replace("/content/lessons");
    } catch {
      setConfirmError(T.save_err);
      setBusy(false);
    }
  };

  const onUploaded = useCallback((d: LessonDetail) => {
    if (!live.current) return;
    setLesson((cur) => (cur && cur.id === d.id ? { ...cur, videos: d.videos, last_change: d.last_change } : cur));
  }, []);

  const uploads = useUploads().filter((u) => u.lessonId === lesson?.id && u.status !== "done");
  const pickVideo = (l: Lang, file: File) => {
    if (!lesson) return;
    startVideoUpload({ api, owner: me?.user.id ?? null, lessonId: lesson.id, lessonTitle: lesson.title.it || lesson.title.en, lang: l, file, onDone: onUploaded });
  };

  const sendCover = async (file: File | null) => {
    if (!lesson) return;
    if (!file) {
      setBusy(true);
      try {
        const d = await api.del<LessonDetail>(`/lessons/${lesson.id}/thumbnail`);
        setLesson((cur) => (cur ? { ...cur, thumbnail_url: d.thumbnail_url } : d));
      } catch {
        toast({ title: T.save_err, kind: "error" });
      }
      setBusy(false);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    try {
      const d = await postForm<LessonDetail>(api, `/lessons/${lesson.id}/thumbnail`, form);
      setLesson((cur) => (cur ? { ...cur, thumbnail_url: d.thumbnail_url } : d));
    } catch (e) {
      toast({ title: e instanceof ApiError && (e.code === "bad_type" || e.code === "too_large") ? T.c_err : T.save_err, kind: "error" });
    }
    setBusy(false);
  };

  if (state === "loading" || state === "error" || state === "missing" || !draft || (!isNew && !lesson)) {
    return (
      <AdminFrame title={T.l_title}>
        {state === "missing" ? (
          <StateBlock kind="missing" title={T.lesson_404} body={T.lesson_404_b} action={<Link className="btn" href="/content/lessons">{T.back_list}</Link>} />
        ) : state === "error" ? (
          <StateBlock kind="error" title={T.l_err_one} action={<button type="button" className="btn" onClick={() => (setState("loading"), load())}>{T.retry}</button>} />
        ) : (
          <StateBlock kind="loading" />
        )}
      </AdminFrame>
    );
  }

  const title = isNew ? T.new_title : lesson!.title.it || lesson!.title.en;
  const legacyNow = sections.find((s) => s.key === draft.category)?.legacy ?? false;
  const ro = !canEdit;
  const missingEn = !draft.title.en.trim();

  return (
    <AdminFrame title={title} banner={ro ? <Banner kind="info">{T.readonly}</Banner> : undefined}>
      <PageHead
        title={title}
        sub={lesson ? fill(T.pos, { s: lesson.section_title, i: lesson.position.index, n: lesson.position.count }) : undefined}
        crumbs={[CRUMB, T.l_title, title]}
        actions={lesson ? lesson.active ? <Status kind="ok">{T.vis_on}</Status> : <Status kind="off">{T.vis_off}</Status> : undefined}
      />
      {lesson ? <div style={{ marginTop: -14, marginBottom: 22 }}><LastChangeLine change={lesson.last_change} /></div> : null}

      <div className="cc-two">
        <div className="cc-col">
          <Card title={T.e_texts} action={<LangSwitch value={lang} onChange={setLang} label={T.e_texts} marks={{ en: missingEn }} />}>
            <div className="field">
              <label htmlFor="l-title">{T.e_title}</label>
              <input id="l-title" className="input" value={draft.title[lang]} disabled={ro} aria-invalid={error === "title" && lang === "it" ? true : undefined} onChange={(e) => setLangField("title", e.target.value)} />
              {error === "title" && lang === "it" ? <p className="error-line" role="alert">{T.err_title}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="l-summary">{T.e_summary}</label>
              <textarea id="l-summary" className="input" rows={3} value={draft.summary[lang]} disabled={ro} onChange={(e) => setLangField("summary", e.target.value)} />
              <span className="note" style={{ alignSelf: "flex-end" }}>{draft.summary[lang].length} caratteri</span>
            </div>
            <Objectives
              items={draft.objectives[lang]}
              ro={ro}
              onChange={(items) => set("objectives", { ...draft.objectives, [lang]: items })}
            />
            <Hashtags tags={draft.hashtags} ro={ro} onChange={(t) => set("hashtags", t)} />
          </Card>

          <Card title={T.e_pub}>
            <div className="field">
              <label htmlFor="l-section">{T.e_section}</label>
              <select id="l-section" className="input" value={draft.category} disabled={ro} onChange={(e) => set("category", e.target.value)}>
                {sections.filter((s) => !s.legacy || s.key === lesson?.category).map((s) => (
                  <option key={s.key} value={s.key}>{s.title}</option>
                ))}
              </select>
            </div>
            <div className="cc-toggle-row">
              <div>
                <strong id="l-vis">{T.e_visible}</strong>
                <p className="note" style={{ fontSize: 14 }}>{isNew ? T.v_new_note : legacyNow ? T.legacy_locked : T.e_visible_hint}</p>
              </div>
              <Switch on={draft.active} label={T.e_visible} disabled={ro || isNew || (legacyNow && !draft.active)} onChange={(v) => set("active", v)} />
            </div>
          </Card>

          {lesson && canEdit ? (
            <Card>
              <div className="cc-toggle-row">
                <div>
                  <strong>{T.e_delete_t}</strong>
                  <p className="note" style={{ fontSize: 14 }}>{T.e_delete_b}</p>
                </div>
                <button type="button" className="btn btn-danger" onClick={() => (setConfirmError(null), setConfirm("delete"))}>{T.e_delete_t}</button>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="cc-col">
          <Card title={T.e_videos}>
            {lesson ? (
              <>
                {LANGS.map((l, i) => (
                  <div key={l} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {i ? <hr className="cc-hr" /> : null}
                    <h3 style={{ margin: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="report" size={16} />
                      {l === "it" ? T.v_it : T.v_en}
                    </h3>
                    {l === "it" && !lesson.videos.it ? <p className="note" style={{ fontSize: 14 }}>{T.v_it_missing}</p> : null}
                    <VideoSlot
                      lang={l}
                      video={lesson.videos[l]}
                      upload={uploads.find((u) => u.lang === l)}
                      ro={ro}
                      onPick={(f) => pickVideo(l, f)}
                      onRemove={() => (setConfirmError(null), setConfirm(l))}
                    />
                  </div>
                ))}
                <p className="note">{T.v_link_note}</p>
              </>
            ) : (
              <p className="note" style={{ fontSize: 14 }}>{T.v_new_note}</p>
            )}
          </Card>

          {lesson ? (
            <Card title={T.c_title}>
              <div className="cc-row" style={{ alignItems: "flex-start" }}>
                <Thumb url={lesson.thumbnail_url} size={72} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lesson.thumbnail_url ? null : <p className="note" style={{ fontSize: 14 }}>{T.c_none}</p>}
                  {canEdit ? (
                    <span className="cc-row" style={{ flexWrap: "wrap" }}>
                      <FileButton label={lesson.thumbnail_url ? T.v_replace : T.c_upload} accept="image/jpeg,image/png,image/webp" disabled={busy} onFile={sendCover} />
                      {lesson.thumbnail_url ? <button type="button" className="btn btn-danger" disabled={busy} onClick={() => sendCover(null)}>{T.v_remove}</button> : null}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          <Card title={T.pv_title} action={<LangSwitch value={previewLang} onChange={setPreviewLang} label={T.pv_title} />}>
            <div className="cc-preview">
              <div className="cc-preview-card">
                <span style={{ position: "relative" }}>
                  <Thumb url={lesson?.thumbnail_url ?? null} size={80} />
                  <span className="cc-badge" style={{ top: 6, left: 6 }}>{lesson?.position.index ?? "·"}</span>
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3>{draft.title[previewLang] || draft.title.it}</h3>
                  <p>{draft.summary[previewLang] || draft.summary.it}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {canEdit && (dirty || isNew) ? (
        <SaveBar
          message={isNew ? T.new_title : T.unsaved}
          saveLabel={isNew ? T.create : T.save}
          busy={busy}
          error={error === "server" ? T.save_err_srv : error === "title" ? T.err_title : error === "legacy" ? T.legacy_locked : null}
          onCancel={() => (isNew ? router.push("/content/lessons") : (setDraft(draftOf(lesson!)), setError(null)))}
          onSave={save}
        />
      ) : null}

      {confirm === "delete" && lesson ? (
        <ConfirmDialog title={T.del_q} message={fill(T.del_b, { t: title })} confirmLabel={T.del_go} busy={busy} error={confirmError} onConfirm={remove} onCancel={() => setConfirm(null)} />
      ) : null}
      {(confirm === "it" || confirm === "en") && lesson ? (
        <ConfirmDialog
          title={`Rimuovere il video ${LANG_WORD[confirm]}?`}
          message={fill(T.v_rm_b, { t: title })}
          confirmLabel={T.v_rm_go}
          busy={busy}
          error={confirmError}
          onConfirm={() => removeVideo(confirm)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      <UploadsTray />
    </AdminFrame>
  );
}

function Objectives({ items, ro, onChange }: { items: string[]; ro: boolean; onChange: (v: string[]) => void }) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="field" role="group" aria-labelledby="l-obj">
      <label id="l-obj">{T.e_objectives}</label>
      {items.map((o, i) => (
        <span key={i} className="cc-row">
          {ro ? null : <Grip label={`Sposta obiettivo ${i + 1}`} onMove={(d) => move(i, d)} />}
          <input className="input" aria-label={`${T.e_objectives} ${i + 1}`} value={o} disabled={ro} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          {ro ? null : (
            <button type="button" className="icon-btn" aria-label={`Togli obiettivo ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Icon name="close" size={16} />
            </button>
          )}
        </span>
      ))}
      {ro || items.length >= 10 ? null : (
        <button type="button" className="link-btn" style={{ alignSelf: "flex-start" }} onClick={() => onChange([...items, ""])}>{T.e_obj_add}</button>
      )}
      <p className="note">{T.e_objectives_hint}</p>
    </div>
  );
}

function Hashtags({ tags, ro, onChange }: { tags: string[]; ro: boolean; onChange: (t: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = normalizeTag(text);
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !text && tags.length) onChange(tags.slice(0, -1));
  };
  return (
    <div className="field">
      <label htmlFor={ro ? undefined : "l-tags"} id="l-tags-label">{T.e_tags}</label>
      <div className="cc-tags">
        {tags.map((t) => (
          <span key={t} className="cc-tag">
            {t}
            {ro ? null : (
              <button type="button" aria-label={`Togli ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
                <Icon name="close" size={13} />
              </button>
            )}
          </span>
        ))}
        {ro ? null : <input id="l-tags" value={text} placeholder={T.e_tags_add} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={add} />}
      </div>
    </div>
  );
}

export function FileButton({ label, accept, onFile, disabled, className = "btn" }: { label: string; accept: string; onFile: (f: File) => void; disabled?: boolean; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => ref.current?.click()}>
        <Glyph name="upload" size={16} />
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        aria-label={label}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

function VideoSlot({ lang, video, upload, ro, onPick, onRemove }: { lang: Lang; video: LessonVideo | null; upload?: Upload; ro: boolean; onPick: (f: File) => void; onRemove: () => void }) {
  const [over, setOver] = useState(false);
  const [refused, setRefused] = useState<"type" | "size" | null>(null);
  const take = (f: File | undefined) => {
    if (!f) return;
    const why = refuseVideo(f);
    setRefused(why);
    if (!why) onPick(f);
  };
  const accept = "video/mp4,video/quicktime,.mp4,.mov";
  const refusal = refused ? <p className="error-line" role="alert">{refused === "type" ? T.v_err_type : T.v_err_size}</p> : null;

  if (upload) {
    return (
      <div className="cc-video" aria-label={`${lang.toUpperCase()} ${upload.fileName}`}>
        <div className="cc-video-file">
          <span className="cc-play"><Glyph name="upload" size={18} /></span>
          <span style={{ minWidth: 0 }}>
            <strong>{upload.fileName}</strong>
            <span className="note" role={upload.status === "error" ? "alert" : undefined}>{upload.status === "error" ? T.v_err_net : uploadLine(upload)}</span>
          </span>
        </div>
        <Progress value={upload.size ? upload.sent / upload.size : 0} paused={upload.status === "paused" || upload.status === "error"} />
        {ro ? null : <UploadButtons u={upload} />}
        {video ? <p className="note">{T.v_keep}</p> : null}
      </div>
    );
  }
  if (video) {
    return (
      <div className="cc-video">
        <div className="cc-video-file">
          <span className="cc-play"><Glyph name="play" size={20} /></span>
          <span style={{ minWidth: 0 }}>
            <strong>{video.name}</strong>
            <span className="note">{fill(T.v_done, { dur: duration(video.duration) || "—", size: bytes(video.size) || "—", when: day(video.uploaded_at) || "—" })}</span>
          </span>
        </div>
        {ro ? null : (
          <span className="cc-row">
            <FileButton label={T.v_replace} accept={accept} onFile={(f) => take(f)} />
            <button type="button" className="btn btn-danger" onClick={onRemove}>{T.v_remove}</button>
          </span>
        )}
        {refusal}
        {ro ? null : <p className="note">{T.v_keep}</p>}
      </div>
    );
  }
  if (ro) return <p className="note">{T.missing}</p>;
  const dropProps = {
    onDragOver: (e: DragEvent) => (e.preventDefault(), setOver(true)),
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(false);
      take(e.dataTransfer.files?.[0]);
    },
  };
  return (
    <>
      <div className="cc-drop" data-over={over || undefined} {...dropProps}>
        <Glyph name="upload" size={22} />
        <strong>{over ? T.v_drop_over : T.v_drop}</strong>
        {over ? null : <FileButton label={T.v_choose} accept={accept} onFile={(f) => take(f)} />}
        <span className="note">{T.v_formats}</span>
      </div>
      {refusal}
    </>
  );
}
