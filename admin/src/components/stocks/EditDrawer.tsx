"use client";

// MOB-1377 (D400; boards ADM-STOCKS-03-modifica-*): the only four things the
// console changes on a stock: common name with its lock, alternative tickers,
// logo, Snapshot banner. Prices, official name, ticker and exchange stay with
// the syncs. A picture is checked here and sent at «Salva» with the rest;
// removing one also happens at «Salva». Two confirmations only: taking the
// lock off the name, and leaving with unsaved changes.

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog, Drawer } from "@/components/shell/overlays";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { IMAGE_TYPES, MAX_ALTERNATIVES, MAX_IMAGE_BYTES, TICKER_RE, displayName, megabytes, type StockPage } from "@/lib/stocks";
import { ReadOnlyNote, StockLogo } from "./parts";

type Kind = "logo" | "banner";
/** keep: unchanged; remove: «Togli» pressed; file: a new picture chosen (sent at Salva). */
type ImageEdit = { mode: "keep" } | { mode: "remove" } | { mode: "file"; file: File; preview: string };

const RULE: Record<Kind, string> = {
  logo: "PNG, JPG o WebP quadrato, almeno 256 px, fino a 1 MB.",
  banner: "PNG o JPG 1500 × 500, fino a 3 MB. Va in testa al PDF dello Snapshot.",
};
const TITLE: Record<Kind, string> = { logo: "Logo", banner: "Banner dello Stock Snapshot" };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function Toggle({ on, disabled, label, onChange }: { on: boolean; disabled?: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      style={{ flex: "none", width: 52, height: 30, borderRadius: 999, border: 0, padding: 3, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.38 : 1,
        background: on ? "linear-gradient(180deg, #23c1b4, #168f88)" : "rgba(255,255,255,0.14)", display: "flex", justifyContent: on ? "flex-end" : "flex-start" }}
    >
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff" }} />
    </button>
  );
}

