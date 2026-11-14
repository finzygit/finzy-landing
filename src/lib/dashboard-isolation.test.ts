/**
 * La dashboard web (MOB-1198, FZW-WEB) vive in `dashboard/`, un'app Next a
 * parte con il suo package.json e il suo lockfile, servita da nginx su
 * app.finzyapp.com. Il sito non deve vederla: né il type-check, né eslint,
 * né Tailwind (che altrimenti genererebbe nel CSS del sito le classi della
 * dashboard). Si lanciano con `pnpm test`.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("la dashboard resta fuori dal sito", () => {
  test("la cartella dashboard/ ha il suo package.json e il suo lockfile", () => {
    assert.ok(existsSync(new URL("dashboard/package.json", root)));
    assert.ok(existsSync(new URL("dashboard/pnpm-lock.yaml", root)));
  });

  test("tsconfig.json del sito esclude dashboard/", () => {
    const tsconfig = JSON.parse(read("tsconfig.json")) as { exclude?: string[] };
    assert.ok(tsconfig.exclude?.includes("dashboard"), "manca \"dashboard\" in exclude");
  });

  test("eslint del sito ignora dashboard/", () => {
    assert.match(read("eslint.config.mjs"), /["']dashboard\/\*\*["']/);
  });

  test("Tailwind del sito non legge dashboard/", () => {
    assert.match(read("src/app/globals.css"), /@source not ["']\.\.\/\.\.\/dashboard["'];/);
  });

  test("next.config della dashboard è un export statico, con la sua radice", () => {
    const config = read("dashboard/next.config.ts");
    assert.match(config, /output: "export"/);
    assert.match(config, /turbopack: \{ root: path\.join\(__dirname\) \}/);
  });

  test("la dashboard non va sui motori di ricerca", () => {
    assert.match(read("dashboard/public/robots.txt"), /^Disallow: \/$/m);
    assert.match(read("dashboard/src/app/layout.tsx"), /index: false/);
  });
});
