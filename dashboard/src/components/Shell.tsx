"use client";

// MOB-1198: web_frame: the ground, the top bar, the content column (1200 on
// a wide screen, 32 margins at 1024, 16 on a phone). The page waits for the
// session and goes where the guard says (sign-in, reserved page, dashboard).
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/app";
import { pageAccess, routeFor } from "@/lib/guard";
import { TopBar, Toasts } from "./TopBar";
import { Skeleton } from "./ui";

export function PageLoader() {
  return (
    <div className="flex flex-col gap-4 py-10" aria-busy="true">
      <Skeleton className="h-14 w-64" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-[320px] w-full rounded-card" />
    </div>
  );
}

export function Shell({ children, search = true, nav = true }: { children: ReactNode; search?: boolean; nav?: boolean }) {
  const { session } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const current = qs ? `${pathname}?${qs}` : pathname;
  const target = routeFor(pageAccess(pathname), session, current);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  const ready = session.status !== "loading" && !target;
  return (
    <div className="relative min-h-screen">
      <div className="ground" aria-hidden />
      <div className="relative z-[1] min-h-screen">
        <TopBar search={search} nav={nav} />
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-14 pt-6 sm:px-8 sm:pt-7 wide:px-0">{ready ? children : <PageLoader />}</main>
        <Toasts />
      </div>
    </div>
  );
}
