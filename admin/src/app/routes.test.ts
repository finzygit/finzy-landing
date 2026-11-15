// D428: the console's page addresses are in English (/sign-in, /users,
// /news, /admin/audit-log…); only the words on screen (menu, titles) are
// Italian. Every folder under src/app is a page address of the static export,
// every NAV route and every address a page links or redirects to must use
// the English words below. A new page adds its word here, in English.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { redirectFor } from "@/lib/api";
import { NAV } from "@/lib/nav";

const ENGLISH = new Set([
  "sign-in", "setup", "code", "account",
  "admin", "roles", "people", "audit-log", "tools",
  "users", "detail", "revenue", "promotions",
  "news", "articles", "review", "taxonomies",
  "stocks", "report", "portfolio-builder", "consents",
  "content", "lessons", "tutorial", "avatars", "settings",
  "spend", "health",
]);

// The old Italian addresses (before D428): none may come back as a path.
const ITALIAN = [
  "accedi", "attiva", "codice", "amministrazione", "ruoli", "persone", "registro", "strumenti",
  "utenti", "scheda", "ricavi", "promozioni", "notizie", "articoli", "verifica", "classificazioni",
  "titoli", "consensi", "contenuti", "lezioni", "avatar", "impostazioni", "costi", "servizi",
];
const ITALIAN_QUERY = ["scaduta", "duplica", "nuova", "sezione", "periodo"];

// vitest runs in admin/ (pnpm --dir admin test); jsdom has no file: import.meta.url.
const src = join(process.cwd(), "src");
const app = join(src, "app");
if (!existsSync(join(app, "sign-in", "page.tsx"))) throw new Error(`run vitest from admin/: ${app} is not the console's app folder`);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? [p, ...walk(p)] : [p];
  });
}

const segments = (route: string) => route.replace(/[?#].*$/, "").split("/").filter(Boolean);

describe("console page addresses are English (D428)", () => {
  it("every page folder under src/app is an English word", () => {
    const folders = walk(app).filter((p) => statSync(p).isDirectory()).map((p) => relative(app, p));
    expect(folders.length).toBeGreaterThan(0);
    const bad = folders.flatMap((f) => f.split("/").filter((s) => !ENGLISH.has(s)).map((s) => `${f} (${s})`));
    expect(bad).toEqual([]);
  });

  it("every menu route is English", () => {
    const routes = NAV.flatMap((s) => s.groups.flatMap((g) => [g.route, ...g.pages.map((p) => p.route)]));
    const bad = routes.filter((r) => segments(r).some((s) => !ENGLISH.has(s)));
    expect(bad).toEqual([]);
  });

  it("the sign-in redirects are English", () => {
    expect(redirectFor(401, "unauthenticated")).toBe("/sign-in");
    expect(redirectFor(401, "session_expired")).toBe("/sign-in?expired=1");
    expect(redirectFor(403, "two_factor_required")).toBe("/sign-in/code");
    expect(redirectFor(403, "two_factor_setup_required")).toBe("/sign-in/setup");
  });

  it("every address a page links, pushes, replaces or opens is English", () => {
    const files = walk(src).filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith("routes.test.ts"));
    // href="/…", href={`/…`}, push("/…"), replace(`/…`), open(`${BASE}/…`), setLeaveTo("/…"), toBe("/…"), CalledWith("/…"), route: "/…"
    const target = /(?:href=\{?|push\(|replace\(|open\(|setLeaveTo\(|toBe\(|CalledWith\(|route: |pathname = |pathname: )["'`](?:\$\{BASE\})?(\/[^"'`?#$]*)/g;
    const bad: string[] = [];
    let seen = 0;
    for (const f of files) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        for (const m of line.matchAll(target)) {
          if (m[1].startsWith("/api/")) continue; // the backend, not a page
          seen++;
          const wrong = segments(m[1]).filter((s) => !ENGLISH.has(s));
          if (wrong.length) bad.push(`${relative(src, f)}:${i + 1}: ${m[1]} (${wrong.join(", ")})`);
        }
      });
    }
    expect(seen).toBeGreaterThan(10);
    expect(bad).toEqual([]);
  });

  it("no source file starts an address with an Italian word or uses an Italian query key or period", () => {
    const files = walk(src).filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith("routes.test.ts"));
    const path = new RegExp(`["'\`(]/(${ITALIAN.join("|")})(?![\\w-])`);
    const keys = ITALIAN_QUERY.join("|");
    const query = new RegExp(`([?&"'\`](${keys})=)|\\.(get|set|has|append|delete)\\(["'\`](${keys})["'\`]|=(oggi|ieri)\\b`);
    const bad = files.flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((line, i) => {
        return path.test(line) || query.test(line) ? [`${relative(src, f)}:${i + 1}: ${line.trim()}`] : [];
      }),
    );
    expect(bad).toEqual([]);
  });
});
