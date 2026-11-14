"use client";

// MOB-1198 (FZW-WEB-02 … 13): the stock page. Header and chart on every tab
// («Perché si muove» beside the chart on a wide screen for a US stock), then
// the seven tabs. The tab is in the URL (?tab=), so a link or a reload opens
// the same tab. A stock outside the dashboard: «Titolo non trovato».
import { useRouter } from "next/navigation";
import { useApp, useLoad } from "@/lib/app";
import { ApiError } from "@/lib/api";
import { list } from "@/lib/i18n";
import type { StockHeader } from "@/lib/types";
import { PriceChart } from "./PriceChart";
import { stockHref } from "./Search";
import { PageLoader } from "./Shell";
import { StockHead, WhyBox, useIsPhone } from "./StockHeader";
import { EmptyState, ErrorState, SecondaryButton } from "./ui";
import { FinanceTab } from "./tabs/FinanceTab";
import { NewsTab } from "./tabs/NewsTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { ScoresTab } from "./tabs/ScoresTab";
import { StatisticsTab } from "./tabs/StatisticsTab";
import { SummaryTab } from "./tabs/SummaryTab";

export const TABS = ["summary", "profilo", "statistiche", "punteggi", "finanza", "notizie", "report"] as const;
export type Tab = (typeof TABS)[number];

export function toTab(value: string | null): Tab {
  return (TABS as readonly string[]).includes(value ?? "") ? (value as Tab) : "summary";
}

/** web_tabs: text tabs with the turquoise bar; chips in one scrolling row on a phone. */
export function Tabs({ active, onPick }: { active: Tab; onPick: (t: Tab) => void }) {
  const { lang } = useApp();
  const names = list(lang, "tabs");
  return (
    <nav aria-label={names.join(" · ")} className="scroll-x -mx-4 border-hair px-4 sm:mx-0 sm:border-b sm:px-0">
      <div role="tablist" className="flex w-max gap-2 sm:gap-[26px]">
        {TABS.map((tab, i) => {
          const on = tab === active;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onPick(tab)}
              className={`relative whitespace-nowrap text-body sm:h-12 ${
                on ? "font-[650] text-ink" : "font-medium text-ink-2"
              } h-11 rounded-full px-4 sm:rounded-none sm:px-0 ${on ? "max-sm:pill-on" : "max-sm:chip"}`}
            >
              {names[i]}
              {on && <span className="absolute inset-x-0 -bottom-px hidden h-0.5 rounded-sm bg-accent shadow-[0_0_10px_rgba(39,204,216,0.55)] sm:block" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function StockView({ symbol, tab }: { symbol: string; tab: Tab }) {
  const { api, t } = useApp();
  const router = useRouter();
  const phone = useIsPhone();
  const load = useLoad(symbol ? `stock:${symbol}` : null, () => api.get<StockHeader>(`/dashboard/stocks/${encodeURIComponent(symbol)}`));
  const goTab = (next: string) => router.replace(stockHref(symbol, next), { scroll: false });

  if (!symbol || (load.status === "error" && load.error instanceof ApiError && load.error.status === 404)) {
    return (
      <div className="py-[120px]">
        <EmptyState
          icon="search"
          title={t("nf_title")}
          body={t("nf_body")}
          action={<SecondaryButton onClick={() => router.push("/")}>{t("w_empty_a")}</SecondaryButton>}
        />
      </div>
    );
  }
  if (load.status === "error") {
    return (
      <div className="py-[120px]">
        <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />
      </div>
    );
  }
  if (load.status === "loading") return <PageLoader />;

  const stock = load.data;
  const body =
    tab === "profilo" ? (
      <ProfileTab stock={stock} />
    ) : tab === "statistiche" ? (
      <StatisticsTab stock={stock} />
    ) : tab === "punteggi" ? (
      <ScoresTab stock={stock} />
    ) : tab === "finanza" ? (
      <FinanceTab stock={stock} />
    ) : tab === "notizie" ? (
      <NewsTab stock={stock} />
    ) : tab === "report" ? (
      <ReportsTab stock={stock} />
    ) : (
      <SummaryTab stock={stock} goTab={goTab} />
    );

  return (
    <div className="flex flex-col gap-[18px] sm:gap-6">
      <StockHead stock={stock} />
      {stock.is_us ? (
        <div className="grid items-start gap-[18px] sm:gap-5 wide:grid-cols-[minmax(0,1fr)_360px]">
          <PriceChart stock={stock} phone={phone} />
          <WhyBox stock={stock} />
        </div>
      ) : (
        <PriceChart stock={stock} phone={phone} />
      )}
      <Tabs active={tab} onPick={goTab} />
      {body}
    </div>
  );
}
