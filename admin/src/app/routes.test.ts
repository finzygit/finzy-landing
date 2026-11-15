// D428: the console's page addresses are in English (/sign-in, /users,
// /news, /admin/audit-log…); only the words on screen (menu, titles) are
// Italian. Every folder under src/app is a page address of the static export,
// every NAV route and every address a page links or redirects to must use
// the English words below. A new page adds its word here, in English.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
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

const src = fileURLToPath(new URL("..", import.meta.url));
const app = join(src, "app");

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

  it("no source file links, pushes or redirects to an Italian address", () => {
    const files = walk(src).filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith("routes.test.ts"));
    const path = new RegExp(`["'\`(]/(${ITALIAN.join("|")})(?![\\w-])`);
    const query = new RegExp(`[?&](${ITALIAN_QUERY.join("|")})=|\\.get\\("(${ITALIAN_QUERY.join("|")})"\\)`);
    const bad = files.flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((line, i) =>
        path.test(line) || query.test(line) ? [`${relative(src, f)}:${i + 1}: ${line.trim()}`] : []),
    );
    expect(bad).toEqual([]);
  });
});
