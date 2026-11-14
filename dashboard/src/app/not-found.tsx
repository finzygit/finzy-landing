"use client";

// MOB-1198: a path the dashboard does not have («Titolo non trovato» style).
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/ui";
import { useApp } from "@/lib/app";

function Missing() {
  const { t } = useApp();
  return (
    <div className="py-[120px]">
      <EmptyState
        icon="search"
        title={t("nf_title")}
        body={t("nf_body")}
        action={
          <Link href="/" className="raised inline-flex h-[46px] items-center rounded-control px-5 text-[16px] font-semibold text-ink">
            {t("w_empty_a")}
          </Link>
        }
      />
    </div>
  );
}

export default function NotFound() {
  return (
    <Shell>
      <Missing />
    </Shell>
  );
}
