"use client";

// MOB-1377 (D399, D400; boards ADM-STOCKS-02-scheda-*, 03-modifica-*): one
// stock, read first: identity, price with its source and time, the chart,
// the price rows, documents, reports and articles, what the syncs did and
// the last console changes. «Modifica» (with console.stocks.update) opens
// the drawer with the four things that can change.

import { Suspense } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { StockDetail } from "@/components/stocks/StockDetail";

export default function StockSheetPage() {
  return (
    <AdminFrame title="Titoli">
      <Suspense fallback={null}>
        <StockDetail />
      </Suspense>
    </AdminFrame>
  );
}
