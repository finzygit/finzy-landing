"use client";

// MOB-1372 (boards ADM-SHELL-06-persone-*): who enters the console, with
// which role and whether the second step is active. Giving access works only
// for an account already registered in the app; nobody changes their own
// access; removing a super admin and resetting someone's 2FA ask for a word.

import { useCallback, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { ConfirmDialog, Drawer } from "@/components/shell/overlays";
import { Banner, PageHead, Section, Status } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";

type Person = { id: number; name: string; email: string; role: { id: number; name: string } | null; two_factor: "confirmed" | "missing"; last_access: string | null };
type RoleOpt = { id: number; name: string; locked: boolean };

// The backend sends ISO or «YYYY-MM-DD HH:MM:SS» in app time (Europe/Rome): read both the same way everywhere.
const when = (at: string | null) =>
  at ? new Date(at.includes("T") ? at : at.replace(" ", "T")).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Mai";

export default function PeoplePage() {
  const { api, me, can, toast } = useConsole();
  const canEdit = can("console.admin.update");
  const [people, setPeople] = useState<Person[] | null>(null);
  const [roles, setRoles] = useState<RoleOpt[]>([]);
  const [state, setState] = useState<TableState>("loading");
  const [open, setOpen] = useState<Person | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<"revoke" | "reset" | null>(null);
  const [busy, setBusy] = useState(false);
  const [give, setGive] = useState<{ email: string; roleId: number | null; error: string | null } | null>(null);

  // Sets state only after the answer (react-hooks/set-state-in-effect); reload() shows the skeleton first.
  const load = useCallback(
    () =>
      Promise.all([api.get<{ people: Person[] }>("/people"), api.get<{ roles: RoleOpt[] }>("/roles")]).then(
        ([p, r]) => {
          setPeople(p.people);
          setRoles(r.roles);
          setState("default");
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

  const self = open && me?.user.id === open.id;
  const act = async (fn: () => Promise<unknown>, title: string) => {
    setBusy(true);
    try {
      await fn();
      toast({ title, body: "La modifica è nel registro attività." });
      setConfirm(null);
      setOpen(null);
      reload();
    } catch (e) {
      const c = e instanceof ApiError ? e.code : null;
      toast({ title: c === "last_super_admin" ? "È l’unico super amministratore con la verifica attiva: non si può togliere." : "Non è stato possibile salvare. Riprova.", kind: "error" });
    }
    setBusy(false);
  };

  const submitGive = async () => {
    if (!give?.roleId) return;
    setBusy(true);
    try {
      await api.post("/people", { email: give.email, role_id: give.roleId });
      toast({ title: "Accesso dato", body: "Al primo accesso dovrà attivare la verifica in due passaggi." });
      setGive(null);
      reload();
    } catch (e) {
      const c = e instanceof ApiError ? e.code : null;
      setGive({
        ...give,
        error:
          c === "account_not_found"
            ? "Nessun account con questa email. La persona deve prima registrarsi nell’app con questa email."
            : c === "already_has_access"
              ? "Ha già accesso alla console. Per cambiare il ruolo, apri la persona dall’elenco."
              : "Non è stato possibile dare l’accesso. Riprova.",
      });
    }
    setBusy(false);
  };

  const pending = people?.filter((p) => p.two_factor === "missing").length ?? 0;
  const isSuper = !!roles.find((r) => r.id === open?.role?.id)?.locked;

  return (
    <AdminFrame title="Persone con accesso">
      <PageHead
        title="Persone con accesso"
        sub="Chi entra nella console, con quale ruolo, e se ha attivato la verifica in due passaggi."
        crumbs={["Amministrazione", "Persone con accesso"]}
        actions={canEdit ? <button type="button" className="btn btn-primary" onClick={() => setGive({ email: "", roleId: null, error: null })}>Dai accesso</button> : undefined}
      />
      {pending ? (
        <Banner>
          {pending === 1 ? "1 persona deve" : `${pending} persone devono`} ancora attivare la verifica in due passaggi: {pending === 1 ? "entrerà" : "entreranno"} solo dopo averla attivata.
        </Banner>
      ) : null}
      <Section pad="8px">
        <DataTable<Person>
          caption="Persone con accesso"
          state={state}
          rows={people ?? []}
          rowKey={(p) => p.id}
          selectedKey={open?.id ?? null}
          onRowClick={canEdit ? (p) => (setOpen(p), setRoleId(p.role?.id ?? null)) : undefined}
          onRetry={reload}
          errorText="Non è stato possibile caricare le persone"
          columns={[
            { key: "p", label: "Persona", render: (p) => (<span><strong>{p.name}</strong>{me?.user.id === p.id ? <span className="chip" data-kind="update" style={{ marginLeft: 8 }}>Tu</span> : null}<span className="sub">{p.email}</span></span>) },
            { key: "r", label: "Ruolo", render: (p) => p.role?.name ?? "—" },
            { key: "f", label: "Verifica in due passaggi", render: (p) => (p.two_factor === "confirmed" ? <Status kind="ok">Attiva</Status> : <Status kind="warn">Da attivare</Status>) },
            { key: "l", label: "Ultimo accesso", width: "150px", render: (p) => <span className={p.last_access ? undefined : "muted"}>{when(p.last_access)}</span> },
          ]}
        />
      </Section>

      {open ? (
        <Drawer
          title={open.name}
          sub={self ? "Tu" : open.role?.name}
          onClose={() => setOpen(null)}
          footer={
            self ? undefined : (
              <>
                <button type="button" className="btn" onClick={() => setOpen(null)}>Annulla</button>
                <button type="button" className="btn btn-primary" disabled={busy || !roleId || roleId === open.role?.id} onClick={() => act(() => api.put(`/people/${open.id}`, { role_id: roleId }), "Ruolo cambiato")}>
                  Salva
                </button>
              </>
            )
          }
        >
          <div className="kv"><span>Email</span><span>{open.email}</span></div>
          <div className="kv"><span>Ultimo accesso</span><span>{when(open.last_access)}</span></div>
          <div className="kv"><span>Verifica in due passaggi</span>{open.two_factor === "confirmed" ? <Status kind="ok">Attiva</Status> : <Status kind="warn">Da attivare</Status>}</div>
          <div className="field">
            <label htmlFor="person-role">Ruolo</label>
            <select id="person-role" className="input" disabled={!!self} value={roleId ?? ""} onChange={(e) => setRoleId(Number(e.target.value))}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          {self ? (
            <p className="note" style={{ fontSize: 14 }}>Sei tu: il ruolo e l’accesso li può cambiare solo un altro super amministratore.</p>
          ) : (
            <>
              <div className="card" style={{ padding: 16, borderRadius: 16 }}>
                <strong>Azzera la verifica in due passaggi</strong>
                <p className="note" style={{ fontSize: 14, margin: "6px 0 10px" }}>Se ha perso il telefono e i codici di recupero. Al prossimo accesso collegherà di nuovo l’app.</p>
                <button type="button" className="btn" disabled={open.two_factor !== "confirmed"} onClick={() => setConfirm("reset")}>Azzera la verifica in due passaggi</button>
                {open.two_factor !== "confirmed" ? <p className="note" style={{ marginTop: 8 }}>Non ha ancora attivato la verifica: non c’è niente da azzerare.</p> : null}
              </div>
              <div className="card" style={{ padding: 16, borderRadius: 16, borderColor: "rgba(255,69,58,0.18)" }}>
                <strong>Togli l’accesso</strong>
                <p className="note" style={{ fontSize: 14, margin: "6px 0 10px" }}>Non potrà più entrare nella console. Il suo account dell’app resta com’è.</p>
                <button type="button" className="btn btn-danger" onClick={() => setConfirm("revoke")}>Togli l’accesso</button>
              </div>
            </>
          )}
        </Drawer>
      ) : null}

      {open && confirm === "revoke" ? (
        <ConfirmDialog
          title={`Togliere l’accesso a ${open.name}?`}
          message="Non potrà più entrare nella console da questo momento. Il suo account dell’app, il piano e i dati restano com’erano."
          confirmLabel="Togli l’accesso"
          typed={isSuper ? "TOGLI" : undefined}
          busy={busy}
          onConfirm={() => act(() => api.del(`/people/${open.id}`), `Accesso tolto a ${open.name}`)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {open && confirm === "reset" ? (
        <ConfirmDialog
          title={`Azzerare la verifica di ${open.name}?`}
          message="Il collegamento con la sua app e i codici di recupero smettono di valere. Al prossimo accesso dovrà collegare di nuovo l’app."
          confirmLabel="Azzera la verifica"
          typed="AZZERA"
          busy={busy}
          onConfirm={() => act(() => api.del(`/people/${open.id}/two-factor`), "Verifica azzerata")}
          onCancel={() => setConfirm(null)}
        />
      ) : null}

      {give ? (
        <Drawer
          title="Dai accesso alla console"
          sub="Scegli un account Finzy già registrato e il suo ruolo."
          onClose={() => setGive(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setGive(null)}>Annulla</button>
              <button type="button" className="btn btn-primary" disabled={busy || !give.email || !give.roleId} onClick={submitGive}>{busy ? "…" : "Dai accesso"}</button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="give-email">Email dell’account</label>
            <input id="give-email" className="input" type="email" value={give.email} placeholder="nome@esempio.it" aria-invalid={!!give.error || undefined} onChange={(e) => setGive({ ...give, email: e.target.value, error: null })} />
            {give.error ? <p className="error-line" role="alert">{give.error}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="give-role">Ruolo</label>
            <select id="give-role" className="input" value={give.roleId ?? ""} onChange={(e) => setGive({ ...give, roleId: Number(e.target.value) || null })}>
              <option value="">Scegli un ruolo</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <p className="note" style={{ fontSize: 14 }}>Al primo accesso dovrà attivare la verifica in due passaggi.</p>
        </Drawer>
      ) : null}
    </AdminFrame>
  );
}
