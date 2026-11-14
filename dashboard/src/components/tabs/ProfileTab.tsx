"use client";

// MOB-1198 (FZW-WEB-04): the company data Twelve Data gives (name, ticker,
// type, exchange, currency, country, sector, industry, employees, website,
// phone, address, CEO) and the description, as Twelve Data provides it.
import { useApp, useLoad } from "@/lib/app";
import { formatNumber, toNumber } from "@/lib/format";
import type { Profile, StockHeader } from "@/lib/types";
import { Card, ErrorState, KeyValue, Skeleton } from "../ui";
import { StockFoot } from "../StockFoot";

function site(url: string | null): { label: string; href: string } | null {
  if (!url) return null;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    return { label: new URL(href).hostname.replace(/^www\./, ""), href };
  } catch {
    return null;
  }
}

export function ProfileTab({ stock }: { stock: StockHeader }) {
  const { api, t, lang } = useApp();
  const load = useLoad(`profile:${stock.symbol}`, () => api.get<Profile>(`/dashboard/stocks/${encodeURIComponent(stock.symbol)}/profile`));

  if (load.status === "loading") {
    return (
      <div className="flex flex-col gap-5">
        <Card title={t("p_data")}>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }
  if (load.status === "error") {
    return (
      <Card>
        <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />
      </Card>
    );
  }
  const p = load.data;
  const web = site(p?.website ?? null);
  const employees = toNumber(p?.employees);
  const type = p?.type === "Common Stock" ? t("common_stock") : p?.type ?? null;
  const rows = [
    { label: t("p_name"), value: p?.name ?? stock.name },
    { label: t("p_ticker"), value: p?.symbol ?? stock.symbol },
    { label: t("p_type"), value: type },
    { label: t("p_exchange"), value: p?.exchange ?? stock.exchange },
    { label: t("p_currency"), value: p?.currency ?? null },
    { label: t("p_country"), value: p?.country ?? null },
    { label: t("p_sector"), value: p?.sector ?? null },
    { label: t("p_industry"), value: p?.industry ?? null },
    { label: t("p_employees"), value: employees === null ? null : formatNumber(employees, lang, 0) },
    { label: t("p_web"), value: web?.label ?? null, href: web?.href },
    { label: t("p_phone"), value: p?.phone ?? null },
    { label: t("p_address"), value: p?.address ?? null },
    { label: t("p_ceo"), value: p?.ceo ?? null },
  ];
  return (
    <div className="flex flex-col gap-5">
      <Card title={t("p_data")}>
        <KeyValue rows={rows} na={t("na")} columns={2} />
      </Card>
      <Card title={t("p_desc")} note={lang === "it" ? t("p_desc_lang") : null}>
        <p className={`m-0 text-body leading-[26px] ${p?.description ? "text-[rgba(244,247,246,0.86)]" : "text-ink-3"}`}>{p?.description || t("na")}</p>
      </Card>
      <StockFoot stock={stock} />
    </div>
  );
}
