/**
 * La console admin (MOB-1369, MOB-1372) vive in `admin/`, un'app Next a parte
 * con il suo package.json e il suo lockfile, servita da nginx sotto un percorso
 * nascosto di console.finzyapp.com. Il sito non deve vederla: né il type-check,
 * né eslint, né Tailwind. I suoi test girano con `pnpm test` (admin:test).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("la console admin resta fuori dal sito", () => {
  test("la cartella admin/ ha il suo package.json e il suo lockfile", () => {
    assert.ok(existsSync(new URL("admin/package.json", root)));
    assert.ok(existsSync(new URL("admin/pnpm-lock.yaml", root)));
  });

  test("tsconfig.json del sito esclude admin/", () => {
    const tsconfig = JSON.parse(read("tsconfig.json")) as { exclude?: string[] };
    assert.ok(tsconfig.exclude?.includes("admin"), "manca \"admin\" in exclude");
  });

  test("eslint del sito ignora admin/", () => {
    assert.match(read("eslint.config.mjs"), /["']admin\/\*\*["']/);
  });

  test("Tailwind del sito non legge admin/", () => {
    assert.match(read("src/app/globals.css"), /@source not ["']\.\.\/\.\.\/admin["'];/);
  });

  test("next.config della console è un export statico, con la sua radice e il percorso dall'ambiente", () => {
    const config = read("admin/next.config.ts");
    assert.match(config, /output: "export"/);
    assert.match(config, /turbopack: \{ root: path\.join\(__dirname\) \}/);
    assert.match(config, /NEXT_PUBLIC_ADMIN_BASE/);
  });

  test("la console non va sui motori di ricerca e non scrive il percorso nascosto nel repo", () => {
    assert.match(read("admin/public/robots.txt"), /^Disallow: \/$/m);
    assert.match(read("admin/src/app/layout.tsx"), /index: false/);
    assert.doesNotMatch(read("admin/next.config.ts"), /basePath: "\//);
  });
});
