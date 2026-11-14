// MOB-1198 (FZW-WEB-02): the dashboard in Italian and English. One typed
// dictionary: the EVO-WEB.md table (texts-evo-web.ts, generated) plus the
// few texts of texts-extra.ts. A missing key is a type error, never a blank.
import { EVO_WEB_EN, EVO_WEB_IT, type EvoWebKey } from "./texts-evo-web.ts";
import { EXTRA_EN, EXTRA_IT, type ExtraKey } from "./texts-extra.ts";
import type { Lang } from "./format.ts";

export type TextKey = EvoWebKey | ExtraKey;

export const DICTIONARY: Record<Lang, Record<TextKey, string>> = {
  it: { ...EVO_WEB_IT, ...EXTRA_IT },
  en: { ...EVO_WEB_EN, ...EXTRA_EN },
};

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, key: TextKey, vars?: Vars): string {
  const text = DICTIONARY[lang][key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Lists written «A · B · C» in the table (periods, tabs). */
export function list(lang: Lang, key: TextKey): string[] {
  return DICTIONARY[lang][key].split(" · ");
}

export const LANG_STORAGE_KEY = "finzy-dashboard-lang";

export function isLang(value: unknown): value is Lang {
  return value === "it" || value === "en";
}

/** The saved choice, else the account's language, else the browser's. */
export function initialLang(saved: string | null, account: string | null | undefined, browser: string | undefined): Lang {
  if (isLang(saved)) return saved;
  const acc = account?.slice(0, 2).toLowerCase();
  if (isLang(acc)) return acc;
  return browser?.toLowerCase().startsWith("it") ? "it" : browser ? "en" : "it";
}
