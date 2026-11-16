"use client";

// MOB-1377 (D399, D400; boards ADM-STOCKS-01-lista-*, 04-medio-lista,
// 05-stretto-lista): every stock the app knows on one page. Search, six filter
// menus with the server's counts, four sorts, 50 a page from the server. A
// row opens the stock page. Prices are read here, never changed.

import { Suspense } from "react";
import { StocksList } from "@/components/stocks/StocksList";
import { AdminFrame } from "@/components/shell/AdminFrame";

export default function StocksPage() {
  return (
    <AdminFrame title="Titoli">
      <Suspense fallback={null}>
        <StocksList />
      </Suspense>
    </AdminFrame>
  );
}
