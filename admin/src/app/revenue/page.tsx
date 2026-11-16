"use client";

// MOB-1375: «Ricavi del mese» (route /revenue, console.revenue.view).

import { AdminFrame } from "@/components/shell/AdminFrame";
import { RevenueView } from "@/components/revenue/RevenueView";
import { T } from "@/components/revenue/texts";

export default function RevenuePage() {
  return (
    <AdminFrame title={T.rev_title}>
      <RevenueView />
    </AdminFrame>
  );
}
