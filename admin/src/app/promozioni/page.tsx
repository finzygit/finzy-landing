"use client";

// MOB-1375: «Promozioni» (route /promozioni, console.promotions.view). The
// static export has no dynamic segments, so one promotion is a query string:
// ?nuova=1 (new), ?id=N (open: edit, end-only or read-only by its state and
// the role), ?duplica=N (a new one from a copy).

import { useSearchParams } from "next/navigation";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { modeOf, PromotionEditor } from "@/components/revenue/PromotionEditor";
import { PromotionsList } from "@/components/revenue/PromotionsList";
import { T } from "@/components/revenue/texts";

export default function PromotionsPage() {
  const mode = modeOf(useSearchParams());
  return (
    <AdminFrame title={T.promo_title}>
      {mode ? <PromotionEditor key={JSON.stringify(mode)} mode={mode} /> : <PromotionsList />}
    </AdminFrame>
  );
}
