"use client";

// MOB-1374 (boards ADM-U-05…ADM-U-11): one user, read first. The plan the app
// sees and where it comes from, the store box, the gift, «Storico dei piani»
// with who and why (#237), the account and the consents. The actions follow
// the role: «Regala piano» / «Revoca regalo» with console.users.plan,
// «Modifica» with console.users.update, «Elimina account» with
// console.users.delete. The id is in the query string (static export).
// MOB-1462 (boards ADM-UB-03…07): last access and generations in the fact
// strip, «Sospendi utente» / «Riattiva utente» with console.users.suspend, the
// red strip of a suspended account.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Icon } from "@/components/shell/Icon";
import { Banner, Section, StateBlock, Status } from "@/components/shell/parts";
import { DeleteDialog, EditDialog, GiftDialog, RevokeDialog } from "@/components/users/dialogs";
import { dmy, generationsLine, LANG_LONG, lastAccess, type HistoryRow, type UserPage } from "@/components/users/model";
import { CopyText, Fact, Kv, PlanPill, SuspendedPill, UIcon, UserAvatar } from "@/components/users/parts";
import { ReactivateDialog, SuspendDialog, SuspendedStrip } from "@/components/users/suspend";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";

type RoleOpt = { id: number; name: string; locked: boolean };
type Dialog = "gift" | "revoke" | "edit" | "delete" | "suspend" | "reactivate" | null;

export default function UserPageRoute() {
  return (
    <Suspense fallback={null}>
      <UserScreen />
    </Suspense>
  );
}

