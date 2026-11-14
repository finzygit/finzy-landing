"use client";

// MOB-1198 (FZW-WEB-01): the page for a signed-in user without Unlimited
// (or whose plan lapsed: ?scaduto=1, sent by any 402). The App Store and
// Google Play, no stock, no payment on the web, the account and «Esci».
import { useSearchParams } from "next/navigation";
import { StoreButtons } from "@/components/Auth";
import { Shell } from "@/components/Shell";
import { Icon, LinkButton, Notice } from "@/components/ui";
import { useApp } from "@/lib/app";

function Gate() {
  const { t, me, signOut } = useApp();
  const expired = useSearchParams().get("scaduto") === "1";
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[18px] pt-3 sm:pt-[72px]">
      {expired && (
        <div className="flex justify-center">
          <Notice text={t("gate_expired")} />
        </div>
      )}
      <section className="sm:card flex flex-col items-center gap-4 text-center sm:px-12 sm:pb-8 sm:pt-11">
        <span className="flex h-14 w-14 items-center justify-center rounded-tile bg-[rgba(242,184,75,0.14)] text-[#F6D08A]">
          <Icon name="lock" size={24} />
        </span>
        <h1 className="m-0 max-w-[340px] text-[26px] leading-[32px] font-bold tracking-[-0.02em] text-ink sm:text-[30px] sm:leading-[36px]">{t("gate_title")}</h1>
        <p className="m-0 text-row leading-[23px] text-ink-2">{t("gate_body")}</p>
        <StoreButtons />
        <p className="m-0 text-meta text-ink-3">{t("gate_store")}</p>
        {me?.email && <p className="m-0 mt-2 text-meta text-ink-3">{me.email}</p>}
        <LinkButton onClick={() => void signOut()}>{t("signout")}</LinkButton>
      </section>
    </div>
  );
}

export default function ReservedPage() {
  return (
    <Shell search={false} nav={false}>
      <Gate />
    </Shell>
  );
}
