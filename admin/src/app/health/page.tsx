"use client";

// MOB-1461 (D444): «Salute dei servizi» with «Fonti dati» (boards ADM-ADD-05
// on finzygit/finzy#750). The content lives in components/spend.
import { AdminFrame } from "@/components/shell/AdminFrame";
import { HealthView } from "@/components/spend/HealthView";

export default function HealthPage() {
  return (
    <AdminFrame title="Salute dei servizi">
      <HealthView />
    </AdminFrame>
  );
}
