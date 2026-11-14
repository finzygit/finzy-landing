// MOB-1198 (FZW-WEB-12): a backend download link as a path of this origin.
// The backend builds absolute URLs with its own host (console.finzyapp.com),
// where the dashboard's __Host- cookie is never sent; the same /api path on
// app.finzyapp.com reaches the same Laravel with the cookie. Anything else
// (SEC EDGAR, S3) is external: opened in a new tab.

const FINZY_HOST = /(^|\.)finzyapp\.com$/i;

/** "/api/…" for one of our API links, or null for an external link. */
export function apiPath(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return url.startsWith("/api/") ? url : null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!FINZY_HOST.test(u.hostname) && u.hostname !== "localhost") return null;
    return u.pathname.startsWith("/api/") ? u.pathname + u.search : null;
  } catch {
    return null;
  }
}
