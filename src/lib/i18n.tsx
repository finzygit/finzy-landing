"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "it" | "en";

const it = {
  langLabel: "Lingua",
  langNames: { it: "Italiano", en: "English" },
  nav: {
    open: "Apri menu",
    close: "Chiudi menu",
    dialog: "Menu di navigazione",
    links: [
      { label: "Home", href: "/" },
      { label: "Cos'è Finzy", href: "#cos-e-finzy" },
      { label: "Fonti", href: "#fonti" },
      { label: "La nostra storia", href: "#storia" },
      { label: "Contatti", href: "#contatti" },
    ],
    cta: "Richiedi l'accesso",
  },
  hero: {
    cards: [
      { label: "Segnali", title: "Anticipa il movimento del mercato." },
      { label: "Mercati", title: "Segui qualsiasi mercato, all'istante." },
    ],
    stats: [
      { value: "200+", label: "notizie selezionate" },
      { value: "60 sec", label: "tempo di lettura" },
      { value: "1 min", label: "aggiornamento" },
    ],
  },
  about: {
    title: "Cos'è Finzy?",
    subtitle: "La tua finestra semplice e personalizzata sul mondo della finanza",
    cards: [
      {
        title: "Il problema",
        body: "Le notizie finanziarie sono spesso complicate, piene di gergo tecnico e dispersive. Restare aggiornati senza perdersi richiede troppo tempo — e le opportunità di mercato passano veloci.",
      },
      {
        title: "La soluzione Finzy",
        body: "Riassunti intelligenti generati con la tecnologia più avanzata, un feed personalizzato sui tuoi interessi e monitoraggio dei titoli in tempo reale. La finanza, finalmente accessibile a tutti.",
      },
    ],
  },
  sources: {
    title: "News e dati da fonti attendibili",
    subtitle: "Tutto ciò che serve sapere, da fonti verificate.",
  },
  story: {
    overline: "La nostra storia",
    titleLine1: "Speculazione,",
    titleLine2: "resa semplice",
    body: "Abbiamo creato finzy per rendere la speculazione semplice. Segnali intelligenti, dati di flusso in tempo reale e la calma per restare lucido quando il mercato accelera.",
    stats: [
      { value: "1500+", label: "Notizie analizzate" },
      { value: "60 sec", label: "Per restare aggiornato" },
      { value: "12+", label: "Mercati monitorati" },
    ],
    cardLabel: "Notizie al giorno",
    cardValue: "1500+",
    imageAlt: "Formazione di coralli che ricorda l'andamento dei mercati",
  },
  contact: {
    overline: "Richiedi l'accesso",
    titleLine1: "Inizia a",
    titleLine2: "speculare",
    name: { label: "Il tuo nome", placeholder: "Nome e cognome" },
    email: { label: "Email", placeholder: "nome@email.com" },
    goal: {
      label: "Il tuo obiettivo",
      placeholder: "Raccontaci la tua strategia di mercato…",
    },
    submit: "Richiedi l'accesso",
    success:
      "Grazie! Abbiamo ricevuto la tua richiesta — ti contatteremo presto.",
  },
  footer: {
    tagline:
      "Specula in modo semplice. Segnali intelligenti, flussi di mercato in tempo reale, tutto in un unico posto.",
    columns: [
      {
        title: "Esplora",
        links: [
          { label: "Home", href: "/" },
          { label: "Cos'è Finzy", href: "#cos-e-finzy" },
          { label: "Fonti", href: "#fonti" },
          { label: "La nostra storia", href: "#storia" },
        ],
      },
      {
        title: "Contatti",
        links: [
          { label: "Richiedi l'accesso", href: "#contatti" },
          { label: "Newsletter", href: "#" },
        ],
      },
    ],
    cta: "Inizia a speculare",
    copyright: "© 2026 finzy. Tutti i diritti riservati.",
    privacy: "Privacy",
    terms: "Termini",
  },
};

export type Dict = typeof it;

const en: Dict = {
  langLabel: "Language",
  langNames: { it: "Italiano", en: "English" },
  nav: {
    open: "Open menu",
    close: "Close menu",
    dialog: "Navigation menu",
    links: [
      { label: "Home", href: "/" },
      { label: "What is Finzy", href: "#cos-e-finzy" },
      { label: "Sources", href: "#fonti" },
      { label: "Our story", href: "#storia" },
      { label: "Contact", href: "#contatti" },
    ],
    cta: "Request access",
  },
  hero: {
    cards: [
      { label: "Signals", title: "Spot the move before it happens." },
      { label: "Markets", title: "Trade any market, instantly." },
    ],
    stats: [
      { value: "200+", label: "news selection" },
      { value: "60 sec", label: "reading time" },
      { value: "1 min", label: "updated time" },
    ],
  },
  about: {
    title: "What is Finzy?",
    subtitle: "Your simple, personalized window into the world of finance",
    cards: [
      {
        title: "The problem",
        body: "Financial news is often complicated, full of jargon and scattered. Staying up to date without getting lost takes too much time — and market opportunities move fast.",
      },
      {
        title: "The Finzy solution",
        body: "Smart summaries powered by the most advanced technology, a feed personalized to your interests and real-time monitoring of the stocks you follow. Finance, finally accessible to everyone.",
      },
    ],
  },
  sources: {
    title: "News and data from trusted sources",
    subtitle: "Everything you need to know, from verified sources.",
  },
  story: {
    overline: "Our story",
    titleLine1: "Speculation,",
    titleLine2: "made simple",
    body: "We built finzy to make speculation effortless. Smart signals, real-time flow data, and the calm to keep you steady when the market surges.",
    stats: [
      { value: "1500+", label: "News analyzed" },
      { value: "60 sec", label: "To stay up to date" },
      { value: "12+", label: "Markets monitored" },
    ],
    cardLabel: "News per day",
    cardValue: "1500+",
    imageAlt: "Coral formation echoing the movement of the markets",
  },
  contact: {
    overline: "Request access",
    titleLine1: "Start",
    titleLine2: "speculating",
    name: { label: "Your name", placeholder: "Full name" },
    email: { label: "Email", placeholder: "hello@email.com" },
    goal: {
      label: "Your goal",
      placeholder: "Tell us about your market strategy…",
    },
    submit: "Request access",
    success: "Thanks! We've received your request — we'll be in touch soon.",
  },
  footer: {
    tagline:
      "Speculate easily. Smart signals, real-time market flow, all in one place.",
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Home", href: "/" },
          { label: "What is Finzy", href: "#cos-e-finzy" },
          { label: "Sources", href: "#fonti" },
          { label: "Our story", href: "#storia" },
        ],
      },
      {
        title: "Connect",
        links: [
          { label: "Request access", href: "#contatti" },
          { label: "Newsletter", href: "#" },
        ],
      },
    ],
    cta: "Start speculating",
    copyright: "© 2026 finzy. All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
  },
};

export const dictionaries: Record<Lang, Dict> = { it, en };

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    const stored = window.localStorage.getItem("finzy-lang");
    if (stored === "it" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem("finzy-lang", next);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage deve essere usato dentro <LanguageProvider>");
  }
  return ctx;
}
