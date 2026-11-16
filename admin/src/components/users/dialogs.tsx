"use client";

// MOB-1374: the Utenti dialogs (boards ADM-U-06…ADM-U-11). Each keeps its
// failure inside (the plan or the account is unchanged), shows the busy label
// on its own button, and closes only on success or Annulla.

import { useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { csvName, dmy, fmt, monthsAhead, parseDmy, PLAN_LABEL, plansInWords, todayYmd, type Plan, type UserPage } from "./model";
import { BusyButton, Callout, Field, FormDialog, UIcon } from "./parts";

const SAVE_FAIL = "Non è stato possibile salvare";
const SAVE_FAIL_BODY = "Riprova. Il piano dell’utente non è cambiato.";

/** The Laravel validation message of a field, when the backend refused the form (422). */
function fieldError(e: unknown, field: string): string | null {
  if (!(e instanceof ApiError) || e.status !== 422) return null;
  const errors = (e.body as { errors?: Record<string, string[]> } | null)?.errors;
  return errors?.[field]?.[0] ?? null;
}

function who(page: UserPage) {
  return [page.user.name, page.user.email].filter(Boolean).join(" · ");
}

// ---------------------------------------------------------------- Regala piano (#237)

export function GiftDialog({ page, onDone, onCancel }: { page: UserPage; onDone: (p: UserPage) => void; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [tier, setTier] = useState<"premium" | "unlimited" | null>(null);
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [server, setServer] = useState<Record<string, string | null>>({});

  const ymd = parseDmy(until);
  // «Today» is Rome's, as the backend's after:today.
  const dateErr = !until.trim() ? "Indica la scadenza." : !ymd ? "Scrivi la data come gg/mm/aaaa." : ymd <= todayYmd() ? "La scadenza deve essere dopo oggi." : null;
  const complete = !!tier && !dateErr && reason.trim() !== "";
  const lower = tier ? page.words.lower[tier] : null;

  const submit = async () => {
    setTouched({ tier: true, until: true, reason: true });
    if (!complete || !tier || !ymd) return;
    setBusy(true);
    setFailed(false);
    try {
      const next = await api.post<UserPage>(`/users/${page.user.id}/plan/gift`, { tier, until: ymd, reason: reason.trim() });
      toast({ title: "Piano regalato", body: `${PLAN_LABEL[tier]} fino al ${dmy(ymd)}.` });
      onDone(next);
    } catch (e) {
      const fields = { tier: fieldError(e, "tier"), until: fieldError(e, "until"), reason: fieldError(e, "reason") };
      if (fields.tier || fields.until || fields.reason) setServer(fields);
      else setFailed(true);
      setBusy(false);
    }
  };

  const quick: [string, number][] = [["1 mese", 1], ["3 mesi", 3], ["6 mesi", 6], ["1 anno", 12]];
  return (
    <FormDialog
      title="Regala un piano"
      sub={who(page)}
      icon={<UIcon name="gift" />}
      busy={busy}
      onCancel={onCancel}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Salvataggio…" disabled={!complete} onClick={submit}>
            <UIcon name="gift" size={17} /> Regala
          </BusyButton>
        </>
      }
    >
      {failed ? <Callout alert title={SAVE_FAIL}>{SAVE_FAIL_BODY}</Callout> : null}
      {page.words.paying ? <Callout title={page.words.paying_title ?? ""}>{page.words.paying}</Callout> : null}
      {lower ? (
        <Callout kind="info" title="Il regalo non cambia il piano finché lo store è attivo">
          {lower.replace("{date}", ymd ? dmy(ymd) : "termine del regalo")}
        </Callout>
      ) : null}
      {page.words.replaces ? <Callout kind="info" title="Sostituisce il regalo attivo">{page.words.replaces}</Callout> : null}

      <div className="field" role="radiogroup" aria-labelledby="gift-plan-label">
        <label id="gift-plan-label">Piano<span aria-hidden="true" style={{ color: "var(--text-3)" }}> *</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["premium", "unlimited"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tier === t}
              onClick={() => setTier(t)}
              className="btn"
              style={{ height: "auto", minHeight: 64, padding: "10px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2, whiteSpace: "normal", textAlign: "left", ...(tier === t ? { borderColor: "rgba(109,217,225,0.7)", background: "rgba(39,204,216,0.08)" } : {}) }}
            >
              <span>{PLAN_LABEL[t]}</span>
              <span className="sub">{t === "premium" ? "3 Stock Snapshot al giorno" : "7 Stock Snapshot al giorno"}</span>
            </button>
          ))}
        </div>
        {(touched.tier && !tier) || server.tier ? <p className="error-line" role="alert">{server.tier ?? "Scegli il piano."}</p> : null}
      </div>

      <Field id="gift-until" label="Scadenza" required error={server.until ?? (touched.until ? dateErr : null)}>
        <div style={{ position: "relative" }}>
          <input
            id="gift-until"
            className="input"
            inputMode="numeric"
            placeholder="gg/mm/aaaa"
            value={until}
            aria-invalid={(touched.until && !!dateErr) || !!server.until || undefined}
            aria-describedby={server.until || (touched.until && dateErr) ? "gift-until-msg" : undefined}
            onChange={(e) => (setUntil(e.target.value), setServer((x) => ({ ...x, until: null })))}
            onBlur={() => setTouched((t) => ({ ...t, until: true }))}
          />
          <span style={{ position: "absolute", right: 16, top: 17, color: "var(--text-3)", pointerEvents: "none" }}>
            <UIcon name="calendar" />
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {quick.map(([label, n]) => {
            const v = monthsAhead(n);
            return (
              <button key={label} type="button" className="chip" data-kind={until === v ? "create" : "access"} style={{ height: 30, border: 0, cursor: "pointer" }} aria-pressed={until === v} onClick={() => (setUntil(v), setTouched((t) => ({ ...t, until: true })))}>
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field id="gift-reason" label="Motivo" required error={server.reason ?? (touched.reason && !reason.trim() ? "Scrivi il motivo." : null)}>
        <textarea
          id="gift-reason"
          className="input"
          rows={3}
          maxLength={500}
          style={{ height: "auto", padding: "14px 18px", resize: "vertical", fontFamily: "inherit" }}
          placeholder="Per esempio: famiglia, marketing, assistenza"
          value={reason}
          aria-invalid={(touched.reason && !reason.trim()) || undefined}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
        />
      </Field>
      <p className="note">Il regalo resta nello storico dei piani e nel registro attività, con il tuo nome.</p>
    </FormDialog>
  );
}

// ---------------------------------------------------------------- Revoca regalo (#237)

export function RevokeDialog({ page, onDone, onCancel }: { page: UserPage; onDone: (p: UserPage) => void; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    setTouched(true);
    if (!reason.trim()) return;
    setBusy(true);
    setFailed(false);
    try {
      const next = await api.post<UserPage>(`/users/${page.user.id}/plan/revoke`, { reason: reason.trim() });
      toast({ title: "Regalo revocato", body: next.message });
      onDone(next);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Another admin revoked it a moment ago: show the page as it is now.
        toast({ title: "Il regalo era già stato revocato", kind: "info" });
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
      title="Revoca il regalo"
      sub={page.words.revoke ?? undefined}
      icon={<UIcon name="replay" />}
      busy={busy}
      onCancel={onCancel}
      width={480}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Revoca in corso…" className="btn btn-danger" disabled={!reason.trim()} onClick={submit}>
            Revoca
          </BusyButton>
        </>
      }
    >
      {failed ? <Callout alert title={SAVE_FAIL}>Riprova. Il regalo è ancora attivo.</Callout> : null}
      <Field id="revoke-reason" label="Motivo" required error={touched && !reason.trim() ? "Scrivi il motivo." : null}>
        <textarea
          id="revoke-reason"
          className="input"
          rows={3}
          maxLength={500}
          style={{ height: "auto", padding: "14px 18px", resize: "vertical", fontFamily: "inherit" }}
          placeholder="Perché togli il regalo"
          aria-invalid={(touched && !reason.trim()) || undefined}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </Field>
    </FormDialog>
  );
}

// ---------------------------------------------------------------- Modifica

type RoleOpt = { id: number; name: string; locked: boolean };

/**
 * Name, e-mail and picture. The password never changes from here. A super
 * admin also sees «Accesso al pannello», saved through the shell's people API
 * (the same checks as «Persone con accesso»).
 */
export function EditDialog({
  page,
  roles,
  isSuper,
  isSelf,
  onDone,
  onPage,
  onCancel,
}: {
  page: UserPage;
  roles: RoleOpt[] | null;
  isSuper: boolean;
  isSelf: boolean;
  onDone: (p: UserPage) => void;
  /** The page changed while the dialog stays open (the picture was removed). */
  onPage: (p: UserPage) => void;
  onCancel: () => void;
}) {
  const { api, toast } = useConsole();
  const [name, setName] = useState(page.user.name ?? "");
  const [email, setEmail] = useState(page.user.email);
  const [roleId, setRoleId] = useState<number | null>(page.access?.role_id ?? null);
  const [busy, setBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [hasAvatar, setHasAvatar] = useState(page.user.has_avatar);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const oldRole = page.access?.role_id ?? null;

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      const next = await api.del<UserPage>(`/users/${page.user.id}/avatar`);
      setHasAvatar(false);
      if (next && typeof next === "object" && "user" in next) onPage(next);
    } catch {
      setFailed("Non è stato possibile togliere l’immagine. Riprova.");
    }
    setAvatarBusy(false);
  };

  const submit = async () => {
    if (!emailOk) return;
    setBusy(true);
    setFailed(null);
    setEmailErr(null);
    let next: UserPage;
    try {
      next = await api.put<UserPage>(`/users/${page.user.id}`, { name: name.trim(), email: email.trim() });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : null;
      if (code === "email_taken") setEmailErr("Questa email è già usata da un altro account.");
      else if (fieldError(e, "email")) setEmailErr("Indica un’email valida.");
      else setFailed("Non è stato possibile salvare. Riprova.");
      setBusy(false);
      return;
    }
    // Name and e-mail are saved: a refused access change never hides that.
    if (isSuper && !isSelf && roleId !== oldRole) {
      try {
        if (oldRole === null && roleId !== null) await api.post("/people", { email: next.user.email, role_id: roleId });
        else if (roleId === null) await api.del(`/people/${page.user.id}`);
        else await api.put(`/people/${page.user.id}`, { role_id: roleId });
        next = await api.get<UserPage>(`/users/${page.user.id}`);
      } catch (e) {
        const code = e instanceof ApiError ? e.code : null;
        const why =
          code === "last_super_admin"
            ? "È l’unico super amministratore con la verifica attiva: non si può togliere."
            : code === "already_has_access"
              ? "Ha già accesso alla console: cambialo da Persone con accesso."
              : "Riprova da Persone con accesso.";
        toast({ title: "Nome ed email salvati; l’accesso al pannello non è cambiato", body: why, kind: "error" });
        onDone(next);
        return;
      }
    }
    toast({ title: "Modifiche salvate" });
    onDone(next);
  };

  return (
    <FormDialog
      title="Modifica l’utente"
      sub={page.user.email}
      icon={<Icon name="edit" size={18} />}
      busy={busy || avatarBusy}
      onCancel={onCancel}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Salvataggio…" disabled={!emailOk} onClick={submit}>Salva</BusyButton>
        </>
      }
    >
      {failed ? <Callout alert title="Non è stato possibile salvare">{failed}</Callout> : null}
      <Field id="edit-name" label="Nome">
        <input id="edit-name" className="input" maxLength={191} value={name} placeholder="Nome e cognome" onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field id="edit-email" label="Email" error={emailErr ?? (!emailOk && email ? "Indica un’email valida." : null)} hint="L’utente accederà all’app con la nuova email.">
        <input id="edit-email" className="input" type="email" maxLength={191} aria-describedby="edit-email-msg" value={email} aria-invalid={!!emailErr || undefined} onChange={(e) => (setEmail(e.target.value), setEmailErr(null))} />
      </Field>
      <div className="field">
        <label>Immagine</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="note" style={{ fontSize: 14 }}>{hasAvatar ? "L’utente ha un’immagine." : "Nessuna immagine."}</span>
          {hasAvatar ? (
            <BusyButton busy={avatarBusy} busyLabel="…" className="btn btn-danger" onClick={removeAvatar}>
              <UIcon name="trash" size={16} /> Togli immagine
            </BusyButton>
          ) : null}
        </div>
      </div>
      {isSuper ? (
        <Field id="edit-role" label="Accesso al pannello" hint={isSelf ? "Sei tu: il ruolo e l’accesso li può cambiare solo un altro super amministratore." : "Solo un super amministratore vede e cambia questa scelta. Chi entra nel pannello deve attivare la verifica in due passaggi."}>
          <select id="edit-role" className="input" disabled={isSelf || roles === null} value={roleId ?? ""} onChange={(e) => setRoleId(Number(e.target.value) || null)}>
            <option value="">Nessuno</option>
            {(roles ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
      ) : null}
      <p className="note">La password non si cambia da qui: l’utente usa «Password dimenticata» nell’app.</p>
    </FormDialog>
  );
}

// ---------------------------------------------------------------- Elimina account

export function DeleteDialog({ page, onDone, onCancel }: { page: UserPage; onDone: () => void; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [typed, setTyped] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const match = typed.trim().toLowerCase() === page.user.email.toLowerCase();
  const store = page.plan.store && page.plan.store.auto_renew && page.plan.store.name !== "Regalo" ? page.plan.store : null;
  const where = store?.name === "Google Play" ? "dal Play Store" : store?.name === "App Store" ? "dalle impostazioni del suo ID Apple" : `dal suo abbonamento ${store?.name ?? ""}`;

  const submit = async () => {
    setTouched(true);
    if (!match) return;
    setBusy(true);
    setFailed(false);
    try {
      await deleteUser(api, page.user.id, typed.trim());
      toast({ title: "Account eliminato", body: `${page.user.email} e i suoi dati sono stati cancellati.` });
      onDone();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <FormDialog
      title="Eliminare l’account?"
      sub={who(page)}
      icon={<UIcon name="trash" />}
      busy={busy}
      onCancel={onCancel}
      width={520}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Eliminazione…" className="btn btn-danger" disabled={!match} onClick={submit}>
            Elimina account
          </BusyButton>
        </>
      }
    >
      {failed ? <Callout alert title="Non è stato possibile eliminare l’account">Riprova. L’account e i dati sono ancora tutti al loro posto.</Callout> : null}
      <div>
        <p style={{ fontWeight: 600, color: "var(--text)" }}>Si cancellano subito:</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, color: "var(--text-2)", fontSize: 15, lineHeight: "22px" }}>
          <li>profilo, immagine e preferenze</li>
          <li>osservati, portafoglio e cronologia</li>
          <li>consensi e dispositivi collegati</li>
          <li>l’accesso all’app, il collegamento con l’abbonamento e le email automatiche</li>
        </ul>
        <p className="note" style={{ marginTop: 10, fontSize: 14 }}>Restano solo i pagamenti già registrati, senza email, per i conti dei ricavi.</p>
      </div>
      {store ? (
        <Callout title={`Ha un abbonamento ${store.name} attivo`}>Eliminare l’account non ferma il pagamento: l’utente deve disdirlo {where}.</Callout>
      ) : null}
      <Field id="delete-email" label="Per confermare scrivi l’email dell’utente" error={touched && typed && !match ? "L’email non corrisponde." : null}>
        <input id="delete-email" className="input" autoComplete="off" placeholder="Scrivi qui l’email" aria-describedby={touched && typed && !match ? "delete-email-msg" : undefined} aria-invalid={(touched && !!typed && !match) || undefined} value={typed} onChange={(e) => setTyped(e.target.value)} onBlur={() => setTouched(true)} />
      </Field>
    </FormDialog>
  );
}

/**
 * POST users/{id}/delete with the typed e-mail in the body: the shell's
 * api.del sends no body, and an e-mail in the URL would end up in the
 * server's access logs.
 */
async function deleteUser(api: ReturnType<typeof useConsole>["api"], id: number, email: string) {
  return api.post(`/users/${id}/delete`, { confirm_email: email });
}

// ---------------------------------------------------------------- Nuovo utente

export function NewUserDialog({ onDone, onCancel }: { onDone: (id: number) => void; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pwOk = password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

  const submit = async () => {
    if (!emailOk || !pwOk) return;
    setBusy(true);
    setFailed(false);
    setEmailErr(null);
    setPwErr(null);
    try {
      const res = await api.post<{ id: number }>("/users", { name: name.trim(), email: email.trim(), password });
      toast({ title: "Utente creato" });
      onDone(res.id);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : null;
      if (code === "email_taken") setEmailErr("Questa email è già usata da un altro account.");
      else if (fieldError(e, "email")) setEmailErr("Indica un’email valida.");
      else if (fieldError(e, "password")) setPwErr("La password non va bene: almeno 10 caratteri, con maiuscole, minuscole, numeri e simboli.");
      else setFailed(true);
      setBusy(false);
    }
  };

  return (
    <FormDialog
      title="Nuovo utente"
      sub="L’account entra nell’app con email e password. Il piano si regala dopo, dalla sua pagina."
      icon={<UIcon name="plus" />}
      busy={busy}
      onCancel={onCancel}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Creazione…" disabled={!emailOk || !pwOk} onClick={submit}>Crea utente</BusyButton>
        </>
      }
    >
      {failed ? <Callout alert title="Non è stato possibile salvare">Riprova. L’account non è stato creato.</Callout> : null}
      <Field id="new-name" label="Nome">
        <input id="new-name" className="input" maxLength={191} placeholder="Nome e cognome" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field id="new-email" label="Email" required error={emailErr}>
        <input id="new-email" className="input" type="email" maxLength={191} aria-describedby={emailErr ? "new-email-msg" : undefined} value={email} aria-invalid={!!emailErr || undefined} onChange={(e) => (setEmail(e.target.value), setEmailErr(null))} />
      </Field>
      <Field id="new-pw" label="Password temporanea" required error={pwErr} hint="Almeno 10 caratteri, con maiuscole, minuscole, numeri e simboli. Comunicala all’utente: potrà cambiarla dall’app.">
        <input id="new-pw" className="input" type="password" aria-describedby="new-pw-msg" autoComplete="new-password" value={password} onChange={(e) => (setPassword(e.target.value), setPwErr(null))} />
      </Field>
    </FormDialog>
  );
}

// ---------------------------------------------------------------- Esporta CSV (#234)

export function CsvDialog({ total, plans, q, gift = false, suspended = false, onCancel }: { total: number; plans: Plan[]; q: string; gift?: boolean; suspended?: boolean; onCancel: () => void }) {
  const { api, toast } = useConsole();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setBusy(true);
    setFailed(false);
    try {
      // MOB-1462: the file takes «Con omaggio» and «Stato: Sospesi» too.
      const blob = await api.blob("/users.csv", { plans: plans.join(","), q, ...(gift ? { gift: 1 } : {}), ...(suspended ? { suspended: 1 } : {}) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = csvName(plans);
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Later: revoking at once can cancel the download in Safari and Firefox.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast({ title: "File scaricato" });
      onCancel();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  const n = fmt(total);
  return (
    <FormDialog
      title="Esporta CSV"
      icon={<Icon name="download" size={18} />}
      busy={busy}
      onCancel={onCancel}
      width={480}
      actions={
        <>
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>Annulla</button>
          <BusyButton busy={busy} busyLabel="Preparo il file…" onClick={download}>
            <Icon name="download" size={17} /> Scarica CSV
          </BusyButton>
        </>
      }
    >
      {failed ? <Callout alert title="Export non riuscito">Riprova tra qualche minuto.</Callout> : null}
      <p style={{ color: "var(--text)", fontWeight: 500 }}>
        {total === 1
          ? plans.length
            ? `Il file contiene 1 utente con piano ${plansInWords(plans)}.`
            : "Il file contiene 1 utente."
          : plans.length
            ? `Il file contiene i ${n} utenti con piano ${plansInWords(plans)}.`
            : `Il file contiene i ${n} utenti dell’elenco.`}
      </p>
      <p style={{ fontSize: 14 }}>Colonne: Email, Nome, Piano, Scadenza piano, Data di registrazione.</p>
      <Callout kind="info" title="Dati personali">Tieni il file solo il tempo che serve. L’esportazione resta nel registro attività.</Callout>
    </FormDialog>
  );
}
