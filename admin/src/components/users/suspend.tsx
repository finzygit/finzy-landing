"use client";

// MOB-1462 (boards ADM-UB-03…ADM-UB-07, design PR #751): «Sospendi utente»
// and «Riattiva utente» on the user's page, and the red strip of a suspended
// account. POST /users/{id}/suspend {reason} and /users/{id}/reactivate
// (console.users.suspend). Suspending signs the user out of every device and
// refuses sign-in in the app (backend AccountSuspension). Texts are the
// board's; the «nuovo» ones wait for Victor's OK (D385).

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { dmy, PLAN_LABEL, type UserPage } from "./model";
import { BusyButton, Callout, Field, FormDialog, UIcon, UserAvatar } from "./parts";

const MAX = 500;

/** «dall’App Store», «da Google Play», «dal sito». */
function fromWhere(store: string): string {
  if (store === "Google Play") return "da Google Play";
  if (store === "Stripe" || store === "Web") return "dal sito";
  return "dall’App Store";
}

/** Whom the dialog is about: the avatar, the name and the e-mail. */
function WhoCard({ page }: { page: UserPage }) {
  const u = page.user;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.04)", margin: "16px 0 12px" }}>
      <UserAvatar name={u.name} email={u.email} size={40} url={u.avatar_url} />
      <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <strong>{u.name ?? <span className="muted" style={{ fontStyle: "italic", fontWeight: 400 }}>Senza nome</span>}</strong>
        <span className="sub" style={{ overflowWrap: "anywhere" }}>{u.email}</span>
      </span>
    </div>
  );
}

export function SuspendDialog({ page, onDone, onCancel }: { page: UserPage; onDone: (p: UserPage) => void; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);
  const empty = !reason.trim();
  const store = page.plan.store;

  const submit = async () => {
    setTouched(true);
    if (empty) return;
    setBusy(true);
    setFailed(false);
    try {
      const next = await api.post<UserPage>(`/users/${page.user.id}/suspend`, { reason: reason.trim() });
      toast({ title: "Utente sospeso", body: "Sessioni chiuse su tutti i dispositivi." });
      onDone(next);
    } catch (e) {
      // The account got panel access meanwhile, or it is your own: say why, nothing changed.
      if (e instanceof ApiError && (e.code === "staff_account" || e.code === "self")) {
        setRefused(e.code === "self" ? "Non puoi sospendere il tuo account." : "Ha accesso al pannello: prima togli l’accesso da Persone con accesso.");
        setBusy(false);
        return;
      }
      if (e instanceof ApiError && e.status === 409 && e.code === "already_suspended") {
        // Already suspended by someone else a moment ago: show the page as it is now.
        try {
          onDone(await api.get<UserPage>(`/users/${page.user.id}`));
        } catch {
          onCancel();
        }
        return;
      }
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <FormDialog
      title="Sospendere l’utente?"
      icon={<span style={{ color: "var(--down)", display: "inline-flex" }}><UIcon name="ban" /></span>}
      busy={busy}
      onCancel={onCancel}
      width={520}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Sospensione…" className="btn btn-danger" disabled={empty} onClick={submit}>
            <UIcon name="ban" size={17} /> Sospendi
          </BusyButton>
        </>
      }
    >
      <WhoCard page={page} />
      <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: "22px" }}>Esce subito da tutti i dispositivi e non può più accedere all’app finché non riattivi l’account.</p>
      {store && store.auto_renew ? (
        <Callout kind="info" title="L’abbonamento dello store non si ferma">
          Ha {PLAN_LABEL[store.plan]} {fromWhere(store.name)} con il rinnovo acceso: continua a pagare finché non lo disdice. Sospendere non disdice l’abbonamento.
        </Callout>
      ) : null}
      {failed ? <Callout alert title="Non è stato possibile sospendere">Riprova. L’utente può ancora accedere.</Callout> : null}
      {refused ? <Callout alert title="Non è stato possibile sospendere">{refused}</Callout> : null}
      <Field id="suspend-reason" label="Motivo" required error={touched && empty ? "Scrivi il motivo." : null} hint={`${reason.length}/${MAX}`}>
        <textarea
          id="suspend-reason"
          className="input"
          rows={3}
          maxLength={MAX}
          style={{ height: "auto", padding: "14px 18px", resize: "vertical", fontFamily: "inherit" }}
          placeholder="Per esempio: abuso, account condiviso, richiesta dell’utente"
          aria-invalid={(touched && empty) || undefined}
          aria-describedby="suspend-reason-msg"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </Field>
      <p className="note" style={{ margin: "8px 0 0" }}>La sospensione resta nel registro attività, con il tuo nome e il motivo.</p>
    </FormDialog>
  );
}

export function ReactivateDialog({ page, onDone, onCancel }: { page: UserPage; onDone: (p: UserPage) => void; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const next = await api.post<UserPage>(`/users/${page.user.id}/reactivate`, {});
      toast({ title: "Utente riattivato", body: "Può di nuovo accedere all’app." });
      onDone(next);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.code === "not_suspended") {
        try {
          onDone(await api.get<UserPage>(`/users/${page.user.id}`));
        } catch {
          onCancel();
        }
        return;
      }
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <FormDialog
      title="Riattivare l’utente?"
      sub={`${page.user.email} potrà di nuovo accedere all’app. Dovrà rifare l’accesso su ogni dispositivo.`}
      icon={<UIcon name="replay" />}
      busy={busy}
      onCancel={onCancel}
      width={480}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Riattivazione…" onClick={submit}>Riattiva</BusyButton>
        </>
      }
    >
      {failed ? <div style={{ marginTop: 14 }}><Callout alert title="Non è stato possibile riattivare">Riprova: l’utente è ancora sospeso.</Callout></div> : null}
    </FormDialog>
  );
}

/** The red strip on top of a suspended user's page: when, who, why, and «Riattiva» (Zendesk on Mobbin). */
export function SuspendedStrip({ page, canReactivate, onReactivate }: { page: UserPage; canReactivate: boolean; onReactivate: () => void }) {
  // An answer with suspended_at but no suspension details still shows the strip, with the date only.
  const s = page.suspension ?? (page.user.suspended_at ? { at: page.user.suspended_at, by: null, reason: null } : null);
  if (!s) return null;
  return (
    <div role="status" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 20, background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.35)", marginBottom: 18 }}>
      <span style={{ color: "#ff8a80", display: "inline-flex", flex: "none" }}><UIcon name="ban" size={20} /></span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <strong style={{ color: "#ff8a80" }}>Sospeso dal {dmy(s.at)}{s.by ? ` da ${s.by}` : ""}</strong>
        {s.reason ? (
          <span style={{ fontSize: 14, color: "var(--text-2)", overflowWrap: "anywhere" }}>
            Motivo: <em>«{s.reason}»</em>
          </span>
        ) : null}
        {!canReactivate ? <span className="note">Puoi solo vedere: per riattivare serve «Utenti · Sospendi e riattiva».</span> : null}
      </div>
      {canReactivate ? (
        <button type="button" className="btn" onClick={onReactivate}>
          <UIcon name="replay" size={17} /> Riattiva
        </button>
      ) : null}
    </div>
  );
}