function UserScreen() {
  const id = Number(useSearchParams().get("id") ?? "");
  const { api, can, me } = useConsole();
  const router = useRouter();
  const [page, setPage] = useState<UserPage | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState(false);
  const [roles, setRoles] = useState<RoleOpt[] | null>(null);

  const badId = !Number.isInteger(id) || id <= 0;
  const [nonce, setNonce] = useState(0);
  // The answer is kept with the id it answers: a slow reply for another id never shows here.
  const [answer, setAnswer] = useState<{ key: string; state: "ready" | "missing" | "error" } | null>(null);
  const key = `${id}:${nonce}`;
  useEffect(() => {
    if (badId) return;
    let live = true;
    api.get<UserPage>(`/users/${id}`).then(
      (p) => {
        if (!live) return;
        setPage(p);
        setAnswer({ key, state: "ready" });
      },
      (e) => live && setAnswer({ key, state: e instanceof ApiError && e.status === 404 ? "missing" : "error" }),
    );
    return () => {
      live = false;
    };
  }, [api, id, badId, key]);
  const state = answer?.key === key ? answer.state : "loading";

  const isSuper = me?.role?.key === "super_admin";
  const openEdit = () => {
    setDialog("edit");
    if (isSuper && roles === null) api.get<{ roles: RoleOpt[] }>("/roles").then((r) => setRoles(r.roles), () => setRoles([]));
  };

  if (badId || state === "missing") {
    return (
      <AdminFrame title="Utente non trovato">
        <div className="crumbs" style={{ marginBottom: 12 }}><span>Utenti</span><span style={{ color: "var(--text-2)" }}>› Utente non trovato</span></div>
        <StateBlock kind="missing" title="Utente non trovato" body="Può essere stato eliminato. Cercalo di nuovo nella lista." action={<Link className="btn" href="/users">Torna agli utenti</Link>} />
      </AdminFrame>
    );
  }
  if (state === "error") {
    return (
      <AdminFrame title="Utenti">
        <StateBlock kind="error" title="Non è stato possibile caricare l’utente" action={<button type="button" className="btn" onClick={() => setNonce((n) => n + 1)}>Riprova</button>} />
      </AdminFrame>
    );
  }
  if (state === "loading" || !page) {
    return (
      <AdminFrame title="Utenti">
        <StateBlock kind="loading" />
      </AdminFrame>
    );
  }

  const u = page.user;
  const canPlan = can("console.users.plan");
  const canEdit = can("console.users.update") && (!u.staff || isSuper);
  const canDelete = can("console.users.delete") && !u.staff && me?.user.id !== u.id;
  const readOnly = !can("console.users.update") && !canPlan;
  // MOB-1462: «Sospendi utente» / «Riattiva utente»; never on a staff account or your own.
  const canSuspend = can("console.users.suspend");
  const suspended = Boolean(page.suspension);
  const suspendBlocked = u.staff ? "Ha accesso al pannello: prima togli l’accesso da Persone con accesso." : me?.user.id === u.id ? "Non puoi sospendere il tuo account." : null;

  return (
    <AdminFrame title={u.name ?? "Utenti"}>
      <SuspendedStrip page={page} canReactivate={canSuspend} onReactivate={() => setDialog("reactivate")} />
      {readOnly ? <Banner kind="info">Puoi solo vedere: per modificare serve «Utenti · Modifica», per regalare o revocare «Azioni sul piano».</Banner> : null}

      <header style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
        <div className="crumbs">
          <Link href="/users" style={{ color: "var(--text-3)", fontWeight: 550 }}>Utenti</Link>
          <span style={{ color: "var(--text-2)", overflowWrap: "anywhere" }}>› {u.name ?? u.email}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <UserAvatar name={u.name} email={u.email} size={64} url={u.avatar_url} />
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {u.name ? (
                  <h1 style={{ margin: 0, fontSize: 30, lineHeight: "38px", letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{u.name}</h1>
                ) : (
                  <h1 className="muted" style={{ margin: 0, fontSize: 30, fontWeight: 600, fontStyle: "italic" }}>Senza nome</h1>
                )}
                <PlanPill plan={page.plan.plan} />
                {suspended ? <SuspendedPill /> : null}
              </div>
              <CopyText text={u.email} />
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {canPlan ? (
              <>
                <button type="button" className="btn btn-primary" onClick={() => setDialog("gift")}><UIcon name="gift" size={17} /> Regala piano</button>
                {page.plan.revocable ? <button type="button" className="btn" onClick={() => setDialog("revoke")}><UIcon name="replay" size={17} /> Revoca regalo</button> : null}
              </>
            ) : null}
            {canEdit ? <button type="button" className="btn" onClick={openEdit}><Icon name="edit" size={17} /> Modifica</button> : null}
            <button type="button" className="icon-btn" style={{ width: 44, height: 44 }} aria-label="Altre azioni" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
              <Icon name="more" size={18} />
            </button>
            {menu ? (
              <div className="menu" role="menu" style={{ right: 0, top: 52 }}>
                <button type="button" role="menuitem" onClick={() => (navigator.clipboard?.writeText(window.location.href).catch(() => undefined), setMenu(false))}>
                  <Icon name="copy" size={16} /> Copia il link della pagina
                </button>
                {can("console.admin.view") ? (
                  <Link role="menuitem" href="/admin/audit-log" onClick={() => setMenu(false)}>
                    <Icon name="external" size={16} /> Apri nel registro attività
                  </Link>
                ) : null}
                {canSuspend && !suspended ? (
                  <button type="button" role="menuitem" disabled={Boolean(suspendBlocked)} title={suspendBlocked ?? undefined} style={suspendBlocked ? undefined : { color: "var(--down)" }} onClick={() => (setMenu(false), setDialog("suspend"))}>
                    <UIcon name="ban" size={16} /> Sospendi utente
                  </button>
                ) : null}
                {canSuspend && suspendBlocked && !suspended ? <p className="note" style={{ margin: 0, padding: "2px 14px 8px", maxWidth: 260 }}>{suspendBlocked}</p> : null}
                {canSuspend && suspended ? (
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), setDialog("reactivate"))}>
                    <UIcon name="replay" size={16} /> Riattiva utente
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, padding: "16px 20px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid var(--hair)" }}>
          <Fact label="Iscritto il">{dmy(u.created_at)}</Fact>
          <Fact label="Ultimo accesso" muted={!u.last_access_at}>{lastAccess(u.last_access_at)}</Fact>
          {u.generations_30d ? (
            <Fact label="Generazioni 30 gg">
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {u.generations_30d.total}
                <span className="sub" style={{ fontWeight: 400 }}>{generationsLine(u.generations_30d)}</span>
              </span>
            </Fact>
          ) : null}
          <Fact label="Lingua dell’app" muted={!u.lang}>{u.lang ? LANG_LONG[u.lang] ?? u.lang : "—"}</Fact>
          <Fact label="ID utente">{u.id}</Fact>
        </div>
      </header>

      <div className="user-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <PlanCard page={page} />
          <HistoryCard rows={page.history} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Section title="Account">
            <Kv rows={[["Onboarding completato", u.onboarding_completed_at ? dmy(u.onboarding_completed_at) : <span className="muted">Non ancora</span>]]} />
          </Section>
          <Section title="Consensi">
            <Kv
              rows={[
                ["Termini e condizioni", u.terms_accepted_at ? <Accepted at={u.terms_accepted_at} v={u.terms_version} word="Accettati" /> : <span className="muted">—</span>],
                ["Informativa privacy", u.privacy_accepted_at ? <Accepted at={u.privacy_accepted_at} v={u.privacy_version} word="Accettata" /> : <span className="muted">—</span>],
                ["Comunicazioni di marketing", u.marketing_accepted ? <Status kind="ok">Sì</Status> : <Status kind="off">No</Status>],
              ]}
            />
          </Section>
          {canDelete ? (
            <Section title="Elimina account">
              <p style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: "20px" }}>Cancella l’account e tutti i suoi dati, come «Elimina account» nell’app. Non si può annullare.</p>
              <div>
                <button type="button" className="btn btn-danger" onClick={() => setDialog("delete")}><UIcon name="trash" size={17} /> Elimina account</button>
              </div>
            </Section>
          ) : null}
        </div>
      </div>

      {dialog === "gift" ? <GiftDialog page={page} onCancel={() => setDialog(null)} onDone={(p) => (setPage(p), setDialog(null))} /> : null}
      {dialog === "revoke" ? <RevokeDialog page={page} onCancel={() => setDialog(null)} onDone={(p) => (setPage(p), setDialog(null))} /> : null}
      {dialog === "edit" ? <EditDialog page={page} roles={roles} isSuper={isSuper} isSelf={me?.user.id === u.id} onCancel={() => setDialog(null)} onPage={setPage} onDone={(p) => (setPage(p), setDialog(null))} /> : null}
      {dialog === "suspend" ? <SuspendDialog page={page} onCancel={() => setDialog(null)} onDone={(p) => (setPage(p), setDialog(null))} /> : null}
      {dialog === "reactivate" ? <ReactivateDialog page={page} onCancel={() => setDialog(null)} onDone={(p) => (setPage(p), setDialog(null))} /> : null}
      {dialog === "delete" ? <DeleteDialog page={page} onCancel={() => setDialog(null)} onDone={() => router.push("/users")} /> : null}
      <style>{`.user-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
@media (max-width: 1199px) { .user-grid { grid-template-columns: minmax(0, 1fr); } }`}</style>
    </AdminFrame>
  );
}

