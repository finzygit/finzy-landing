"use client";

// MOB-1198 (FZW-WEB-07): income statement, balance sheet and cash flow,
// annual and quarterly, in thousands / millions / billions of the statement's
// currency, every period Twelve Data returned. The same lines for a US and a
// European stock (the backend's schema); a line the company lacks is a dash.
import { useMemo, useState } from "react";
import { useApp, useLoad } from "@/lib/app";
import { formatPeriodLabel, formatStatementValue, type StatementUnit } from "@/lib/format";
import { statementLine } from "@/lib/labels";
import type { Financials, PeriodKind, StatementKind, StockHeader } from "@/lib/types";
import { FinTable, type FinRow } from "../FinTable";
import { Card, ErrorState, InfoLine, Segmented, Skeleton } from "../ui";
import { StockFoot } from "../StockFoot";
import { useIsPhone } from "../StockHeader";

export function FinanceTab({ stock }: { stock: StockHeader }) {
  const { api, t, lang } = useApp();
  const phone = useIsPhone();
  const [statement, setStatement] = useState<StatementKind>("income");
  const [period, setPeriod] = useState<PeriodKind>("annual");
  const [unit, setUnit] = useState<StatementUnit>("millions");
  const load = useLoad(`fin:${stock.symbol}:${statement}:${period}`, () =>
    api.get<Financials>(`/dashboard/stocks/${encodeURIComponent(stock.symbol)}/financials`, { statement, period }),
  );

  const table = useMemo(() => {
    if (load.status !== "ready" || !load.data) return null;
    const f = load.data;
    const periods = f.periods ?? [];
    if (periods.length === 0) return null;
    const columns = periods.map((p) => formatPeriodLabel({ year: p.year, quarter: period === "quarterly" ? p.quarter : null }, lang));
    const rows: FinRow[] = (f.lines ?? []).map((key) => {
      const line = statementLine(key, lang);
      return {
        key,
        label: line.label,
        kind: line.kind,
        cells: periods.map((p) => formatStatementValue(p.values?.[key], unit, lang, { perShare: line.perShare })),
      };
    });
    const oldest = periods[periods.length - 1];
    return { columns, rows, currency: f.currency ?? periods[0]?.currency ?? null, count: periods.length, since: oldest.year };
  }, [load, lang, period, unit]);

  const unitWord = (u: StatementUnit) => t(u === "thousands" ? "f_k" : u === "millions" ? "f_m" : "f_b");

  return (
    <div className="flex flex-col gap-5">
      <div className={phone ? "flex flex-col gap-2.5" : "flex flex-wrap items-center gap-3"}>
        <Segmented
          label={[t("f_inc"), t("f_bal"), t("f_cf")].join(" / ")}
          value={statement}
          onChange={setStatement}
          className={phone ? "w-full" : ""}
          options={[
            { value: "income", label: t(phone ? "f_inc_s" : "f_inc") },
            { value: "balance", label: t(phone ? "f_bal_s" : "f_bal") },
            { value: "cashflow", label: t(phone ? "f_cf_s" : "f_cf") },
          ]}
        />
        <Segmented
          label={`${t("f_annual")} / ${t("f_quarter")}`}
          value={period}
          onChange={setPeriod}
          className={phone ? "w-full" : ""}
          options={[
            { value: "annual", label: t("f_annual") },
            { value: "quarterly", label: t("f_quarter") },
          ]}
        />
        <Segmented
          label={[t("f_k"), t("f_m"), t("f_b")].join(" / ")}
          value={unit}
          onChange={setUnit}
          className={phone ? "w-full" : ""}
          options={[
            { value: "thousands", label: t("f_k") },
            { value: "millions", label: t("f_m") },
            { value: "billions", label: t("f_b") },
          ]}
        />
      </div>
      <Card pad="px-3.5 pb-1.5 pt-3.5 sm:px-[22px] sm:pb-2 sm:pt-[18px]">
        {load.status === "loading" && (
          <div className="flex flex-col gap-3 py-2">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        )}
        {load.status === "error" && <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />}
        {load.status === "ready" && !table && (
          <div className="py-2">
            <InfoLine>{t("f_empty")}</InfoLine>
          </div>
        )}
        {table && (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-label font-semibold text-ink-2">{t("f_unit", { c: table.currency ?? "—", u: unitWord(unit).toLowerCase() })}</span>
              <span className="text-meta text-ink-3">{t(period === "annual" ? "f_count" : "f_qcount", { n: table.count, y: table.since })}</span>
            </div>
            <FinTable columns={table.columns} rows={table.rows} nextLabel={table.columns[1] ?? ""} />
          </div>
        )}
      </Card>
      <StockFoot stock={stock} />
    </div>
  );
}
