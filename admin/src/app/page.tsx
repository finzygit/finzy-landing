"use client";

// MOB-1373 (admin redesign · 2): the Home of the console, design
// finzygit/finzy#700. The content lives in components/home.
import { AdminFrame } from "@/components/shell/AdminFrame";
import { HomeView } from "@/components/home/HomeView";

export default function HomePage() {
  return (
    <AdminFrame title="Home">
      <HomeView />
    </AdminFrame>
  );
}
