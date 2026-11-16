"use client";

// MOB-1374 (boards ADM-U-01…ADM-U-04, ADM-U-12): the users of the app, 25 a
// page. Search on name or e-mail, «Piano» with several plans and Applica (Free
// also takes no plan, #234), sort, the count, «Esporta CSV» with
// console.users.export, «Nuovo utente» with console.users.update. Staff is not
// here (decision 4): it is in Amministrazione › Persone con accesso. On the
// phone: search, Piano and the rows only (decision 7).
// MOB-1462 (boards ADM-UB-01, 02, 08): the numbers above the list (GET
// users/summary, not changed by the filters), the «solo abbonati» donuts, the
// «Con omaggio» chip, «{n} sospesi» (a «Stato: Sospesi» filter), the columns
// Ultimo accesso, Termini/Privacy accettata (1440 and up) and Generazioni 30
// gg, the «Sospeso» pill, and «Definizioni» under the table.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { PageHead, Pager, Section, StateBlock } from "@/components/shell/parts";
import { CsvDialog, NewUserDialog } from "@/components/users/dialogs";
import { countLine, dmy, fmt, generationsLine, lastAccess, PLAN_LABEL, PLANS, SORTS, type Plan, type UserList, type UserRow, type UsersSummary } from "@/components/users/model";
import { PlanPill, SuspendedPill, UIcon, UserCell } from "@/components/users/parts";
import { Definitions, PayingPies, SummaryTiles } from "@/components/users/summary";
import { useConsole } from "@/lib/console";

