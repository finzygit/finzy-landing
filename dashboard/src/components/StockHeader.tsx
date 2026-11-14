"use client";

// MOB-1198 (FZW-WEB-02, 08, 10): web_stock_head and the «Perché si muove»
// box. Logo, name, «ticker · borsa · valuta», last price, the day's change,
// «Oggi · Ultimo prezzo …», the watchlist button. The Benzinga comment of
// the last 30 days for a US stock, with its date; no comment, no box.
import { useSyncExternalStore } from "react";
import { useApp, useLoad } from "@/lib/app";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import type { Commentary, StockHeader as Header } from "@/lib/types";
import { metaLine } from "./Search";
import { ChangePill, Icon, StockLogo } from "./ui";
import { WatchButton, useWatch } from "./WatchButton";

const PHONE_QUERY = "(max-width: 639px)";

export function useIsPhone(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(PHONE_QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

export function StockHead({ stock }: { stock: Header }) {
  const { t, lang } = useApp();
  const phone = useIsPhone();
  const watch = useWatch(stock);
  const price = toNumber(stock.last_price);
  const when = formatDate(stock.quoted_at, lang, { time: true });
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
        <div className="flex items-center gap-3.5">
          <StockLogo symbol={stock.symbol} url={stock.logo_url} size={phone ? 44 : 56} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="m-0 text-[24px] leading-[28px] font-bold tracking-[-0.02em] text-ink sm:text-[28px] sm:leading-[32px]">{stock.name}</h1>
            <span className="text-label text-ink-3">{metaLine(stock)}</span>
          </div>
          {phone && (
            <span className="ml-auto self-start">
              <WatchButton round on={watch.on} saving={watch.saving} disabled={watch.disabled} onToggle={watch.toggle} />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="tnum text-[34px] leading-[40px] font-bold tracking-[-0.02em] text-ink sm:text-hero">{price === null ? t("na") : formatMoney(price, stock.currency, lang)}</span>
          <div className="flex flex-wrap items-center gap-2">
            <ChangePill value={toNumber(stock.day_change_percent)} lang={lang} />
            <span className="text-row text-ink-2">{t("today")}</span>
            {when && <span className="text-meta text-ink-3">· {t("last_price", { t: when })}</span>}
          </div>
        </div>
      </div>
      {!phone && <WatchButton on={watch.on} saving={watch.saving} disabled={watch.disabled} onToggle={watch.toggle} />}
    </div>
  );
}

export function WhyBox({ stock }: { stock: Header }) {
  const { api, t, lang } = useApp();
  const load = useLoad(stock.is_us ? `why:${stock.symbol}:${lang}` : null, () => api.get<Commentary | null>("/stock-commentary", { symbol: stock.symbol, lang }));
  if (!stock.is_us || load.status !== "ready" || !load.data?.text) return null;
  const c = load.data;
  return (
    <section className="card px-5 pb-3.5 pt-[18px]">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[17px] font-[650] text-ink">{t("why_title")}</h2>
        <span className="text-meta text-ink-3">{formatDate(c.session_date || c.published_at, lang, { year: true })}</span>
      </div>
      <p className="m-0 text-row leading-[23px] text-[rgba(244,247,246,0.86)]">{c.text}</p>
      {lang === "it" && c.language !== "it" && <p className="mb-0 mt-3 text-tiny font-semibold text-ink-3">{t("why_lang")}</p>}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-hair pt-2.5 text-tiny text-ink-3">
        <span>{t("why_src")}</span>
        {c.source_url ? (
          <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-ink-3">
            Benzinga <Icon name="chevron_right" size={12} />
          </a>
        ) : (
          <span>Benzinga</span>
        )}
      </div>
    </section>
  );
}
