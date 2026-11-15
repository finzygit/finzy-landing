"use client";

// MOB-1375 (boards ADM-REV-03-promozioni-*, 04-azioni-*): the promotions
// list. State chips with counts, one row per promotion (name and code,
// period in Rome time, recipients, formulas, state), a «…» menu whose items
// follow the state: a running one is ended («Termina ora», decision 5), only
// a scheduled one is deleted (decision 6), a finished one is opened and
// duplicated. A role without «Modifica» only opens.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog } from "@/components/shell/overlays";
import { Banner, PageHead, Section, StateBlock } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { dayMonth, dayTime, daysUntil, romeParts } from "./format";
import s from "./revenue.module.css";
import { fill, T } from "./texts";
import type { PromoList, PromoRow, PromoState } from "./types";

const COUNTRY_LABEL: Record<string, string> = { IT: T.it, GB: T.uk };
const STATE_LABEL: Record<string, string> = { trial: T.trial, free: T.free, premium: T.premium };
const FORMULA_LABEL: Record<string, string> = { quarterly: fill(T.months_n, { n: 3 }), annual: fill(T.months_n, { n: 12 }) };
const STATE_WORD: Record<PromoState, string> = { active: T.s_active, scheduled: T.s_sched, ended: T.s_ended };
const FILTERS: ["" | PromoState, string][] = [["", T.f_all], ["active", T.f_active], ["scheduled", T.f_sched], ["ended", T.f_ended]];

type Pending = { kind: "end" | "delete"; row: PromoRow; busy: boolean; error: string | null };

