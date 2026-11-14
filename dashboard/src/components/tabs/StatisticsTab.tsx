"use client";

// MOB-1198 (FZW-WEB-05): every indicator Twelve Data returns, in the eight
// groups, with the date of the last update. A field the backend keeps but
// the dictionary does not know yet is shown with its own name.
import { useApp, useLoad } from "@/lib/app";
import { formatDate } from "@/lib/format";
import { STATISTIC_GROUPS, statField } from "@/lib/labels";
import { formatStat } from "@/lib/stat-format";
import type { Statistics, StockHeader } from "@/lib/types";
import { Card, ErrorState, Icon, KeyValue, Skeleton } from "../ui";
import { StockFoot } from "../StockFoot";

export function StatisticsTab({ stock }: { stock: StockHeader }) {
  const { api, t, lang } = useApp();
  const load = useLoad(`stats:${stock.symbol}`, () => api.get<Statistics>(`/dashboard/stocks/${encodeURIComponent(stock.symbol)}/statistics`));

  if (load.status === "error") {
    return (
      <Card>
        <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />
      </Card>
    );
  }
  const s = load.status === "ready" ? load.data : null;
  const cards = STATISTIC_GROUPS.map(([group, key]) => {
    const fields = Object.entries(s?.groups?.[group] ?? {});
    return (
      <Card key={group} title={t(key)} pad="px-5 pb-2 pt-[18px] sm:px-[22px]">
        {load.status === "loading" ? (
          <div className="flex flex-col gap-[18px] pb-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <KeyValue
            na={t("na")}
            rows={fields.map(([field, value]) => {
              const f = statField(field, lang);
              return { label: f.label, value: formatStat(value, f.kind, s?.currency ?? stock.currency, lang) };
            })}
          />
        )}
      </Card>
    );
  });
  const updated = formatDate(s?.updated_at, lang, { year: true });
  return (
    <div className="flex flex-col gap-5">
      {updated && (
        <p className="m-0 flex items-center gap-2.5 text-label font-medium text-ink-2">
          <Icon name="clock" size={16} className="text-ink-3" />
          {t("updated", { d: updated })}
        </p>
      )}
      {/* Phone and mid screens: the eight groups in order; wide: two columns as on the board. */}
      <div className="flex flex-col gap-5 lg:hidden">{cards}</div>
      <div className="hidden items-start gap-5 lg:grid lg:grid-cols-2">
        <div className="flex flex-col gap-5">{cards.filter((_, i) => i % 2 === 0)}</div>
        <div className="flex flex-col gap-5">{cards.filter((_, i) => i % 2 === 1)}</div>
      </div>
      <StockFoot stock={stock} />
    </div>
  );
}