function Accepted({ at, v, word }: { at: string; v: string | null; word: string }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span>{word} il {dmy(at)}</span>
      {v ? <span className="sub">versione {v}</span> : null}
    </span>
  );
}

function PlanCard({ page }: { page: UserPage }) {
  const p = page.plan;
  return (
    <Section title="Piano">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PlanPill plan={p.plan} />
        {p.until ? <span style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>fino al {dmy(p.until)}</span> : null}
      </div>
      <Kv
        rows={[
          ["Da dove viene", p.source],
          [
            "Regalo",
            p.gift ? (
              <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <strong>{`${p.gift.plan === "unlimited" ? "Unlimited" : "Premium"} fino al ${dmy(p.gift.until)}`}</strong>
                <span className="sub">{`Da ${p.gift.by ?? "—"} · ${dmy(p.gift.at)}`}</span>
              </span>
            ) : (
              "Nessuno"
            ),
          ],
        ]}
      />
      <div style={{ padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)" }}>Abbonamento dello store</span>
        {p.store ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "14px 18px" }}>
            <Fact label="Store">{p.store.name}</Fact>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>Piano</span>
              <PlanPill plan={p.store.plan} small />
            </div>
            <Fact label="Rinnovo automatico">{p.store.auto_renew ? "Acceso" : "Spento"}</Fact>
            <Fact label={p.store.auto_renew ? "Prossimo rinnovo" : "Scade il"}>{dmy(p.store.date)}</Fact>
          </div>
        ) : (
          <span style={{ fontSize: 14, color: "var(--text-2)" }}>Nessun abbonamento App Store o Google Play.</span>
        )}
      </div>
    </Section>
  );
}

