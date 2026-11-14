"use client";

// MOB-1198: the stock page, /titolo?s=NVDA&tab=finanza. A query string, not
// a path segment, so the static export has one titolo.html that nginx serves
// for every stock (try_files $uri $uri.html /index.html).
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { StockView, toTab } from "@/components/StockView";

function Stock() {
  const params = useSearchParams();
  const symbol = (params.get("s") ?? "").trim().toUpperCase();
  return <StockView symbol={symbol} tab={toTab(params.get("tab"))} />;
}

export default function StockPage() {
  return (
    <Shell>
      <Stock />
    </Shell>
  );
}
