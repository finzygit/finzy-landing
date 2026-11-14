// MOB-1198: regenerates src/lib/texts-evo-web.ts from the texts table of the
// boards (design/v2/EVO-WEB.md of the app repo, design branch).
// Usage: node scripts/texts-from-md.mjs <path to EVO-WEB.md>
import { readFileSync, writeFileSync } from "node:fs";

const md = process.argv[2];
if (!md) {
  console.error("usage: node scripts/texts-from-md.mjs <EVO-WEB.md>");
  process.exit(64);
}
const rows = [];
for (const line of readFileSync(md, "utf8").split("\n")) {
  const m = /^\| `([a-z0-9_]+)` \| (.*) \| (.*) \|\s*$/.exec(line);
  if (m) rows.push([m[1], m[2], m[3]]);
}
const js = (s) => JSON.stringify(s);
const out = [
  "// Generated from design/v2/EVO-WEB.md (branch design/evo-evo-web), the texts table of the",
  "// MOB-1198 boards: every string exactly as approved there (D385). Do not edit by hand:",
  "// change the table, then regenerate (see dashboard/README.md).",
  "",
  "export const EVO_WEB_IT = {",
  ...rows.map(([k, it]) => `  ${k}: ${js(it)},`),
  "} as const;",
  "",
  "export type EvoWebKey = keyof typeof EVO_WEB_IT;",
  "",
  "export const EVO_WEB_EN: Record<EvoWebKey, string> = {",
  ...rows.map(([k, , en]) => `  ${k}: ${js(en)},`),
  "};",
  "",
].join("\n");
writeFileSync(new URL("../src/lib/texts-evo-web.ts", import.meta.url), out);
console.log(`${rows.length} texts written`);