export function PromotionsList() {
  const { api, can, toast } = useConsole();
  const router = useRouter();
  const [res, setRes] = useState<{ key: number; data?: PromoList; error?: boolean } | null>(null);
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<"" | PromoState>("");
  const [menu, setMenu] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    let live = true;
    api.get<PromoList>("/promotions").then(
      (d) => live && setRes({ key: reload, data: d }),
      () => live && setRes({ key: reload, error: true }),
    );
    return () => {
      live = false;
    };
  }, [api, reload]);

  const data = res?.data ?? null;
  const loading = res?.key !== reload && !data;
  const canUpdate = !!data?.can_update && can("console.promotions.update");
  const rows = (data?.rows ?? []).filter((r) => !filter || r.state === filter);
  const state: TableState = loading || !res ? "loading" : res.error && !data ? "error" : (data?.counts.all ?? 0) === 0 ? "empty" : rows.length === 0 ? "filtered" : "default";

  const open = (r: PromoRow) => router.push(`/promotions?id=${r.id}`);
  const run = async () => {
    if (!pending) return;
    setPending({ ...pending, busy: true, error: null });
    try {
      if (pending.kind === "end") await api.post(`/promotions/${pending.row.id}/end`);
      else await api.del(`/promotions/${pending.row.id}`);
      toast(
        pending.kind === "end"
          ? { title: T.stop_done, body: fill(T.stop_done_sub, { n: pending.row.name }) }
          : { title: T.del_done, body: fill(T.del_done_sub, { n: pending.row.name }) },
      );
      setPending(null);
      setReload((n) => n + 1);
    } catch (e) {
      // 409: the state changed meanwhile (it started, or ended); the list reloads with the truth.
      if (e instanceof ApiError && e.status === 409) {
        setPending(null);
        setReload((n) => n + 1);
        return;
      }
      setPending({ ...pending, busy: false, error: pending.kind === "end" ? T.stop_err : T.del_err });
    }
  };

  return (
    <>
      <PageHead
        title={T.promo_title}
        sub={T.promo_sub}
        crumbs={[T.group, T.promo_title]}
        actions={
          canUpdate ? (
            <button type="button" className="btn btn-primary" onClick={() => router.push("/promotions?new=1")}>
              + {T.new_promo}
            </button>
          ) : null
        }
      />
      <div className={s.note}>
        <span>
          <Icon name="info" size={15} /> {T.promo_rule}
        </span>
      </div>
      {data && !canUpdate ? (
        <div style={{ marginBottom: 16 }}>
          <Banner kind="info">{T.read_only}</Banner>
        </div>
      ) : null}
      <Section pad="20px 24px">
        {data && data.counts.all > 0 ? (
          <div className={s.toolbar}>
            {FILTERS.map(([k, label]) => (
              <button key={k} type="button" className={s.pill} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {label} <em>{k ? data.counts[k] : data.counts.all}</em>
              </button>
            ))}
          </div>
        ) : null}
        <DataTable<PromoRow>
          caption={T.promo_title}
          state={state}
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={open}
          onRetry={() => setReload((n) => n + 1)}
          errorText={T.promo_err}
          onClearFilters={() => setFilter("")}
          empty={
            <StateBlock
              kind="empty"
              title={T.promo_empty_t}
              body={T.promo_empty_b}
              action={canUpdate ? <button type="button" className="btn btn-primary" onClick={() => router.push("/promotions?new=1")}>+ {T.new_promo}</button> : undefined}
            />
          }
          columns={[
            { key: "name", label: T.p_name, render: (r) => (<span><strong>{r.name}</strong><br /><span className={s.code}>{r.code}</span></span>) },
            { key: "period", label: T.p_period, render: (r) => (<span>{dayTime(r.starts_at)} → {dayTime(r.ends_at)}<span className={s.sub2}>{romeParts(r.ends_at).y}</span></span>) },
            {
              key: "who",
              label: T.p_who,
              render: (r) => (<span>{r.countries.map((c) => COUNTRY_LABEL[c] ?? c).join(", ")}<span className={s.sub2}>{r.statuses.map((x) => STATE_LABEL[x] ?? x).join(", ")}</span></span>),
            },
            { key: "formulas", label: T.p_formulas, render: (r) => r.formulas_on.map((f) => FORMULA_LABEL[f]).join(" · ") },
            {
              key: "state",
              label: T.p_state,
              render: (r) => (
                <span>
                  <span className={s.state} data-state={r.state}>{STATE_WORD[r.state]}</span>
                  <span className={s.sub2}>
                    {r.state === "active" ? fill(T.ends_in, { n: daysUntil(r.ends_at) }) : r.state === "scheduled" ? fill(T.starts_on, { d: dayMonth(r.starts_at) }) : fill(T.ended_on, { d: dayMonth(r.ends_at) })}
                  </span>
                </span>
              ),
            },
            {
              key: "menu",
              label: "",
              width: "56px",
              align: "right",
              render: (r) => (
                <RowMenu
                  open={menu === r.id}
                  onToggle={(o) => setMenu(o ? r.id : null)}
                  items={[
                    ...(canUpdate && r.state !== "ended" ? [{ label: T.m_edit, icon: "edit", run: () => open(r) }] : [{ label: T.m_open, icon: "eye", run: () => open(r) }]),
                    ...(canUpdate ? [{ label: T.m_dup, icon: "copy", run: () => router.push(`/promotions?duplicate=${r.id}`) }] : []),
                    ...(canUpdate && r.state === "active" ? [{ label: T.m_stop, icon: "close", danger: true, run: () => setPending({ kind: "end", row: r, busy: false, error: null }) }] : []),
                    ...(canUpdate && r.state === "scheduled" ? [{ label: T.m_delete, icon: "close", danger: true, run: () => setPending({ kind: "delete", row: r, busy: false, error: null }) }] : []),
                  ]}
                />
              ),
            },
          ]}
        />
      </Section>
      {pending ? (
        <ConfirmDialog
          title={fill(pending.kind === "end" ? T.stop_t : T.del_t, { n: pending.row.name })}
          message={pending.kind === "end" ? T.stop_b : T.del_b}
          confirmLabel={pending.kind === "end" ? T.m_stop : T.m_delete}
          busy={pending.busy}
          error={pending.error}
          onConfirm={run}
          onCancel={() => !pending.busy && setPending(null)}
        />
      ) : null}
    </>
  );
}

type Item = { label: string; icon: string; danger?: boolean; run: () => void };

function RowMenu({ open, onToggle, items }: { open: boolean; onToggle: (open: boolean) => void; items: Item[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onToggle(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onToggle(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open, onToggle]);
  return (
    <span ref={ref} className={s.moreWrap} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button type="button" className="icon-btn" aria-label={T.a_actions} aria-haspopup="menu" aria-expanded={open} onClick={() => onToggle(!open)}>
        <Icon name="more" size={18} />
      </button>
      {open ? (
        <span className="menu" role="menu" style={{ right: 0, top: 44 }}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              style={it.danger ? { color: "var(--down)", borderTop: "1px solid var(--hair)" } : undefined}
              onClick={() => {
                onToggle(false);
                it.run();
              }}
            >
              <Icon name={it.icon} size={18} /> {it.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
