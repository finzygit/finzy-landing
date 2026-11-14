"use client";

// MOB-1372 (boards ADM-SHELL-05-ruoli-*): roles in plain words. A table of
// areas × roles (Modifica / Vede / Nessun accesso / Tutto), the super admin
// locked; a role opens on the right, area by area, with the extra actions.
// Only a super admin changes roles (console.admin.update); Amministrazione can
// be at most «Vede» for a role made here.

import { useCallback, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { ConfirmDialog, Drawer } from "@/components/shell/overlays";
import { Banner, Level, LevelPicker, PageHead, Section, StateBlock, type LevelKind } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { AREA_LABEL, EXTRA_LABEL } from "@/lib/labels";
import { useRouter } from "next/navigation";

type Grants = Record<string, LevelKind>;
type Role = { id: number; key: string; name: string; description: string | null; locked: boolean; people: number; grants: Grants; extras: string[] };
type Area = { area: string; edit: boolean; extras: string[] };

const extraLabel = (perm: string) => EXTRA_LABEL[perm.split(".")[2]] ?? perm;

type Draft = { id?: number; name: string; description: string; grants: Record<string, "none" | "view" | "edit">; extras: string[] };

export default function RolesPage() {
  const { api, can, toast } = useConsole();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const canEdit = can("console.admin.update");
  const router = useRouter();

  const load = useCallback(
    () =>
      Promise.all([api.get<{ roles: Role[] }>("/roles"), api.get<{ areas: Area[] }>("/permissions")]).then(
        ([r, p]) => {
          setRoles(r.roles);
          setAreas(p.areas);
        },
        () => setFailed(true),
      ),
    [api],
  );
  useEffect(() => {
    load();
  }, [load]);

  const open = (r?: Role) =>
    setDraft({
      id: r?.id,
      name: r?.name ?? "",
      description: r?.description ?? "",
      grants: Object.fromEntries(areas.map((a) => [a.area, (r?.grants[a.area] as "none" | "view" | "edit") ?? "none"])),
      extras: r?.extras ?? [],
    });

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setSaveError("Scrivi un nome per il ruolo.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const body = { name: draft.name.trim(), description: draft.description, grants: draft.grants, extras: draft.extras.filter((x) => draft.grants[x.split(".")[1]] !== "none") };
    try {
      if (draft.id) await api.put(`/roles/${draft.id}`, body);
      else await api.post("/roles", body);
      toast({ title: `Ruolo ${body.name} salvato`, body: "La modifica è nel registro attività." });
      setDraft(null);
      load();
    } catch (e) {
      setSaveError(e instanceof ApiError && e.code === "name_taken" ? "C’è già un ruolo con questo nome." : "Non è stato possibile salvare. Riprova.");
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api.del(`/roles/${deleting.id}`);
      toast({ title: `Ruolo ${deleting.name} eliminato` });
      setDeleting(null);
      setDraft(null);
      load();
    } catch {
      toast({ title: "Non è stato possibile eliminare il ruolo", kind: "error" });
    }
  };

  const columns = `minmax(150px, 1fr) ${roles?.map(() => "minmax(0, 1fr)").join(" ") ?? ""}`;

  return (
    <AdminFrame title="Ruoli e permessi" banner={!canEdit ? <Banner kind="info">Il tuo ruolo può solo vedere questa pagina.</Banner> : undefined}>
      <PageHead
        title="Ruoli e permessi"
        sub="Cosa può vedere e cambiare ogni ruolo, area per area."
        crumbs={["Amministrazione", "Ruoli e permessi"]}
        actions={canEdit ? <button type="button" className="btn btn-primary" onClick={() => open()} disabled={!areas.length}>Nuovo ruolo</button> : undefined}
      />
      {failed ? (
        <StateBlock kind="error" title="Non è stato possibile caricare i ruoli" action={<button type="button" className="btn" onClick={() => (setFailed(false), setRoles(null), load())}>Riprova</button>} />
      ) : !roles ? (
        <StateBlock kind="loading" />
      ) : (
        <Section pad="22px 8px 10px">
          <div role="table" aria-label="Ruoli e permessi" style={{ overflowX: "auto" }}>
            <div role="row" style={{ display: "grid", gridTemplateColumns: columns, gap: 16, padding: "0 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <span role="columnheader" className="sr-only">Area</span>
              {roles.map((r) => (
                <div role="columnheader" key={r.id}>
                  <strong style={{ display: "block", fontSize: 16 }}>{r.name}</strong>
                  <span className="sub">
                    {r.people} {r.people === 1 ? "persona" : "persone"}
                    {r.locked ? " · non modificabile" : ""}
                  </span>
                  {!r.locked && canEdit ? (
                    <button type="button" className="link-btn" onClick={() => open(r)}>
                      Cambia
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {areas.map((a) => (
              <div role="row" key={a.area} style={{ display: "grid", gridTemplateColumns: columns, gap: 16, alignItems: "center", minHeight: 48, padding: "6px 16px", borderBottom: "1px solid var(--hair)" }}>
                <strong role="rowheader" style={{ fontSize: 15 }}>{AREA_LABEL[a.area] ?? a.area}</strong>
                {roles.map((r) => (
                  <span role="cell" key={r.id}>
                    <Level level={r.grants[a.area] ?? "none"} extras={r.locked ? [] : r.extras.filter((x) => x.split(".")[1] === a.area).map(extraLabel)} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}
      <p className="note" style={{ marginTop: 24, fontSize: 14 }}>Il super amministratore vede e cambia tutto: non si può modificare né eliminare.</p>
      <p className="note" style={{ fontSize: 14 }}>Vede: apre le pagine e legge. Modifica: anche salva e crea. Esportare, agire sul piano ed eliminare un account si accendono a parte.</p>

      {draft ? (
        <Drawer
          title={draft.id ? `Ruolo · ${draft.name}` : "Nuovo ruolo"}
          sub={draft.id ? undefined : "Parte senza accesso a nessuna area."}
          onClose={() => setDraft(null)}
          footer={
            <>
              {saveError ? <p className="error-line" role="alert" style={{ flex: 1 }}>{saveError}</p> : null}
              {draft.id && !saveError ? (
                <button type="button" className="btn btn-danger" style={{ marginRight: "auto" }} onClick={() => setDeleting(roles?.find((r) => r.id === draft.id) ?? null)}>
                  Elimina ruolo
                </button>
              ) : null}
              <button type="button" className="btn" onClick={() => setDraft(null)}>Annulla</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "…" : "Salva"}</button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="role-name">Nome del ruolo</label>
            <input id="role-name" className="input" value={draft.name} placeholder="Per esempio: Marketing" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="role-desc">A cosa serve</label>
            <input id="role-desc" className="input" value={draft.description} placeholder="Una frase per chi assegna il ruolo" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div>
            <strong style={{ fontSize: 14, color: "var(--text-2)" }}>Accesso per area</strong>
            {areas.map((a) => {
              const level = draft.grants[a.area] ?? "none";
              return (
                <div key={a.area} style={{ padding: "12px 0", borderBottom: "1px solid var(--hair)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <strong style={{ fontSize: 15 }}>{AREA_LABEL[a.area] ?? a.area}</strong>
                    <LevelPicker label={AREA_LABEL[a.area] ?? a.area} value={level} canEdit={a.edit && a.area !== "admin"} onChange={(v) => setDraft({ ...draft, grants: { ...draft.grants, [a.area]: v } })} />
                  </div>
                  {a.area === "admin" ? <p className="note">Ruoli e accessi li cambia solo un super amministratore.</p> : null}
                  {level !== "none"
                    ? a.extras.map((x) => {
                        const perm = `console.${a.area}.${x}`;
                        const on = draft.extras.includes(perm);
                        return (
                          <label key={x} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "var(--text-2)" }}>
                            {EXTRA_LABEL[x] ?? x}
                            <input type="checkbox" role="switch" checked={on} onChange={() => setDraft({ ...draft, extras: on ? draft.extras.filter((p) => p !== perm) : [...draft.extras, perm] })} />
                          </label>
                        );
                      })
                    : null}
                </div>
              );
            })}
          </div>
        </Drawer>
      ) : null}

      {deleting ? (
        deleting.people > 0 ? (
          <ConfirmDialog
            title="Il ruolo ha ancora delle persone"
            message={`${deleting.people} ${deleting.people === 1 ? "persona ha" : "persone hanno"} il ruolo ${deleting.name}. Dai prima un altro ruolo o togli l’accesso, poi elimina il ruolo.`}
            confirmLabel="Vai alle persone"
            kind="primary"
            cancelLabel="Chiudi"
            onConfirm={() => router.push("/amministrazione/persone")}
            onCancel={() => setDeleting(null)}
          />
        ) : (
          <ConfirmDialog
            title={`Eliminare il ruolo ${deleting.name}?`}
            message="Nessuna persona ha questo ruolo. L’eliminazione resta nel registro attività."
            confirmLabel="Elimina ruolo"
            onConfirm={remove}
            onCancel={() => setDeleting(null)}
          />
        )
      ) : null}
    </AdminFrame>
  );
}
