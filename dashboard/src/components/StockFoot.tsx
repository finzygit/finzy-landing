"use client";

// MOB-1198 (FZW-WEB-02): every tab ends with the source of its data and the
// «not investment advice» notice (placeholder text until Carlo sends it).
import { useApp } from "@/lib/app";
import type { StockHeader } from "@/lib/types";
import { SourceLine } from "./ui";

export function StockFoot({ stock, updated }: { stock: StockHeader; updated?: string | null }) {
  const { t } = useApp();
  return <SourceLine source={t(stock.is_us ? "src_td" : "src_td_eu")} disclaimer={t("disclaimer")} updated={updated} />;
}
