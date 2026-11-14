"use client";

// MOB-1198 (FZW-WEB-09): web_consensus. Benzinga's counts in the app's three
// words (Acquisto / Mantenimento / Vendita, design decision 3), the 12-month
// target with the current price on it, up to 10 latest analysts, Benzinga as
// source. Not covered (or not a US stock): one line saying so.
import { useApp, type Load } from "@/lib/app";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import type { Consensus } from "@/lib/types";
import { Card, InfoLine, Skeleton } from "./ui";

type Bucket = "buy" | "hold" | "sell";

export function bucketOf(rating: string): Bucket {
  if (rating === "strong_buy" || rating === "buy") return "buy";
  if (rating === "strong_sell" || rating === "sell") return "sell";
  return "hold";
}

export function counts(c: Consensus): Record<Bucket, number> {
  const d = c.distribution ?? {};
  const n = (v: number | null | undefined) => toNumber(v) ?? 0;
  return { buy: n(d.strong_buy) + n(d.buy), hold: n(d.hold), sell: n(d.sell) + n(d.strong_sell) };
}

const BAR: Record<Bucket, string> = { buy: "bg-accent", hold: "bg-[rgba(255,255,255,0.45)]", sell: "bg-[rgba(255,255,255,0.22)]" };

export function ConsensusCard({ load, price, currency }: { load: Load<Consensus | null>; price: number | null; currency: string | null }) {
  const { t, lang } = useApp();
  let body;
  if (load.status === "loading") {
    body = (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-3/5" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (load.status === "error" || !load.data || counts(load.data).buy + counts(load.data).hold + counts(load.data).sell === 0) {
    body = <InfoLine>{t("consensus_na")}</InfoLine>;
  } else {
    const c = load.data;
    const k = counts(c);
    const total = k.buy + k.hold + k.sell;
    const n = toNumber(c.analyst_count) ?? total;
    const target = c.price_target;
    const cur = target?.currency || currency;
    const low = toNumber(target?.low);
    const high = toNumber(target?.high);
    const avg = toNumber(target?.consensus);
    const markerAt = low !== null && high !== null && price !== null && high > low ? Math.min(1, Math.max(0, (price - low) / (high - low))) : null;
    const money = (v: number | null) => (v === null ? t("na") : formatMoney(v, cur, lang));
    body = (
      <div className="flex flex-col gap-4">
        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {(["buy", "hold", "sell"] as Bucket[]).map((b) => (k[b] > 0 ? <span key={b} className={BAR[b]} style={{ width: `${(k[b] / total) * 100}%` }} /> : null))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["buy", "hold", "sell"] as Bucket[]).map((b) => (
            <div key={b} className="flex flex-col gap-1">
              <span data-testid={`count-${b}`} className="tnum text-stat font-[650] text-ink">
                {k[b]}
              </span>
              <span className="flex items-center gap-1.5 text-meta font-semibold text-ink-2">
                <span className={`inline-block h-2 w-2 flex-none rounded-[2px] ${BAR[b]}`} />
                {t(b)}
              </span>
            </div>
          ))}
        </div>
        <span className="text-tiny text-ink-3">{t("analyst_count", { n })}</span>
        {target && (low !== null || high !== null) && (
          <div className="flex flex-col gap-2 border-t border-hair pt-4">
            <h3 className="m-0 text-row font-[650] text-ink">{t("target")}</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                [t("t_low"), money(low), "text-left"],
                [t("t_avg"), money(avg), "text-center"],
                [t("t_high"), money(high), "text-right"],
              ].map(([label, value, align]) => (
                <div key={label} className={`flex flex-col ${align}`}>
                  <span className="text-tiny font-semibold text-ink-3">{label}</span>
                  <span className="tnum text-row font-[650] text-ink">{value}</span>
                </div>
              ))}
            </div>
            <div className="relative mt-1 h-1.5 rounded-full bg-[rgba(39,204,216,0.28)]">
              {markerAt !== null && (
                <span className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${markerAt * 100}%` }} />
              )}
            </div>
            {markerAt !== null && (
              <span className="relative block h-4 text-tiny font-semibold text-ink-2">
                <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.min(85, Math.max(15, markerAt * 100))}%` }}>
                  {t("price_now")} ▲
                </span>
              </span>
            )}
          </div>
        )}
        {c.analysts?.length > 0 && (
          <div className="flex flex-col">
            <h3 className="m-0 mb-1 text-row font-[650] text-ink">{t("who")}</h3>
            {c.analysts.slice(0, 10).map((a, i) => {
              const b = bucketOf(a.rating);
              const pt = toNumber(a.price_target);
              return (
                <div key={`${a.firm}-${i}`} className="grid min-h-[40px] grid-cols-[minmax(0,1.6fr)_1.15fr_0.95fr_0.7fr] items-center gap-2.5 border-b border-hair last:border-b-0">
                  <span className="truncate text-label font-semibold text-ink">{a.firm || a.analyst_name}</span>
                  <span className={`truncate text-label font-semibold ${b === "buy" ? "text-accent" : "text-ink-2"}`}>{t(b)}</span>
                  <span className="tnum text-label font-semibold text-ink">{pt === null ? "—" : formatMoney(pt, a.currency || cur, lang)}</span>
                  <span className="text-right text-meta whitespace-nowrap text-ink-3">{formatDate(a.rated_at, lang)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return (
    <Card title={t("consensus")}>
      {body}
      <p className="mb-0 mt-3.5 text-tiny text-ink-3">{t("consensus_src")}</p>
    </Card>
  );
}
