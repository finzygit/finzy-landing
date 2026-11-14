"use client";

// MOB-1198 (FZW-WEB-06): the Scores tab. Piotroski F-Score with its nine
// criteria, Altman Z-Score with its zone (1,81 / 2,99), Beneish M-Score with
// the −1,78 threshold. A score that cannot be computed says why on one line;
// a financial-sector company gets one line for all three. Scores use
// turquoise and grey, never lime or red (they are not rises or falls).
import { useApp, useLoad } from "@/lib/app";
import { formatCompact, formatNumber, formatPercent, type Lang } from "@/lib/format";
import { PIOTROSKI } from "@/lib/labels";
import type { TextKey } from "@/lib/i18n";
import type { Altman, Beneish, NotComputable, Piotroski, PiotroskiCriterion, Scores, StockHeader } from "@/lib/types";
import { Card, ErrorState, Icon, InfoLine, Skeleton } from "../ui";
import { StockFoot } from "../StockFoot";

export function naReason(score: NotComputable | null): TextKey {
  return score?.reason === "financial_sector" ? "na_fin" : "na_data";
}

export function allFinancial(s: Scores): boolean {
  return [s.piotroski, s.altman, s.beneish].every((x) => x && !x.computable && x.reason === "financial_sector");
}

function criterionDetail(c: PiotroskiCriterion, lang: Lang, currency: string | null): string | null {
  const kind = PIOTROSKI[c.key]?.format;
  const one = (v: number | null): string | null => {
    if (v === null || !Number.isFinite(v)) return null;
    if (kind === "pct") return formatPercent(v, lang, { fraction: true, decimals: 1 });
    if (kind === "money") return formatCompact(v, lang, currency);
    if (kind === "count") return formatCompact(v, lang);
    return formatNumber(v, lang, 2);
  };
  const a = one(c.value);
  if (a === null) return null;
  if (c.key === "roa_positive" || c.key === "operating_cash_flow_positive") return a;
  const b = one(c.compared_to);
  return b === null ? a : `${a} vs ${b}`;
}

