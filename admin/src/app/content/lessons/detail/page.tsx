"use client";

// MOB-1380: /content/lessons/detail?id= and ?new=1 (boards ADM-CONTENT-02-lezione-*).
// The static export has no dynamic segments: the id is in the query string, read under Suspense.
// A new id (after «Crea lezione», or «Apri» in the uploads tray) mounts a fresh page: no state
// of the previous lesson survives.
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LessonPage } from "@/components/content/LessonPage";

function Keyed() {
  const p = useSearchParams();
  return <LessonPage key={`${p.get("id") ?? ""}|${p.get("new") ?? ""}|${p.get("section") ?? ""}`} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Keyed />
    </Suspense>
  );
}
