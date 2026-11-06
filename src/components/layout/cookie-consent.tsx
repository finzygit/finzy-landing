"use client";

import Script, { type ScriptProps } from "next/script";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  buildCsConfiguration,
  cookiePolicyIdFor,
  cookiePolicyUrl,
  grantedPurposes,
  parseIubendaConfig,
  wasWithdrawn,
  type IubendaPreference,
  type Purpose,
} from "@/lib/consent";
import { useLanguage } from "@/lib/i18n";

/**
 * Banner dei cookie di iubenda (MOB-815).
 *
 * Le variabili NEXT_PUBLIC_ entrano nel bundle al momento della build: vanno
 * scritte per intero qui, e cambiarle su Vercel richiede un nuovo deploy.
 * Senza `NEXT_PUBLIC_IUBENDA_SITE_ID` questo file non carica nulla.
 */
const CONFIG = parseIubendaConfig({
  siteId: process.env.NEXT_PUBLIC_IUBENDA_SITE_ID,
  cookiePolicyIds: process.env.NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_IDS,
});

const IUBENDA_SCRIPT = "https://cdn.iubenda.com/cs/iubenda_cs.js";

type IubendaGlobal = {
  csConfiguration?: unknown;
  cs?: { api?: { openPreferences?: () => void } };
};

function iubenda(): IubendaGlobal | undefined {
  return (window as unknown as { _iub?: IubendaGlobal })._iub;
}

type ConsentState = {
  /** Vero se il banner è configurato (c'è il Site ID). */
  configured: boolean;
  /** Le finalità a cui il visitatore ha detto sì. Il necessario c'è sempre. */
  granted: ReadonlySet<Purpose>;
};

const NECESSARY_ONLY: ReadonlySet<Purpose> = new Set<Purpose>(["necessary"]);

const ConsentContext = createContext<ConsentState>({
  configured: false,
  granted: NECESSARY_ONLY,
});

export function useConsent(): ConsentState {
  return useContext(ConsentContext);
}

/**
 * Carica iubenda e tiene il consenso del visitatore. Va dentro
 * `LanguageProvider`, perché il banner parla la lingua della pagina.
 */
export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const [granted, setGranted] = useState<ReadonlySet<Purpose>>(NECESSARY_ONLY);
  const [configWritten, setConfigWritten] = useState(false);
  const grantedRef = useRef<ReadonlySet<Purpose>>(NECESSARY_ONLY);
  const loaded = useRef(false);

  // La configurazione si scrive prima che lo script di iubenda la legga.
  // Si riscrive quando la lingua della pagina si risolve (al primo giro vale
  // quella di default), finché lo script non è caricato: dopo, iubenda l'ha
  // già letta.
  useEffect(() => {
    if (!CONFIG || loaded.current) return;
    const w = window as unknown as { _iub?: IubendaGlobal & unknown[] };
    w._iub = w._iub || ([] as unknown as IubendaGlobal & unknown[]);
    w._iub.csConfiguration = {
      ...buildCsConfiguration(CONFIG, lang),
      callback: {
        // Parte al caricamento se la scelta c'è già, e a ogni nuova scelta.
        onPreferenceExpressedOrNotNeeded: (preference: IubendaPreference) => {
          const next = grantedPurposes(preference);
          // Uno script già partito non si può spegnere: se il visitatore
          // ritira un consenso si ricarica la pagina, e lo script non riparte.
          if (wasWithdrawn(grantedRef.current, next)) {
            window.location.reload();
            return;
          }
          grantedRef.current = next;
          setGranted(next);
        },
      },
    };
    setConfigWritten(true);
  }, [lang]);

  return (
    <ConsentContext.Provider value={{ configured: CONFIG !== null, granted }}>
      {children}
      {configWritten && (
        <Script
          id="iubenda-cs"
          src={IUBENDA_SCRIPT}
          strategy="afterInteractive"
          onLoad={() => {
            loaded.current = true;
          }}
        />
      )}
    </ConsentContext.Provider>
  );
}

/**
 * Uno script di terze parti che parte solo dopo il consenso alla sua
 * finalità, per esempio:
 *
 *   <ConsentScript purpose="measurement" src="https://.../analytics.js" />
 *
 * Oggi il sito non ne carica nessuno. Ogni script non necessario che si
 * aggiunge in futuro passa da qui, mai da `<Script>` diretto.
 */
export function ConsentScript({
  purpose,
  ...props
}: { purpose: Exclude<Purpose, "necessary"> } & ScriptProps) {
  const { granted } = useConsent();
  if (!granted.has(purpose)) return null;
  return <Script {...props} />;
}

/** I link "Cookie policy" e "Preferenze cookie" del footer. */
export function CookieLinks({
  className,
  labels,
}: {
  className?: string;
  labels: { cookiePolicy: string; cookiePreferences: string };
}) {
  const { lang } = useLanguage();
  if (!CONFIG) return null;
  const policyUrl = cookiePolicyUrl(cookiePolicyIdFor(CONFIG, lang));
  return (
    <>
      <a
        href={policyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {labels.cookiePolicy}
      </a>
      {/* Riapre il pannello di iubenda: è il modo per cambiare idea o
          ritirare il consenso, che la legge chiede facile quanto darlo. */}
      <button
        type="button"
        className={className}
        onClick={() => {
          const open = iubenda()?.cs?.api?.openPreferences;
          // Se iubenda non è ancora caricato, o un blocker lo ferma, il clic
          // apre almeno la cookie policy invece di non fare niente.
          if (open) open();
          else window.open(policyUrl, "_blank", "noopener,noreferrer");
        }}
      >
        {labels.cookiePreferences}
      </button>
    </>
  );
}