function PiotroskiCard({ p, currency, phone }: { p: Piotroski | null; currency: string | null; phone?: boolean }) {
  const { t, lang } = useApp();
  if (!p || !p.computable) {
    return (
      <Card title={t("piotroski")}>
        <InfoLine>{t(naReason(p as NotComputable | null))}</InfoLine>
      </Card>
    );
  }
  return (
    <Card title={t("piotroski")}>
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="tnum text-[52px] leading-[56px] font-bold tracking-[-0.03em] text-ink">{p.score}</span>
        <span className="text-[22px] font-semibold text-ink-2">/ {p.max}</span>
        <span className="text-row font-medium text-ink-2">{t("of9")}</span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {p.criteria.map((c) => {
          const label = PIOTROSKI[c.key]?.label[lang === "it" ? 0 : 1] ?? c.key;
          const detail = phone ? null : criterionDetail(c, lang, currency);
          return (
            <li key={c.key} className="flex min-h-[44px] items-center gap-3 border-b border-hair py-2 last:border-b-0">
              <span
                className={`inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full ${c.passed ? "bg-[rgba(39,204,216,0.18)] text-accent" : "bg-[rgba(255,255,255,0.08)] text-ink-3"}`}
                aria-label={c.passed ? "✓" : "✗"}
              >
                <Icon name={c.passed ? "check" : "close"} size={13} stroke={2.6} />
              </span>
              <span className="min-w-0 flex-1 text-row text-ink">{label}</span>
              {detail && <span className="tnum text-meta whitespace-nowrap text-ink-3">{detail}</span>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** web_zone_bar: zones on a line, threshold marks, the white marker on the value. */
function ZoneBar({ zones, marks, at, label }: { zones: { label: string; width: number; tone: string }[]; marks: { label: string; at: number }[]; at: number; label: string }) {
  const total = zones.reduce((s, z) => s + z.width, 0);
  return (
    <div className="flex flex-col gap-2" role="img" aria-label={label}>
      <div className="relative">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {zones.map((z) => (
            <span key={z.label} style={{ width: `${(z.width / total) * 100}%`, background: z.tone }} />
          ))}
        </div>
        <span className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,0,0,0.5)] bg-ink" style={{ left: `${Math.min(1, Math.max(0, at)) * 100}%` }} />
      </div>
      <div className="relative h-4">
        {marks.map((m) => (
          <span key={m.label} className="tnum absolute -translate-x-1/2 text-tiny font-semibold text-ink-2" style={{ left: `${m.at * 100}%` }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="flex">
        {zones.map((z) => (
          <span key={z.label} className="text-center text-tiny font-semibold text-ink-2" style={{ width: `${(z.width / total) * 100}%` }}>
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const ZONE_TONE = { off: "rgba(255,255,255,0.10)", mid: "rgba(255,255,255,0.18)", on: "rgba(39,204,216,0.40)" };

export function altmanText(a: Extract<Altman, { computable: true }>, t: (k: TextKey) => string): string {
  return a.zone === "safe" ? t("z_is") : a.zone === "grey" ? t("z_mid") : t("z_low");
}

function AltmanCard({ a }: { a: Altman | null }) {
  const { t, lang } = useApp();
  if (!a || !a.computable) {
    return (
      <Card title={t("altman")}>
        <InfoLine>{t(naReason(a as NotComputable | null))}</InfoLine>
      </Card>
    );
  }
  const max = 6;
  const lo = a.thresholds?.distress_below ?? 1.81;
  const hi = a.thresholds?.safe_above ?? 2.99;
  return (
    <Card title={t("altman")}>
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="tnum text-[44px] leading-[50px] font-bold tracking-[-0.03em] text-ink">{formatNumber(a.score, lang, 2)}</span>
          <span className="text-row font-medium text-ink-2">{altmanText(a, t)}</span>
        </div>
        <ZoneBar
          label={`${t("altman")} ${formatNumber(a.score, lang, 2)}`}
          zones={[
            { label: t("z_low"), width: lo, tone: a.zone === "distress" ? ZONE_TONE.on : ZONE_TONE.off },
            { label: t("z_mid"), width: hi - lo, tone: a.zone === "grey" ? ZONE_TONE.on : ZONE_TONE.mid },
            { label: t("z_high"), width: max - hi, tone: a.zone === "safe" ? ZONE_TONE.on : ZONE_TONE.off },
          ]}
          marks={[
            { label: formatNumber(lo, lang, 2), at: lo / max },
            { label: formatNumber(hi, lang, 2), at: hi / max },
          ]}
          at={a.score / max}
        />
      </div>
    </Card>
  );
}

function BeneishCard({ b }: { b: Beneish | null }) {
  const { t, lang } = useApp();
  if (!b || !b.computable) {
    return (
      <Card title={t("beneish")}>
        <InfoLine>{t(naReason(b as NotComputable | null))}</InfoLine>
      </Card>
    );
  }
  const threshold = b.threshold ?? -1.78;
  // Scale −4 … 0: below the threshold on the left, above it on the right.
  const pos = (v: number) => (v + 4) / 4;
  return (
    <Card title={t("beneish")}>
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="tnum text-[44px] leading-[50px] font-bold tracking-[-0.03em] text-ink">{formatNumber(b.score, lang, 2)}</span>
          <span className="text-row font-medium text-ink-2">{b.above_threshold ? t("m_above") : t("m_below")}</span>
        </div>
        <ZoneBar
          label={`${t("beneish")} ${formatNumber(b.score, lang, 2)}`}
          zones={[
            { label: t("m_below"), width: threshold + 4, tone: b.above_threshold ? ZONE_TONE.off : ZONE_TONE.on },
            { label: t("m_above"), width: -threshold, tone: b.above_threshold ? ZONE_TONE.on : "rgba(255,255,255,0.14)" },
          ]}
          marks={[{ label: formatNumber(threshold, lang, 2), at: pos(threshold) }]}
          at={pos(b.score)}
        />
      </div>
    </Card>
  );
}

export function ScoresView({ scores, phone = false }: { scores: Scores; phone?: boolean }) {
  const { t } = useApp();
  if (allFinancial(scores)) {
    return (
      <div className="flex flex-col gap-5">
        <Card title={t("scores")}>
          <InfoLine>{t("na_fin_all")}</InfoLine>
        </Card>
        <InfoLine>{t("scores_note")}</InfoLine>
      </div>
    );
  }
  const year = scores.fiscal_date ? Number(scores.fiscal_date.slice(0, 4)) : null;
  return (
    <div className="flex flex-col gap-5">
      {year && <p className="m-0 text-label font-medium text-ink-2">{t("scores_basis", { a: year - 1, b: year })}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <PiotroskiCard p={scores.piotroski} currency={scores.currency} phone={phone} />
        <div className="flex flex-col gap-5">
          <AltmanCard a={scores.altman} />
          <BeneishCard b={scores.beneish} />
        </div>
      </div>
      <InfoLine>{t("scores_note")}</InfoLine>
    </div>
  );
}

/** web_score_chip of the Summary: the three results, or «Non disponibile». */
export function ScoreChips({ scores, loading }: { scores: Scores | null; loading: boolean }) {
  const { t, lang } = useApp();
  if (loading) return <Skeleton className="h-[90px] w-full rounded-tile" />;
  const p = scores?.piotroski;
  const a = scores?.altman;
  const b = scores?.beneish;
  const chip = (label: string, value: string | null, sub: string) => (
    <div className="tile flex min-w-0 flex-col gap-1.5 px-[18px] py-4">
      <span className="text-meta font-semibold text-ink-2">{label}</span>
      <span className={`tnum text-stat font-[650] ${value ? "text-ink" : "text-ink-3"}`}>{value ?? "—"}</span>
      <span className={`text-meta font-semibold ${value ? "text-ink" : "text-ink-3"}`}>{sub}</span>
    </div>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {p && p.computable ? chip(t("piotroski"), `${p.score}/${p.max}`, t("of9")) : chip(t("piotroski"), null, t("na"))}
      {a && a.computable ? chip(t("altman"), formatNumber(a.score, lang, 2), a.zone === "safe" ? t("z_high") : a.zone === "grey" ? t("z_mid") : t("z_low")) : chip(t("altman"), null, t("na"))}
      {b && b.computable ? chip(t("beneish"), formatNumber(b.score, lang, 2), b.above_threshold ? t("m_above") : t("m_below")) : chip(t("beneish"), null, t("na"))}
    </div>
  );
}

export function ScoresTab({ stock }: { stock: StockHeader }) {
  const { api, t } = useApp();
  const load = useLoad(`scores:${stock.symbol}`, () => api.get<Scores>(`/dashboard/stocks/${encodeURIComponent(stock.symbol)}/scores`));
  return (
    <div className="flex flex-col gap-5">
      {load.status === "loading" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <Skeleton className="h-[320px] w-full" />
          </Card>
          <Card>
            <Skeleton className="h-[140px] w-full" />
          </Card>
        </div>
      )}
      {load.status === "error" && (
        <Card>
          <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />
        </Card>
      )}
      {load.status === "ready" && <ScoresView scores={load.data} />}
      <StockFoot stock={stock} />
    </div>
  );
}

