"use client";

// MOB-1461 (D444): «Spesa AI», the parts Carlo's dashboard asked for (boards
// ADM-ADD-04 on finzygit/finzy#750). The content lives in components/spend.
import { AdminFrame } from "@/components/shell/AdminFrame";
import { SpendView } from "@/components/spend/SpendView";

export default function SpendPage() {
  return (
    <AdminFrame title="Spesa AI">
      <SpendView />
    </AdminFrame>
  );
}
