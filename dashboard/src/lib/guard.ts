// MOB-1198 (FZW-WEB-01): which page each visitor may see.
// - public: the sign-in and password pages (open to visitors);
// - signed: the page reserved to Unlimited (needs a signed-in user);
// - unlimited: everything else (search, stock, watchlist).
// The backend enforces the plan on every data route (402); this guard only
// picks the page to show, so a non-Unlimited user never sees a stock page.

export type Session = { status: "loading" } | { status: "anonymous" } | { status: "signed"; unlimited: boolean };
export type Access = "public" | "signed" | "unlimited";

export const SIGN_IN = "/accedi";
export const RESERVED = "/riservata";
export const HOME = "/";

export function pageAccess(pathname: string): Access {
  const path = pathname.replace(/\/+$/, "").replace(/\.html$/, "") || "/";
  if (path === SIGN_IN || path === "/password") return "public";
  if (path === RESERVED) return "signed";
  return "unlimited";
}

/**
 * A `next` that stays on this site and is not a sign-in page; "/" otherwise.
 * Control characters are refused (the URL parser drops tabs and newlines, so
 * "/\t/evil.com" would become "//evil.com"), and the parsed URL must keep
 * this origin.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\u0000-\u001F\u007F\\]/.test(next)) return HOME;
  let url: URL;
  try {
    url = new URL(next, "https://dashboard.invalid");
  } catch {
    return HOME;
  }
  if (url.origin !== "https://dashboard.invalid") return HOME;
  if (pageAccess(url.pathname) !== "unlimited") return HOME;
  return url.pathname + url.search;
}

/**
 * Where to go from `current` (path with its query), or null to stay.
 * Visitors keep the page they asked for in `?next=` for after the sign-in.
 */
export function routeFor(access: Access, session: Session, current: string): string | null {
  if (session.status === "loading") return null;
  if (session.status === "anonymous") {
    if (access === "public") return null;
    return access === "unlimited" && current !== HOME ? `${SIGN_IN}?next=${encodeURIComponent(current)}` : SIGN_IN;
  }
  if (!session.unlimited) return access === "signed" ? null : RESERVED;
  if (access === "unlimited") return null;
  if (access === "public") {
    const q = current.includes("?") ? new URLSearchParams(current.split("?")[1]) : null;
    return safeNext(q?.get("next"));
  }
  return HOME;
}
