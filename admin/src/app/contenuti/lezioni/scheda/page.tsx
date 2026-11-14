"use client";

// MOB-1380: /contenuti/lezioni/scheda?id= and ?nuova=1 (boards ADM-CONTENT-02-lezione-*).
// The static export has no dynamic segments: the id is in the query string, read under Suspense.
import { Suspense } from "react";
import { LessonPage } from "@/components/content/LessonPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LessonPage />
    </Suspense>
  );
}