export default function UsersPage() {
  const { api, can } = useConsole();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [draft, setDraft] = useState<Plan[] | null>(null);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);
  // The answer is kept with the request it answers: loading is «no answer for these filters yet»,
  // so a stale or repeated request never leaves the table stuck or showing the wrong rows.
  const [stored, setStored] = useState<{ key: string; data: UserList | null } | null>(null);
  const [last, setLast] = useState<UserList | null>(null);
  const [dialog, setDialog] = useState<"csv" | "new" | null>(null);
  // MOB-1462: «Con omaggio», «Stato: Sospesi», and the numbers above the list.
  const [gift, setGift] = useState(false);
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const [summary, setSummary] = useState<UsersSummary | null>(null);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // The search waits for a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const planKey = plans.join(",");
  const key = JSON.stringify({ query, planKey, sort, page, nonce, gift, suspendedOnly });
  useEffect(() => {
    let live = true;
    api.get<UserList>("/users", { q: query, plans: planKey, sort, page, ...(gift ? { gift: 1 } : {}), ...(suspendedOnly ? { suspended: 1 } : {}) }).then(
      (d) => {
        if (!live) return;
        setStored({ key, data: d });
        setLast(d);
      },
      () => live && setStored({ key, data: null }),
    );
    return () => {
      live = false;
    };
  }, [api, key, query, planKey, sort, page, gift, suspendedOnly]);

  useEffect(() => {
    let live = true;
    api.get<UsersSummary>("/users/summary").then(
      // An answer without the numbers counts as a failure (the tiles say «Non disponibile»).
      (d) => live && (d && typeof d === "object" && "paying" in d ? (setSummary(d), setSummaryFailed(false)) : setSummaryFailed(true)),
      () => live && setSummaryFailed(true),
    );
    return () => {
      live = false;
    };
  }, [api, nonce]);

  const data = stored?.key === key ? stored.data : null;
  const state: TableState = stored?.key !== key ? "loading" : !data ? "error" : data.users.length ? "default" : data.narrowed ? "filtered" : "empty";

  // The popovers close on Escape and on a click outside them.
  useEffect(() => {
    if (draft === null && !sortOpen) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && (setDraft(null), setSortOpen(false));
    const click = (e: MouseEvent) => !filtersRef.current?.contains(e.target as Node) && (setDraft(null), setSortOpen(false));
    window.addEventListener("keydown", key);
    window.addEventListener("mousedown", click);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("mousedown", click);
    };
  }, [draft, sortOpen]);

  const reload = () => setNonce((n) => n + 1);
  const reset = () => {
    setQ("");
    setQuery("");
    setPlans([]);
    setGift(false);
    setSuspendedOnly(false);
    setPage(1);
  };
  const applyPlans = () => {
    const next = PLANS.filter((p) => (draft ?? []).includes(p));
    setDraft(null);
    if (next.join(",") === planKey) return;
    setPlans(next);
    setPage(1);
  };

  const canExport = can("console.users.export");
  const canNew = can("console.users.update");
  const planValue = plans.length ? plans.map((p) => PLAN_LABEL[p]).join(", ") : null;

  return (
    <AdminFrame title="Utenti">
      <PageHead
        title="Utenti"
        sub="Chi usa l’app. Lo staff è in Amministrazione › Persone con accesso."
        actions={
          canNew ? (
            <button type="button" className="btn users-desktop" onClick={() => setDialog("new")}>
              <UIcon name="plus" size={17} /> Nuovo utente
            </button>
          ) : undefined
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        <SummaryTiles data={summary} failed={summaryFailed} onShowGifts={() => (setGift(true), setPage(1))} />
        <div className="users-desktop">
          <PayingPies data={summary} />
        </div>
      </div>

      <div ref={filtersRef} style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 16, top: 16, color: "var(--text-3)" }}>
            <Icon name="search" size={18} />
          </span>
          <input className="input" type="search" aria-label="Cerca per nome o email" placeholder="Cerca per nome o email" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 44, height: 44 }} />
        </div>

        <div style={{ position: "relative" }}>
          <button type="button" className="btn" aria-haspopup="dialog" aria-controls="users-plan-filter" aria-expanded={draft !== null} onClick={() => (setSortOpen(false), setDraft(draft === null ? plans : null))}>
            Piano{planValue ? <span style={{ color: "var(--accent)" }}>: {planValue}</span> : null}
            <Icon name="down" size={16} />
          </button>
          {draft !== null ? (
            <div id="users-plan-filter" className="menu" role="group" aria-label="Piano" style={{ left: 0, top: 50, padding: "8px 0" }}>
              {PLANS.map((p) => (
                <label key={p} style={{ display: "flex", alignItems: "center", gap: 10, height: 44, padding: "0 14px", cursor: "pointer", fontSize: 15 }}>
                  <input type="checkbox" checked={draft.includes(p)} onChange={(e) => setDraft(e.target.checked ? [...draft, p] : draft.filter((x) => x !== p))} />
                  <span style={{ flex: 1 }}>{PLAN_LABEL[p]}</span>
                  <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>{last ? fmt(last.plan_counts[p] ?? 0) : ""}</span>
                </label>
              ))}
              <p className="note" style={{ padding: "4px 14px 8px" }}>Free comprende anche chi non ha un piano registrato.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "4px 12px 4px" }}>
                <button type="button" className="btn" style={{ height: 36 }} onClick={() => setDraft([])}>Togli</button>
                <button type="button" className="btn btn-primary" style={{ height: 36 }} onClick={applyPlans}>Applica</button>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ position: "relative" }} className="users-desktop">
          <button type="button" className="btn" aria-haspopup="menu" aria-expanded={sortOpen} onClick={() => (setDraft(null), setSortOpen(!sortOpen))}>
            Ordina: <span style={{ color: "var(--text-2)" }}>{SORTS.find((s) => s.key === sort)?.label}</span>
            <Icon name="down" size={16} />
          </button>
          {sortOpen ? (
            <div className="menu" role="menu" style={{ left: 0, top: 50 }}>
              {SORTS.map((s) => (
                <button key={s.key} type="button" role="menuitemradio" aria-checked={sort === s.key} onClick={() => {
                    setSortOpen(false);
                    if (s.key === sort) return;
                    setSort(s.key);
                    setPage(1);
                  }}>
                  <span style={{ flex: 1, textAlign: "left" }}>{s.label}</span>
                  {sort === s.key ? <Icon name="check" size={16} /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button type="button" className="btn" aria-pressed={gift} style={gift ? { color: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" } : undefined} onClick={() => (setGift(!gift), setPage(1))}>
          <UIcon name="gift" size={16} /> Con omaggio
        </button>

        {suspendedOnly ? (
          <button type="button" className="btn" style={{ color: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }} aria-label="Togli il filtro Stato: Sospesi" onClick={() => (setSuspendedOnly(false), setPage(1))}>
            Stato: Sospesi <Icon name="close" size={14} />
          </button>
        ) : null}

        {query || plans.length || gift || suspendedOnly ? (
          <button type="button" className="link-btn" onClick={reset}>Reimposta i filtri</button>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", minHeight: 36 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }} aria-live="polite">
            {data && state !== "filtered" ? countLine(data.total, data.narrowed) : state === "filtered" ? countLine(0, true) : ""}
          </p>
          {summary && summary.suspended > 0 && !suspendedOnly ? (
            <button type="button" className="link-btn" style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => (setSuspendedOnly(true), setPage(1))}>
              <UIcon name="ban" size={14} /> {summary.suspended === 1 ? "1 sospeso" : `${fmt(summary.suspended)} sospesi`}
            </button>
          ) : null}
          {canExport ? (
            <button type="button" className="btn users-desktop" style={{ marginLeft: "auto" }} disabled={state !== "default"} onClick={() => setDialog("csv")}>
              <Icon name="download" size={17} /> Esporta CSV
            </button>
          ) : null}
        </div>
        <div className="users-table">
        <Section pad="8px">
          <DataTable<UserRow>
            caption="Utenti"
            state={state}
            rows={data?.users ?? []}
            rowKey={(u) => u.id}
            loadingRows={8}
            onRowClick={(u) => router.push(`/users/detail?id=${u.id}`)}
            onRetry={reload}
            onClearFilters={reset}
            errorText="Non è stato possibile caricare gli utenti"
            empty={<StateBlock kind="empty" title="Nessun utente" body="Gli utenti compariranno qui quando si iscrivono all’app." />}
            columns={[
              { key: "u", label: "Utente", render: (u) => <UserCell name={u.name} email={u.email} /> },
              {
                key: "p",
                label: "Piano",
                width: "180px",
                render: (u) => (
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                    <PlanPill plan={u.plan} small />
                    {u.plan_until ? <span className="sub" style={{ fontVariantNumeric: "tabular-nums" }}>fino al {dmy(u.plan_until)}</span> : null}
                    {u.suspended_at ? <SuspendedPill small /> : null}
                  </span>
                ),
              },
              { key: "s", label: "Iscritto il", width: "110px", render: (u) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{dmy(u.created_at)}</span> },
              { key: "a", label: "Ultimo accesso", width: "120px", render: (u) => <span className={u.last_access_at ? undefined : "muted"} style={{ fontVariantNumeric: "tabular-nums" }}>{lastAccess(u.last_access_at)}</span> },
              { key: "t", label: "Termini accettati", width: "110px", render: (u) => <span className={u.terms_accepted_at ? undefined : "muted"} style={{ fontVariantNumeric: "tabular-nums" }}>{dmy(u.terms_accepted_at)}</span> },
              { key: "v", label: "Privacy accettata", width: "110px", render: (u) => <span className={u.privacy_accepted_at ? undefined : "muted"} style={{ fontVariantNumeric: "tabular-nums" }}>{dmy(u.privacy_accepted_at)}</span> },
              {
                key: "g",
                label: "Generazioni 30 gg",
                width: "110px",
                align: "right",
                render: (u) => {
                  const g = u.generations_30d;
                  if (!g) return <span className="muted">—</span>;
                  return (
                    <span title={g.total ? generationsLine(g) : undefined} aria-label={g.total ? `${g.total} generazioni negli ultimi 30 giorni: ${generationsLine(g)}` : undefined} className={g.total ? undefined : "muted"} style={{ fontWeight: g.total ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>
                      {g.total}
                    </span>
                  );
                },
              },
              { key: "c", label: "", width: "32px", align: "right", render: () => <span className="muted" aria-hidden="true"><Icon name="chevron" size={16} /></span> },
            ]}
          />
        </Section>
        </div>
        {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} label="utenti" onPage={(p) => setPage(p)} /> : null}
        <div className="users-desktop" style={{ marginTop: 14 }}>
          <Definitions />
        </div>
      </div>

      {dialog === "csv" && data ? <CsvDialog total={data.total} plans={plans} q={query} onCancel={() => setDialog(null)} /> : null}
      {dialog === "new" ? <NewUserDialog onCancel={() => setDialog(null)} onDone={(id) => router.push(`/users/detail?id=${id}`)} /> : null}
      <style>{`.users-table table { table-layout: fixed; }
.users-table td:first-child { overflow: hidden; }
/* MOB-1462: Termini and Privacy only from 1440 up (design default); the rest of the dates from 768. */
@media (max-width: 1439px) {
  .users-table th:nth-child(5), .users-table td:nth-child(5), .users-table th:nth-child(6), .users-table td:nth-child(6) { display: none; }
}
@media (max-width: 1023px) {
  .users-table th:nth-child(3), .users-table td:nth-child(3), .users-table th:nth-child(7), .users-table td:nth-child(7) { display: none; }
}
@media (max-width: 599px) {
  .users-desktop { display: none !important; }
  /* Phone (decision 7): the user and the plan; the dates stay on the computer. */
  .users-table th:nth-child(3), .users-table td:nth-child(3), .users-table th:nth-child(4), .users-table td:nth-child(4) { display: none; }
  .users-table th:nth-child(7), .users-table td:nth-child(7) { display: none; }
  .users-table th, .users-table td { padding-left: 8px; padding-right: 8px; }
  .users-table th:nth-child(2), .users-table td:nth-child(2) { width: 118px; }
}`}</style>
    </AdminFrame>
  );
}