function period(r: HistoryRow): string {
  if (r.kind === "profile") return `Fino al ${dmy(r.to)}`;
  if (r.renews) return `Dal ${dmy(r.from)} · si rinnova il ${dmy(r.to)}`;
  return `Dal ${dmy(r.from)} al ${dmy(r.to)}`;
}

function stateOf(r: HistoryRow): string {
  if (r.kind === "profile") return "Messo a mano";
  if (r.kind === "store" && r.active && !r.renews) return "Attivo · non si rinnova";
  return r.state ?? "—";
}

function HistoryCard({ rows }: { rows: HistoryRow[] }) {
  return (
    <Section title="Storico dei piani">
      {rows.length === 0 ? (
        <StateBlock kind="empty" title="Ancora nessun piano" body="Qui compariranno i regali, le revoche e gli abbonamenti dello store." />
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {rows.map((r, i) => (
            <li key={r.id ?? `p${i}`} style={{ position: "relative", padding: "14px 0 14px 26px", borderBottom: i < rows.length - 1 ? "1px solid var(--hair)" : undefined }}>
              <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 22, width: 10, height: 10, borderRadius: "50%", background: r.active ? "var(--accent)" : "rgba(255,255,255,0.28)", boxShadow: r.active ? "0 0 0 4px rgba(39,204,216,0.14)" : undefined }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <PlanPill plan={r.plan} small />
                  <strong style={{ fontSize: 15 }}>{r.kind === "profile" ? "Messo a mano" : r.source}</strong>
                </span>
                <Status kind={r.active ? "ok" : "off"}>{stateOf(r)}</Status>
              </div>
              <div className="sub" style={{ marginTop: 4, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{period(r)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6, fontSize: 13 }}>
                {r.kind === "profile" ? <span className="muted">Messo dal pannello prima dello storico: chi l’ha dato non è registrato.</span> : null}
                {r.kind === "gift" && (r.given_by || r.taken_by) ? (
                  <span className="muted">
                    {[r.given_by ? `Dato da ${r.given_by} · ${dmy(r.given_at)}` : null, r.taken_by ? `Tolto da ${r.taken_by} · ${dmy(r.taken_at)}` : null].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                {r.reason ? (
                  <span><span className="muted" style={{ fontWeight: 600 }}>Motivo del regalo: </span><em style={{ color: "var(--text-2)" }}>«{r.reason}»</em></span>
                ) : null}
                {r.close_reason ? (
                  <span><span className="muted" style={{ fontWeight: 600 }}>Motivo della revoca: </span><em style={{ color: "var(--text-2)" }}>«{r.close_reason}»</em></span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