function ImageSlot({ kind, current, edit, error, symbol, onPick, onRemove, onUndo }: {
  kind: Kind; current: string | null; edit: ImageEdit; error: string | null; symbol: string;
  onPick: (f: File) => void; onRemove: () => void; onUndo: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const logo = kind === "logo";
  const shown = edit.mode === "file" ? edit.preview : edit.mode === "remove" ? null : current;
  const box = logo ? { width: 96, height: 96, borderRadius: 22 } : { width: 360, maxWidth: "100%", height: 120, borderRadius: 16 };
  const pick = (
    <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} hidden aria-label={`Scegli il file: ${TITLE[kind]}`}
      onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
  );
  let pic: ReactNode;
  if (!shown) {
    pic = (
      <button type="button" onClick={() => input.current?.click()} style={{ ...box, flex: "none", border: "1.5px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", color: "var(--accent)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontWeight: 650, fontSize: 13 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>Carica
      </button>
    );
  } else if (logo) {
    pic = <StockLogo symbol={symbol} url={shown} size={96} />;
  } else {
    // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimiser
    pic = <img src={shown} alt="" style={{ ...box, objectFit: "cover", flex: "none" }} />;
  }
  let side: ReactNode;
  if (edit.mode === "remove") {
    side = (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", lineHeight: "18px" }}>Lo togli salvando.{logo ? "" : " Gli Snapshot già generati non cambiano."}</span>
        <button type="button" className="link-btn" style={{ alignSelf: "flex-start", fontSize: 13 }} onClick={onUndo}>Annulla</button>
      </div>
    );
  } else if (!shown) {
    side = <p className="note">{RULE[kind]}</p>;
  } else {
    side = (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button type="button" className="btn" style={{ height: 36, padding: "0 14px", fontSize: 14 }} onClick={() => input.current?.click()}>
            <Icon name="edit" size={15} /> Sostituisci
          </button>
          <button type="button" className="link-btn" style={{ fontSize: 14 }} onClick={edit.mode === "file" && !current ? onUndo : onRemove}>Togli</button>
        </div>
        <p className="note">{RULE[kind]}</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>{TITLE[kind]}</span>
      <div style={{ display: "flex", gap: 16, alignItems: logo ? "center" : "stretch", flexDirection: logo ? "row" : "column" }}>
        {pic}
        <div style={{ flex: 1, minWidth: 0 }}>{side}</div>
      </div>
      {pick}
      {error ? <p className="error-line" role="alert">{error}</p> : null}
    </div>
  );
}

export function EditDrawer({ stock, onClose, onSaved }: { stock: StockPage; onClose: () => void; onSaved: (s: StockPage) => void }) {
  const { api, toast } = useConsole();
  const id = useId();
  const [name, setName] = useState(stock.common_name ?? "");
  const [locked, setLocked] = useState(stock.common_name_locked);
  const [tags, setTags] = useState<string[]>(stock.alternatives);
  const [typing, setTyping] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [images, setImages] = useState<Record<Kind, ImageEdit>>({ logo: { mode: "keep" }, banner: { mode: "keep" } });
  const [imageError, setImageError] = useState<Record<Kind, string | null>>({ logo: null, banner: null });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [ask, setAsk] = useState<"unlock" | "discard" | null>(null);
  const autoLocked = useRef(false);

  const trimmed = name.trim();
  const nameChanged = trimmed !== (stock.common_name ?? "");
  const lockChanged = (trimmed ? locked : false) !== stock.common_name_locked;
  const tagsChanged = tags.join("\n") !== stock.alternatives.join("\n");
  const imagesChanged = images.logo.mode !== "keep" || images.banner.mode !== "keep";
  const dirty = nameChanged || lockChanged || tagsChanged || imagesChanged || typing.trim() !== "";
  // A refused pick leaves the slot as it was: its message stays, but only a refused file still in the slot blocks Salva.
  const blocked = (["logo", "banner"] as Kind[]).some((k) => imageError[k] && images[k].mode === "file") || !!tagError;

  // Previews of chosen files: freed when replaced and when the drawer closes.
  const previews = useRef<string[]>([]);
  useEffect(() => {
    const all = previews.current;
    return () => all.forEach((u) => URL.revokeObjectURL?.(u));
  }, []);
  const setSlot = (kind: Kind, edit: ImageEdit) => {
    const old = images[kind];
    if (old.mode === "file" && old.preview) URL.revokeObjectURL?.(old.preview);
    setImages({ ...images, [kind]: edit });
    setImageError({ ...imageError, [kind]: null });
  };
  const switchTouched = useRef(false);

  const onName = (v: string) => {
    setName(v);
    // A name written by hand is locked by default (the AI would otherwise rewrite it at its next run); the switch can still turn it off.
    if (!autoLocked.current && !switchTouched.current && v.trim() && v.trim() !== (stock.common_name ?? "")) {
      autoLocked.current = true;
      setLocked(true);
    }
  };

  const onLock = (v: boolean) => {
    switchTouched.current = true;
    if (!v && stock.common_name_locked && locked) setAsk("unlock");
    else setLocked(v);
  };

  const addTag = (raw: string): boolean => {
    const t = raw.trim().toUpperCase();
    if (!t) return true;
    if (!TICKER_RE.test(t) || t.length > 20) {
      setTagError(`«${t}» non è un ticker: solo lettere, numeri e . - / :`);
      return false;
    }
    if (!tags.includes(t) && tags.length >= MAX_ALTERNATIVES) {
      setTagError(`Al massimo ${MAX_ALTERNATIVES} ticker alternativi.`);
      return false;
    }
    if (t === stock.symbol.toUpperCase() || tags.includes(t)) {
      setTyping("");
      setTagError(null);
      return true;
    }
    setTags([...tags, t]);
    setTyping("");
    setTagError(null);
    return true;
  };

  const pick = (kind: Kind, f: File) => {
    if (!IMAGE_TYPES.includes(f.type)) {
      setImageError({ ...imageError, [kind]: "Il file non è un’immagine PNG, JPG o WebP." });
      return;
    }
    if (f.size > MAX_IMAGE_BYTES[kind]) {
      setImageError({ ...imageError, [kind]: `Il file pesa ${megabytes(f.size)}: il massimo è ${kind === "logo" ? "1 MB" : "3 MB"}.` });
      return;
    }
    const preview = typeof URL.createObjectURL === "function" ? URL.createObjectURL(f) : "";
    if (preview) previews.current.push(preview);
    setSlot(kind, { mode: "file", file: f, preview });
  };

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty) setAsk("discard");
    else onClose();
  }, [busy, dirty, onClose]);

  const save = async () => {
    if (typing.trim() && !addTag(typing)) return;
    const pending = typing.trim() ? [...tags, typing.trim().toUpperCase()].filter((t, i, a) => a.indexOf(t) === i && t !== stock.symbol.toUpperCase()) : tags;
    const body: Record<string, unknown> = {};
    if (nameChanged) body.common_name = trimmed || null;
    if (nameChanged || lockChanged) body.common_name_locked = trimmed ? locked : false;
    if (pending.join("\n") !== stock.alternatives.join("\n")) body.alternatives = pending;
    setBusy(true);
    setSaveError(false);
    try {
      for (const k of ["logo", "banner"] as Kind[]) {
        const e = images[k];
        if (e.mode === "remove") body[k] = null;
        if (e.mode === "file") body[k] = { data: await readAsDataUrl(e.file) };
      }
      const fresh = await api.put<StockPage>(`/stocks/${stock.id}`, body);
      toast({ title: "Modifiche salvate", body: "Le trovi nel registro attività." });
      onSaved(fresh);
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      const data = (err?.body ?? {}) as { ticker?: string; field?: Kind; size_kb?: number };
      if (err?.code === "duplicate_ticker" && data.ticker) setTagError(`«${data.ticker}» è già il ticker di un altro titolo.`);
      else if (err?.code === "image_too_big" && data.field) setImageError({ ...imageError, [data.field]: `Il file pesa ${megabytes((data.size_kb ?? 0) * 1024)}: il massimo è ${data.field === "logo" ? "1 MB" : "3 MB"}.` });
      else if (err?.code === "image_dimensions" && data.field) setImageError({ ...imageError, [data.field]: "L’immagine è troppo grande: al massimo 5000 pixel per lato." });
      else if (err?.code === "image_type" && data.field) setImageError({ ...imageError, [data.field]: "Il file non è un’immagine PNG, JPG o WebP." });
      else setSaveError(true);
    }
    setBusy(false);
  };

  return (
    <>
      <Drawer
        title="Modifica titolo"
        sub={`${stock.symbol} · ${displayName(stock)}`}
        onClose={requestClose}
        footer={
          <>
            <button type="button" className="btn" onClick={requestClose} disabled={busy}>Annulla</button>
            <button type="button" className="btn btn-primary" disabled={!dirty || busy || blocked} aria-busy={busy || undefined} onClick={save}>
              {busy ? "Salvataggio…" : "Salva"}
            </button>
          </>
        }
      >
        <ReadOnlyNote>Prezzi, nome ufficiale, ticker e borsa arrivano dalla sincronizzazione: qui non si modificano.</ReadOnlyNote>
        {saveError ? <div className="banner" data-kind="warn" role="alert" style={{ margin: 0 }}><Icon name="alert" size={17} /> Salvataggio non riuscito. Riprova.</div> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label htmlFor={`${id}-name`}>Nome comune</label>
            <input id={`${id}-name`} className="input" value={name} maxLength={120} placeholder={stock.name ? `Nome ufficiale: ${stock.name}` : undefined} onChange={(e) => onName(e.target.value)} />
            <p className="note" style={{ paddingLeft: 4 }}>Il nome che l’app mostra. Vuoto: l’app usa il nome ufficiale.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.035)", border: "1px solid var(--hair)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 15, fontWeight: 650 }}>
                <span style={{ color: locked && trimmed ? "var(--accent-soft)" : "var(--text-3)", display: "inline-flex" }}><Icon name="lock" size={15} /></span>
                Blocca il nome
              </span>
              <span className="note">L’AI non lo cambia più. Senza blocco, il prossimo giro dell’AI può riscriverlo.</span>
            </div>
            <Toggle on={!!trimmed && locked} disabled={!trimmed} label="Blocca il nome" onChange={onLock} />
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${id}-tags`}>Ticker alternativi</label>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 52, padding: "10px 12px", borderRadius: 16, border: `1.5px solid ${tagError ? "var(--warn)" : "rgba(255,255,255,0.14)"}`, background: "rgba(255,255,255,0.03)" }}>
            {tags.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 6px 0 10px", borderRadius: 9, background: "rgba(255,255,255,0.08)", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600 }}>
                {t}
                <button type="button" aria-label={`Togli ${t}`} onClick={() => (setTags(tags.filter((x) => x !== t)), setTagError(null))} style={{ width: 22, height: 22, border: 0, background: "none", color: "var(--text-2)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={12} />
                </button>
              </span>
            ))}
            <input
              id={`${id}-tags`}
              value={typing}
              aria-invalid={tagError ? true : undefined}
              placeholder={tags.length ? "" : "Aggiungi un ticker"}
              onChange={(e) => (setTyping(e.target.value), setTagError(null))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(typing);
                } else if (e.key === "Backspace" && !typing && tags.length) setTags(tags.slice(0, -1));
              }}
              style={{ flex: 1, minWidth: 120, height: 30, border: 0, outline: "none", background: "none", color: "var(--text)", fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600 }}
            />
          </div>
          {tagError ? <p className="error-line" role="alert">{tagError}</p> : <p className="note" style={{ paddingLeft: 4 }}>Altri simboli con cui gli utenti cercano questo titolo. Invio per aggiungerne uno.</p>}
        </div>

        {(["logo", "banner"] as Kind[]).map((k) => (
          <ImageSlot
            key={k}
            kind={k}
            symbol={stock.symbol}
            current={k === "logo" ? stock.logo.uploaded_url : stock.banner.url}
            edit={images[k]}
            error={imageError[k]}
            onPick={(f) => pick(k, f)}
            onRemove={() => setSlot(k, { mode: "remove" })}
            onUndo={() => setSlot(k, { mode: "keep" })}
          />
        ))}
      </Drawer>

      {ask === "unlock" ? (
        <ConfirmDialog
          title="Togliere il blocco al nome?"
          message={`Al prossimo giro l’AI può sostituire «${trimmed}» con un nome scelto da lei.`}
          confirmLabel="Togli il blocco"
          kind="primary"
          onConfirm={() => (setLocked(false), setAsk(null))}
          onCancel={() => setAsk(null)}
        />
      ) : null}
      {ask === "discard" ? (
        <ConfirmDialog
          title="Uscire senza salvare?"
          message="Le modifiche al nome comune e ai ticker alternativi vanno perse."
          confirmLabel="Esci senza salvare"
          onConfirm={() => (setAsk(null), onClose())}
          onCancel={() => setAsk(null)}
        />
      ) : null}
    </>
  );
}
