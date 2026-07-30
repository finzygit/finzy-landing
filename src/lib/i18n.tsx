"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "it" | "es" | "fr" | "pt";

/** Elenco lingue per il selettore in header (nomi nativi, bandiera, sigla). */
export const LANGUAGES: { code: Lang; name: string; short: string; flag: string }[] = [
  { code: "en", name: "English", short: "EN", flag: "🇬🇧" },
  { code: "it", name: "Italiano", short: "IT", flag: "🇮🇹" },
  { code: "es", name: "Español", short: "ES", flag: "🇪🇸" },
  { code: "fr", name: "Français", short: "FR", flag: "🇫🇷" },
  { code: "pt", name: "Português", short: "PT", flag: "🇵🇹" },
];

const it = {
  nav: {
    open: "Apri menu",
    close: "Chiudi menu",
    dialog: "Menu di navigazione",
    links: [
      { label: "Home", href: "/" },
      { label: "Cos'è Finzy", href: "#cos-e-finzy" },
      { label: "Funzionalità", href: "#funzionalita" },
      { label: "Come funziona", href: "#processo" },
      { label: "Learning", href: "#learning" },
      { label: "Prezzi", href: "#prezzi" },
      { label: "Contatti", href: "#contatti" },
    ],
    cta: "Richiedi l'accesso",
  },
  giveaway: {
    overline: "Giveaway ufficiale",
    title: "Vinci un iPhone 17 Pro",
    bodyPre: "Il ",
    highlight: "10.000° abbonato Unlimited",
    bodyPost:
      " vince un iPhone 17 Pro — assegnato per ordine di sottoscrizione, verificato pubblicamente.",
    cta: "Partecipa anche tu",
    fine: "Concorso soggetto a regolamento ufficiale. Termini e condizioni applicabili.",
    close: "Chiudi",
    bannerPre: "Il ",
    bannerPost:
      " vince un iPhone 17 Pro. Il vincitore è determinato dall'ordine cronologico di sottoscrizione dell'abbonamento Unlimited, verificato e annunciato pubblicamente.",
    rulesLabel: "Regolamento del concorso",
    rules:
      "Vince l'utente numero 10.000 che attiva l'abbonamento Unlimited su Finzy, individuato in base all'ordine cronologico di sottoscrizione. Il vincitore sarà contattato via email e annunciato pubblicamente. Concorso soggetto a termini e condizioni completi.",
  },
  hero: {
    cards: [
      {
        label: "Segnali",
        titles: [
          "Leggi il mercato in pochi secondi.",
          "Anticipa il movimento prima che accada.",
          "Agisci sul vantaggio, non sul rumore.",
        ],
      },
      {
        label: "Mercati",
        titles: [
          "Un feed, ogni asset.",
          "Opera su qualsiasi mercato, all'istante.",
          "Dalla notizia all'ordine, in un lampo.",
        ],
      },
    ],
    stats: [
      { value: "2000+", label: "notizie selezionate" },
      { value: "60 sec", label: "tempo di lettura" },
      { value: "1 min", label: "tempo di aggiornamento" },
      { value: "8+", label: "ottimizzazione pipeline" },
    ],
    features: [
      {
        title: "Segnali in tempo reale",
        body: "Segnali di mercato dal vivo estratti da migliaia di fonti, distillati in un'unica vista chiara.",
      },
      {
        title: "Riassunti intelligenti",
        body: "Riassunti generati dall'IA che trasformano notizie finanziarie complesse in linguaggio semplice in pochi secondi.",
      },
      {
        title: "Feed personalizzato",
        body: "Un feed su misura per i tuoi interessi — segui gli asset e i mercati che ti stanno a cuore.",
      },
      {
        title: "Prezzi in tempo reale",
        body: "Monitora i prezzi dei titoli in tempo reale e non perdere mai un movimento di mercato.",
      },
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
  features: {
    overline: "Funzionalità",
    title: "Tutto ciò che ti serve, in un'app",
    subtitle: "Dalle notizie agli avvisi sui prezzi: gli strumenti giusti per decidere con lucidità.",
    items: [
      {
        title: "Notizie personalizzate",
        body: "Notizie finanziarie su misura e aggiornamenti rapidi, facili da comprendere e seguire.",
      },
      {
        title: "Feed personalizzabile",
        body: "Cura un feed basato sui tuoi interessi e ricevi notifiche in tempo reale sui temi rilevanti.",
      },
      {
        title: "Monitoraggio intelligente",
        body: "Segui titoli e previsioni di mercato per cogliere le opportunità al minuto giusto.",
      },
      {
        title: "Riassunti AI",
        body: "Dal linguaggio tecnico alle parole chiare: comprendi ogni concetto in 60 secondi.",
      },
      {
        title: "Tempo reale",
        body: "Aggiornamenti ogni minuto per non perdere nessuna occasione nel mercato.",
      },
      {
        title: "Accessibile a tutti",
        body: "Finzy rende la finanza chiara anche a chi non è esperto del settore.",
      },
    ],
  },
  process: {
    overline: "Processo",
    title: "Come funziona Finzy",
    subtitle: "Quattro passi verso la finanza semplificata.",
    steps: [
      {
        title: "Crea il tuo account",
        body: "Registrati in pochi secondi con email o Google. Niente carte di credito per iniziare.",
      },
      {
        title: "Configura il feed",
        body: "Scegli i mercati, i titoli e i temi che ti interessano. Finzy si adatta ai tuoi interessi.",
      },
      {
        title: "Ricevi segnali",
        body: "Notifiche in tempo reale sulle opportunità e sui movimenti rilevanti dei tuoi titoli.",
      },
      {
        title: "Agisci con fiducia",
        body: "Riassunti AI chiari e dati aggiornati al minuto per decidere con sicurezza.",
      },
    ],
  },
  learning: {
    overline: "Learning",
    title: "Impara con Finzy",
    subtitle: "Impara la finanza mentre navighi. Senza noiosi corsi universitari.",
    cards: [
      {
        title: "Guide finanziarie",
        body: "Articoli chiari su concetti chiave: azioni, obbligazioni, ETF, diversificazione e gestione del rischio.",
        badge: "50+ guide",
      },
      {
        title: "Video lezioni",
        body: "Brevi video di 3-5 minuti che spiegano strategie di investimento e analisi di mercato passo dopo passo.",
        badge: "120+ video",
      },
      {
        title: "Corsi base",
        body: "Corsi strutturati per principianti: dalla terminologia di base alla costruzione di un portafoglio.",
        badge: "8 corsi",
      },
    ],
  },
  testimonials: {
    overline: "Testimonianze",
    title: "Cosa dicono i nostri utenti",
    subtitle: "Migliaia di persone usano Finzy ogni giorno per restare sul pezzo.",
    items: [
      {
        quote:
          "Finzy mi fa risparmiare ore al giorno. I riassunti AI sono chiarissimi e finalmente capisco cosa succede nei mercati.",
        name: "Alessandro M.",
      },
      {
        quote:
          "Il feed personalizzato mi tiene aggiornato solo sulle notizie che mi interessano. Zero rumore, solo ciò che conta.",
        name: "Carlo C.",
      },
      {
        quote:
          "Le segnalazioni in tempo reale sono impressionanti. Catturo le opportunità prima che gli altri le vedano.",
        name: "Giacomo M.",
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
      { value: "250+", label: "notizie selezionate per te" },
      { value: "60 sec", label: "Per restare aggiornato" },
      { value: "12+", label: "Mercati monitorati" },
    ],
    cardLabel: "Notizie al giorno",
    cardValue: "1500+",
    imageAlt: "Formazione di coralli che ricorda l'andamento dei mercati",
  },
  pricing: {
    overline: "Prezzi",
    title: "Scegli il piano giusto per te",
    monthly: "Mensile",
    annual: "Annuale",
    annualBadge: "-20%",
    perMonth: "/mese",
    billedAnnually: "fatturato annualmente",
    popular: "Più popolare",
    plans: [
      {
        tagline: "Per iniziare a esplorare i mercati",
        features: [
          "Feed di base personalizzato",
          "Segnali ritardati di 15 min",
          "3 titoli monitorati",
          "Riassunti giornalieri",
        ],
        cta: "Inizia gratis",
      },
      {
        tagline: "Per chi vuole restare sempre avanti",
        features: [
          "Feed illimitato personalizzato",
          "Segnali real-time",
          "Titoli monitorati illimitati",
          "Riassunti AI istantanei",
          "Alert personalizzati",
          "Analisi tecnica avanzata",
        ],
        cta: "Prova 14 giorni",
      },
      {
        tagline: "Per team e istituzioni",
        features: [
          "Tutto il piano Premium",
          "API dedicata",
          "Supporto prioritario 24/7",
          "Dashboard team",
          "Onboarding personalizzato",
        ],
        cta: "Contattaci",
      },
    ],
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
    storesLabel: "Preferisci scaricare l'app?",
    privacyNote: "I tuoi dati sono al sicuro. Niente spam, mai.",
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
  nav: {
    open: "Open menu",
    close: "Close menu",
    dialog: "Navigation menu",
    links: [
      { label: "Home", href: "/" },
      { label: "What is Finzy", href: "#cos-e-finzy" },
      { label: "Features", href: "#funzionalita" },
      { label: "How it works", href: "#processo" },
      { label: "Learning", href: "#learning" },
      { label: "Pricing", href: "#prezzi" },
      { label: "Contact", href: "#contatti" },
    ],
    cta: "Request access",
  },
  giveaway: {
    overline: "Official giveaway",
    title: "Win an iPhone 17 Pro",
    bodyPre: "The ",
    highlight: "10,000th Unlimited subscriber",
    bodyPost:
      " wins an iPhone 17 Pro — awarded by subscription order and verified publicly.",
    cta: "Take part",
    fine: "Subject to official rules. Terms and conditions apply.",
    close: "Close",
    bannerPre: "The ",
    bannerPost:
      " wins an iPhone 17 Pro. The winner is determined by chronological Unlimited subscription order, verified and announced publicly.",
    rulesLabel: "Giveaway rules",
    rules:
      "The 10,000th user to activate the Unlimited subscription on Finzy wins, determined by chronological subscription order. The winner will be contacted by email and announced publicly. Subject to full terms and conditions.",
  },
  hero: {
    cards: [
      {
        label: "Signals",
        titles: [
          "Read the tape in seconds.",
          "Spot the move before it happens.",
          "Act on edge, not noise.",
        ],
      },
      {
        label: "Markets",
        titles: [
          "One feed, every asset.",
          "Trade any market, instantly.",
          "From news to order, fast.",
        ],
      },
    ],
    stats: [
      { value: "2000+", label: "news selection" },
      { value: "60 sec", label: "reading time" },
      { value: "1 min", label: "updated time" },
      { value: "8+", label: "pipeline optimisation" },
    ],
    features: [
      {
        title: "Real-time Signals",
        body: "Live market signals extracted from thousands of sources, distilled into one clear view.",
      },
      {
        title: "Smart Summaries",
        body: "AI-powered summaries turn complex financial news into plain language in seconds.",
      },
      {
        title: "Personalized Feed",
        body: "A feed tailored to your interests — follow the assets and markets you care about.",
      },
      {
        title: "Live Prices",
        body: "Monitor stock prices in real time and never miss a market move.",
      },
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
  features: {
    overline: "Features",
    title: "Everything you need, in one app",
    subtitle: "From news to price alerts: the right tools to decide with clarity.",
    items: [
      {
        title: "Personalized news",
        body: "Tailored financial news and fast updates, easy to understand and follow.",
      },
      {
        title: "Customizable feed",
        body: "Curate a feed based on your interests and get real-time alerts on the topics that matter.",
      },
      {
        title: "Smart monitoring",
        body: "Track stocks and market forecasts to seize opportunities at just the right moment.",
      },
      {
        title: "AI summaries",
        body: "From technical jargon to plain words: understand every concept in 60 seconds.",
      },
      {
        title: "Real time",
        body: "Updates every minute so you never miss an opportunity in the market.",
      },
      {
        title: "Accessible to everyone",
        body: "Finzy makes finance clear even for those who aren't industry experts.",
      },
    ],
  },
  process: {
    overline: "Process",
    title: "How Finzy works",
    subtitle: "Four steps to simplified finance.",
    steps: [
      {
        title: "Create your account",
        body: "Sign up in seconds with email or Google. No credit card to get started.",
      },
      {
        title: "Set up your feed",
        body: "Choose the markets, stocks and topics you care about. Finzy adapts to your interests.",
      },
      {
        title: "Get signals",
        body: "Real-time notifications on opportunities and relevant moves in your stocks.",
      },
      {
        title: "Act with confidence",
        body: "Clear AI summaries and up-to-the-minute data to decide with confidence.",
      },
    ],
  },
  learning: {
    overline: "Learning",
    title: "Learn with Finzy",
    subtitle: "Learn finance while you browse. No boring university courses.",
    cards: [
      {
        title: "Financial guides",
        body: "Clear articles on key concepts: stocks, bonds, ETFs, diversification and risk management.",
        badge: "50+ guides",
      },
      {
        title: "Video lessons",
        body: "Short 3–5 minute videos explaining investment strategies and market analysis step by step.",
        badge: "120+ videos",
      },
      {
        title: "Basic courses",
        body: "Structured courses for beginners: from basic terminology to building a portfolio.",
        badge: "8 courses",
      },
    ],
  },
  testimonials: {
    overline: "Testimonials",
    title: "What our users say",
    subtitle: "Thousands of people rely on Finzy every day to stay on top of the markets.",
    items: [
      {
        quote:
          "Finzy saves me hours every day. The AI summaries are crystal clear and I finally understand what's happening in the markets.",
        name: "Alessandro M.",
      },
      {
        quote:
          "The personalized feed keeps me updated only on the news I care about. Zero noise, only what matters.",
        name: "Carlo C.",
      },
      {
        quote:
          "The real-time alerts are impressive. I catch opportunities before others even see them.",
        name: "Giacomo M.",
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
      { value: "250+", label: "news selected for you" },
      { value: "60 sec", label: "To stay up to date" },
      { value: "12+", label: "Markets monitored" },
    ],
    cardLabel: "News per day",
    cardValue: "1500+",
    imageAlt: "Coral formation echoing the movement of the markets",
  },
  pricing: {
    overline: "Pricing",
    title: "Choose the right plan for you",
    monthly: "Monthly",
    annual: "Annual",
    annualBadge: "-20%",
    perMonth: "/mo",
    billedAnnually: "billed annually",
    popular: "Most popular",
    plans: [
      {
        tagline: "To start exploring the markets",
        features: [
          "Personalized basic feed",
          "Signals delayed by 15 min",
          "3 monitored stocks",
          "Daily summaries",
        ],
        cta: "Start free",
      },
      {
        tagline: "For those who want to stay ahead",
        features: [
          "Unlimited personalized feed",
          "Real-time signals",
          "Unlimited monitored stocks",
          "Instant AI summaries",
          "Custom alerts",
          "Advanced technical analysis",
        ],
        cta: "Try 14 days",
      },
      {
        tagline: "For teams and institutions",
        features: [
          "Everything in Premium",
          "Dedicated API",
          "Priority 24/7 support",
          "Team dashboard",
          "Personalized onboarding",
        ],
        cta: "Contact us",
      },
    ],
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
    storesLabel: "Prefer to download the app?",
    privacyNote: "Your data is safe. No spam, ever.",
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

const es: Dict = {
  nav: {
    open: "Abrir menú",
    close: "Cerrar menú",
    dialog: "Menú de navegación",
    links: [
      { label: "Inicio", href: "/" },
      { label: "¿Qué es Finzy?", href: "#cos-e-finzy" },
      { label: "Funciones", href: "#funzionalita" },
      { label: "Cómo funciona", href: "#processo" },
      { label: "Learning", href: "#learning" },
      { label: "Precios", href: "#prezzi" },
      { label: "Contacto", href: "#contatti" },
    ],
    cta: "Solicitar acceso",
  },
  giveaway: {
    overline: "Sorteo oficial",
    title: "Gana un iPhone 17 Pro",
    bodyPre: "El ",
    highlight: "suscriptor Unlimited n.º 10.000",
    bodyPost:
      " gana un iPhone 17 Pro — asignado por orden de suscripción y verificado públicamente.",
    cta: "Participa tú también",
    fine: "Sujeto a las bases oficiales. Términos y condiciones aplicables.",
    close: "Cerrar",
    bannerPre: "El ",
    bannerPost:
      " gana un iPhone 17 Pro. El ganador se determina por orden cronológico de suscripción a Unlimited, verificado y anunciado públicamente.",
    rulesLabel: "Bases del sorteo",
    rules:
      "Gana el usuario número 10.000 que activa la suscripción Unlimited en Finzy, determinado por el orden cronológico de suscripción. El ganador será contactado por email y anunciado públicamente. Sujeto a los términos y condiciones completos.",
  },
  hero: {
    cards: [
      {
        label: "Señales",
        titles: [
          "Lee el mercado en segundos.",
          "Anticipa el movimiento antes de que ocurra.",
          "Actúa con ventaja, no con ruido.",
        ],
      },
      {
        label: "Mercados",
        titles: [
          "Un feed, cada activo.",
          "Opera en cualquier mercado, al instante.",
          "De la noticia a la orden, al momento.",
        ],
      },
    ],
    stats: [
      { value: "2000+", label: "selección de noticias" },
      { value: "60 sec", label: "tiempo de lectura" },
      { value: "1 min", label: "tiempo de actualización" },
      { value: "8+", label: "optimización de pipeline" },
    ],
    features: [
      {
        title: "Señales en tiempo real",
        body: "Señales de mercado en vivo extraídas de miles de fuentes, destiladas en una única vista clara.",
      },
      {
        title: "Resúmenes inteligentes",
        body: "Resúmenes impulsados por IA que convierten noticias financieras complejas en lenguaje sencillo en segundos.",
      },
      {
        title: "Feed personalizado",
        body: "Un feed adaptado a tus intereses: sigue los activos y mercados que te importan.",
      },
      {
        title: "Precios en vivo",
        body: "Monitorea los precios de las acciones en tiempo real y no te pierdas ningún movimiento del mercado.",
      },
    ],
  },
  about: {
    title: "¿Qué es Finzy?",
    subtitle: "Tu ventana simple y personalizada al mundo de las finanzas",
    cards: [
      {
        title: "El problema",
        body: "Las noticias financieras suelen ser complicadas, llenas de jerga y dispersas. Mantenerse al día sin perderse lleva demasiado tiempo, y las oportunidades del mercado pasan rápido.",
      },
      {
        title: "La solución Finzy",
        body: "Resúmenes inteligentes generados con la tecnología más avanzada, un feed personalizado según tus intereses y seguimiento de valores en tiempo real. Las finanzas, por fin accesibles para todos.",
      },
    ],
  },
  features: {
    overline: "Funciones",
    title: "Todo lo que necesitas, en una app",
    subtitle: "De las noticias a las alertas de precio: las herramientas para decidir con claridad.",
    items: [
      {
        title: "Noticias personalizadas",
        body: "Noticias financieras a medida y actualizaciones rápidas, fáciles de entender y seguir.",
      },
      {
        title: "Feed personalizable",
        body: "Crea un feed según tus intereses y recibe notificaciones en tiempo real sobre los temas relevantes.",
      },
      {
        title: "Monitoreo inteligente",
        body: "Sigue valores y previsiones del mercado para aprovechar las oportunidades en el momento justo.",
      },
      {
        title: "Resúmenes con IA",
        body: "Del lenguaje técnico a las palabras claras: entiende cada concepto en 60 segundos.",
      },
      {
        title: "Tiempo real",
        body: "Actualizaciones cada minuto para no perder ninguna oportunidad en el mercado.",
      },
      {
        title: "Accesible para todos",
        body: "Finzy hace que las finanzas sean claras incluso para quienes no son expertos del sector.",
      },
    ],
  },
  process: {
    overline: "Proceso",
    title: "Cómo funciona Finzy",
    subtitle: "Cuatro pasos hacia las finanzas simplificadas.",
    steps: [
      {
        title: "Crea tu cuenta",
        body: "Regístrate en segundos con email o Google. Sin tarjeta de crédito para empezar.",
      },
      {
        title: "Configura tu feed",
        body: "Elige los mercados, valores y temas que te interesan. Finzy se adapta a tus intereses.",
      },
      {
        title: "Recibe señales",
        body: "Notificaciones en tiempo real sobre oportunidades y movimientos relevantes de tus valores.",
      },
      {
        title: "Actúa con confianza",
        body: "Resúmenes con IA claros y datos al minuto para decidir con seguridad.",
      },
    ],
  },
  learning: {
    overline: "Learning",
    title: "Aprende con Finzy",
    subtitle: "Aprende finanzas mientras navegas. Sin aburridos cursos universitarios.",
    cards: [
      {
        title: "Guías financieras",
        body: "Artículos claros sobre conceptos clave: acciones, bonos, ETF, diversificación y gestión del riesgo.",
        badge: "50+ guías",
      },
      {
        title: "Videolecciones",
        body: "Vídeos breves de 3-5 minutos que explican estrategias de inversión y análisis de mercado paso a paso.",
        badge: "120+ vídeos",
      },
      {
        title: "Cursos básicos",
        body: "Cursos estructurados para principiantes: desde la terminología básica hasta construir una cartera.",
        badge: "8 cursos",
      },
    ],
  },
  testimonials: {
    overline: "Testimonios",
    title: "Lo que dicen nuestros usuarios",
    subtitle: "Miles de personas usan Finzy cada día para estar al día de los mercados.",
    items: [
      {
        quote:
          "Finzy me ahorra horas cada día. Los resúmenes con IA son clarísimos y por fin entiendo lo que pasa en los mercados.",
        name: "Alessandro M.",
      },
      {
        quote:
          "El feed personalizado me mantiene al día solo con las noticias que me interesan. Cero ruido, solo lo que importa.",
        name: "Carlo C.",
      },
      {
        quote:
          "Las alertas en tiempo real son impresionantes. Capto las oportunidades antes de que los demás las vean.",
        name: "Giacomo M.",
      },
    ],
  },
  sources: {
    title: "Noticias y datos de fuentes fiables",
    subtitle: "Todo lo que necesitas saber, de fuentes verificadas.",
  },
  story: {
    overline: "Nuestra historia",
    titleLine1: "La especulación,",
    titleLine2: "hecha simple",
    body: "Creamos finzy para hacer que la especulación sea sencilla. Señales inteligentes, datos de flujo en tiempo real y la calma para mantenerte firme cuando el mercado se acelera.",
    stats: [
      { value: "250+", label: "noticias seleccionadas para ti" },
      { value: "60 sec", label: "Para estar al día" },
      { value: "12+", label: "Mercados monitoreados" },
    ],
    cardLabel: "Noticias al día",
    cardValue: "1500+",
    imageAlt: "Formación de coral que evoca el movimiento de los mercados",
  },
  pricing: {
    overline: "Precios",
    title: "Elige el plan adecuado para ti",
    monthly: "Mensual",
    annual: "Anual",
    annualBadge: "-20%",
    perMonth: "/mes",
    billedAnnually: "facturado anualmente",
    popular: "Más popular",
    plans: [
      {
        tagline: "Para empezar a explorar los mercados",
        features: [
          "Feed básico personalizado",
          "Señales con 15 min de retraso",
          "3 valores monitoreados",
          "Resúmenes diarios",
        ],
        cta: "Empieza gratis",
      },
      {
        tagline: "Para quienes quieren ir siempre por delante",
        features: [
          "Feed ilimitado personalizado",
          "Señales en tiempo real",
          "Valores monitoreados ilimitados",
          "Resúmenes con IA instantáneos",
          "Alertas personalizadas",
          "Análisis técnico avanzado",
        ],
        cta: "Prueba 14 días",
      },
      {
        tagline: "Para equipos e instituciones",
        features: [
          "Todo el plan Premium",
          "API dedicada",
          "Soporte prioritario 24/7",
          "Panel de equipo",
          "Onboarding personalizado",
        ],
        cta: "Contáctanos",
      },
    ],
  },
  contact: {
    overline: "Solicitar acceso",
    titleLine1: "Empieza a",
    titleLine2: "especular",
    name: { label: "Tu nombre", placeholder: "Nombre y apellido" },
    email: { label: "Email", placeholder: "hola@email.com" },
    goal: {
      label: "Tu objetivo",
      placeholder: "Cuéntanos tu estrategia de mercado…",
    },
    submit: "Solicitar acceso",
    storesLabel: "¿Prefieres descargar la app?",
    privacyNote: "Tus datos están seguros. Sin spam, nunca.",
    success:
      "¡Gracias! Hemos recibido tu solicitud, nos pondremos en contacto pronto.",
  },
  footer: {
    tagline:
      "Especula de forma sencilla. Señales inteligentes, flujo de mercado en tiempo real, todo en un solo lugar.",
    columns: [
      {
        title: "Explorar",
        links: [
          { label: "Inicio", href: "/" },
          { label: "¿Qué es Finzy?", href: "#cos-e-finzy" },
          { label: "Fuentes", href: "#fonti" },
          { label: "Nuestra historia", href: "#storia" },
        ],
      },
      {
        title: "Conecta",
        links: [
          { label: "Solicitar acceso", href: "#contatti" },
          { label: "Newsletter", href: "#" },
        ],
      },
    ],
    cta: "Empieza a especular",
    copyright: "© 2026 finzy. Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
  },
};

const fr: Dict = {
  nav: {
    open: "Ouvrir le menu",
    close: "Fermer le menu",
    dialog: "Menu de navigation",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Qu'est-ce que Finzy", href: "#cos-e-finzy" },
      { label: "Fonctionnalités", href: "#funzionalita" },
      { label: "Comment ça marche", href: "#processo" },
      { label: "Learning", href: "#learning" },
      { label: "Tarifs", href: "#prezzi" },
      { label: "Contact", href: "#contatti" },
    ],
    cta: "Demander l'accès",
  },
  giveaway: {
    overline: "Tirage officiel",
    title: "Gagnez un iPhone 17 Pro",
    bodyPre: "Le ",
    highlight: "10 000e abonné Unlimited",
    bodyPost:
      " gagne un iPhone 17 Pro — attribué selon l'ordre d'abonnement et vérifié publiquement.",
    cta: "Participez vous aussi",
    fine: "Soumis au règlement officiel. Conditions générales applicables.",
    close: "Fermer",
    bannerPre: "Le ",
    bannerPost:
      " gagne un iPhone 17 Pro. Le gagnant est déterminé selon l'ordre chronologique d'abonnement à Unlimited, vérifié et annoncé publiquement.",
    rulesLabel: "Règlement du jeu",
    rules:
      "Le 10 000e utilisateur à activer l'abonnement Unlimited sur Finzy gagne, déterminé selon l'ordre chronologique d'abonnement. Le gagnant sera contacté par e-mail et annoncé publiquement. Soumis aux conditions générales complètes.",
  },
  hero: {
    cards: [
      {
        label: "Signaux",
        titles: [
          "Lisez le marché en quelques secondes.",
          "Anticipez le mouvement avant qu'il n'arrive.",
          "Agissez sur l'avantage, pas sur le bruit.",
        ],
      },
      {
        label: "Marchés",
        titles: [
          "Un flux, chaque actif.",
          "Tradez n'importe quel marché, instantanément.",
          "De l'actualité à l'ordre, en un éclair.",
        ],
      },
    ],
    stats: [
      { value: "2000+", label: "sélection d'actualités" },
      { value: "60 sec", label: "temps de lecture" },
      { value: "1 min", label: "temps de mise à jour" },
      { value: "8+", label: "optimisation du pipeline" },
    ],
    features: [
      {
        title: "Signaux en temps réel",
        body: "Des signaux de marché en direct extraits de milliers de sources, distillés en une seule vue claire.",
      },
      {
        title: "Résumés intelligents",
        body: "Des résumés générés par l'IA transforment les actualités financières complexes en langage clair en quelques secondes.",
      },
      {
        title: "Flux personnalisé",
        body: "Un flux adapté à vos intérêts — suivez les actifs et les marchés qui comptent pour vous.",
      },
      {
        title: "Prix en direct",
        body: "Suivez les cours des actions en temps réel et ne manquez aucun mouvement du marché.",
      },
    ],
  },
  about: {
    title: "Qu'est-ce que Finzy ?",
    subtitle: "Votre fenêtre simple et personnalisée sur le monde de la finance",
    cards: [
      {
        title: "Le problème",
        body: "Les actualités financières sont souvent compliquées, pleines de jargon et dispersées. Rester à jour sans se perdre prend trop de temps — et les opportunités de marché passent vite.",
      },
      {
        title: "La solution Finzy",
        body: "Des résumés intelligents générés avec la technologie la plus avancée, un flux personnalisé selon vos intérêts et un suivi des titres en temps réel. La finance, enfin accessible à tous.",
      },
    ],
  },
  features: {
    overline: "Fonctionnalités",
    title: "Tout ce qu'il vous faut, dans une seule app",
    subtitle: "Des actualités aux alertes de prix : les bons outils pour décider avec clarté.",
    items: [
      {
        title: "Actualités personnalisées",
        body: "Des actualités financières sur mesure et des mises à jour rapides, faciles à comprendre et à suivre.",
      },
      {
        title: "Flux personnalisable",
        body: "Composez un flux selon vos intérêts et recevez des notifications en temps réel sur les sujets pertinents.",
      },
      {
        title: "Suivi intelligent",
        body: "Suivez les titres et les prévisions de marché pour saisir les opportunités au bon moment.",
      },
      {
        title: "Résumés par IA",
        body: "Du jargon technique aux mots clairs : comprenez chaque concept en 60 secondes.",
      },
      {
        title: "Temps réel",
        body: "Des mises à jour chaque minute pour ne manquer aucune occasion sur le marché.",
      },
      {
        title: "Accessible à tous",
        body: "Finzy rend la finance claire, même pour ceux qui ne sont pas experts du secteur.",
      },
    ],
  },
  process: {
    overline: "Processus",
    title: "Comment fonctionne Finzy",
    subtitle: "Quatre étapes vers une finance simplifiée.",
    steps: [
      {
        title: "Créez votre compte",
        body: "Inscrivez-vous en quelques secondes avec e-mail ou Google. Aucune carte bancaire pour commencer.",
      },
      {
        title: "Configurez votre flux",
        body: "Choisissez les marchés, titres et thèmes qui vous intéressent. Finzy s'adapte à vos intérêts.",
      },
      {
        title: "Recevez des signaux",
        body: "Notifications en temps réel sur les opportunités et les mouvements pertinents de vos titres.",
      },
      {
        title: "Agissez en confiance",
        body: "Des résumés IA clairs et des données à la minute pour décider en toute confiance.",
      },
    ],
  },
  learning: {
    overline: "Learning",
    title: "Apprenez avec Finzy",
    subtitle: "Apprenez la finance en naviguant. Sans cours universitaires ennuyeux.",
    cards: [
      {
        title: "Guides financiers",
        body: "Des articles clairs sur les concepts clés : actions, obligations, ETF, diversification et gestion du risque.",
        badge: "50+ guides",
      },
      {
        title: "Cours vidéo",
        body: "De courtes vidéos de 3 à 5 minutes qui expliquent les stratégies d'investissement et l'analyse de marché pas à pas.",
        badge: "120+ vidéos",
      },
      {
        title: "Cours de base",
        body: "Des cours structurés pour débutants : de la terminologie de base à la construction d'un portefeuille.",
        badge: "8 cours",
      },
    ],
  },
  testimonials: {
    overline: "Témoignages",
    title: "Ce que disent nos utilisateurs",
    subtitle: "Des milliers de personnes utilisent Finzy chaque jour pour rester informées.",
    items: [
      {
        quote:
          "Finzy me fait gagner des heures chaque jour. Les résumés IA sont très clairs et je comprends enfin ce qui se passe sur les marchés.",
        name: "Alessandro M.",
      },
      {
        quote:
          "Le flux personnalisé me tient informé uniquement des actualités qui m'intéressent. Zéro bruit, seulement l'essentiel.",
        name: "Carlo C.",
      },
      {
        quote:
          "Les alertes en temps réel sont impressionnantes. Je saisis les opportunités avant que les autres ne les voient.",
        name: "Giacomo M.",
      },
    ],
  },
  sources: {
    title: "Actualités et données de sources fiables",
    subtitle: "Tout ce qu'il faut savoir, de sources vérifiées.",
  },
  story: {
    overline: "Notre histoire",
    titleLine1: "La spéculation,",
    titleLine2: "rendue simple",
    body: "Nous avons créé finzy pour rendre la spéculation simple. Des signaux intelligents, des données de flux en temps réel et le calme pour rester lucide quand le marché s'emballe.",
    stats: [
      { value: "250+", label: "actualités sélectionnées pour vous" },
      { value: "60 sec", label: "Pour rester à jour" },
      { value: "12+", label: "Marchés suivis" },
    ],
    cardLabel: "Actualités par jour",
    cardValue: "1500+",
    imageAlt: "Formation de corail évoquant le mouvement des marchés",
  },
  pricing: {
    overline: "Tarifs",
    title: "Choisissez le plan qu'il vous faut",
    monthly: "Mensuel",
    annual: "Annuel",
    annualBadge: "-20%",
    perMonth: "/mois",
    billedAnnually: "facturé annuellement",
    popular: "Le plus populaire",
    plans: [
      {
        tagline: "Pour commencer à explorer les marchés",
        features: [
          "Flux de base personnalisé",
          "Signaux différés de 15 min",
          "3 titres suivis",
          "Résumés quotidiens",
        ],
        cta: "Commencer gratuitement",
      },
      {
        tagline: "Pour ceux qui veulent garder une longueur d'avance",
        features: [
          "Flux illimité personnalisé",
          "Signaux en temps réel",
          "Titres suivis illimités",
          "Résumés IA instantanés",
          "Alertes personnalisées",
          "Analyse technique avancée",
        ],
        cta: "Essayer 14 jours",
      },
      {
        tagline: "Pour les équipes et les institutions",
        features: [
          "Tout le plan Premium",
          "API dédiée",
          "Support prioritaire 24/7",
          "Tableau de bord d'équipe",
          "Onboarding personnalisé",
        ],
        cta: "Contactez-nous",
      },
    ],
  },
  contact: {
    overline: "Demander l'accès",
    titleLine1: "Commencez à",
    titleLine2: "spéculer",
    name: { label: "Votre nom", placeholder: "Nom et prénom" },
    email: { label: "Email", placeholder: "bonjour@email.com" },
    goal: {
      label: "Votre objectif",
      placeholder: "Parlez-nous de votre stratégie de marché…",
    },
    submit: "Demander l'accès",
    storesLabel: "Vous préférez télécharger l'app ?",
    privacyNote: "Vos données sont en sécurité. Jamais de spam.",
    success:
      "Merci ! Nous avons bien reçu votre demande — nous vous contacterons bientôt.",
  },
  footer: {
    tagline:
      "Spéculez simplement. Des signaux intelligents, un flux de marché en temps réel, le tout au même endroit.",
    columns: [
      {
        title: "Explorer",
        links: [
          { label: "Accueil", href: "/" },
          { label: "Qu'est-ce que Finzy", href: "#cos-e-finzy" },
          { label: "Sources", href: "#fonti" },
          { label: "Notre histoire", href: "#storia" },
        ],
      },
      {
        title: "Contact",
        links: [
          { label: "Demander l'accès", href: "#contatti" },
          { label: "Newsletter", href: "#" },
        ],
      },
    ],
    cta: "Commencez à spéculer",
    copyright: "© 2026 finzy. Tous droits réservés.",
    privacy: "Confidentialité",
    terms: "Conditions",
  },
};

const pt: Dict = {
  nav: {
    open: "Abrir menu",
    close: "Fechar menu",
    dialog: "Menu de navegação",
    links: [
      { label: "Início", href: "/" },
      { label: "O que é a Finzy", href: "#cos-e-finzy" },
      { label: "Funcionalidades", href: "#funzionalita" },
      { label: "Como funciona", href: "#processo" },
      { label: "Learning", href: "#learning" },
      { label: "Preços", href: "#prezzi" },
      { label: "Contacto", href: "#contatti" },
    ],
    cta: "Pedir acesso",
  },
  giveaway: {
    overline: "Sorteio oficial",
    title: "Ganha um iPhone 17 Pro",
    bodyPre: "O ",
    highlight: "10.000.º assinante Unlimited",
    bodyPost:
      " ganha um iPhone 17 Pro — atribuído por ordem de subscrição e verificado publicamente.",
    cta: "Participa também",
    fine: "Sujeito a regulamento oficial. Termos e condições aplicáveis.",
    close: "Fechar",
    bannerPre: "O ",
    bannerPost:
      " ganha um iPhone 17 Pro. O vencedor é determinado pela ordem cronológica de subscrição do Unlimited, verificado e anunciado publicamente.",
    rulesLabel: "Regulamento do sorteio",
    rules:
      "Ganha o utilizador número 10.000 que ativa a subscrição Unlimited na Finzy, determinado pela ordem cronológica de subscrição. O vencedor será contactado por email e anunciado publicamente. Sujeito aos termos e condições completos.",
  },
  hero: {
    cards: [
      {
        label: "Sinais",
        titles: [
          "Leia o mercado em segundos.",
          "Antecipe o movimento antes de acontecer.",
          "Aja com vantagem, não com ruído.",
        ],
      },
      {
        label: "Mercados",
        titles: [
          "Um feed, cada ativo.",
          "Negoceie qualquer mercado, ao instante.",
          "Da notícia à ordem, num relâmpago.",
        ],
      },
    ],
    stats: [
      { value: "2000+", label: "seleção de notícias" },
      { value: "60 sec", label: "tempo de leitura" },
      { value: "1 min", label: "tempo de atualização" },
      { value: "8+", label: "otimização de pipeline" },
    ],
    features: [
      {
        title: "Sinais em tempo real",
        body: "Sinais de mercado ao vivo extraídos de milhares de fontes, destilados numa única visão clara.",
      },
      {
        title: "Resumos inteligentes",
        body: "Resumos gerados por IA transformam notícias financeiras complexas em linguagem simples em segundos.",
      },
      {
        title: "Feed personalizado",
        body: "Um feed adaptado aos seus interesses — siga os ativos e mercados que lhe interessam.",
      },
      {
        title: "Preços ao vivo",
        body: "Acompanhe os preços das ações em tempo real e nunca perca um movimento do mercado.",
      },
    ],
  },
  about: {
    title: "O que é a Finzy?",
    subtitle: "A sua janela simples e personalizada para o mundo das finanças",
    cards: [
      {
        title: "O problema",
        body: "As notícias financeiras são muitas vezes complicadas, cheias de jargão e dispersas. Manter-se atualizado sem se perder exige demasiado tempo — e as oportunidades de mercado passam depressa.",
      },
      {
        title: "A solução Finzy",
        body: "Resumos inteligentes gerados com a tecnologia mais avançada, um feed personalizado aos seus interesses e monitorização de títulos em tempo real. As finanças, finalmente acessíveis a todos.",
      },
    ],
  },
  features: {
    overline: "Funcionalidades",
    title: "Tudo o que precisa, numa só app",
    subtitle: "Das notícias aos alertas de preço: as ferramentas certas para decidir com clareza.",
    items: [
      {
        title: "Notícias personalizadas",
        body: "Notícias financeiras à medida e atualizações rápidas, fáceis de compreender e seguir.",
      },
      {
        title: "Feed personalizável",
        body: "Crie um feed com base nos seus interesses e receba notificações em tempo real sobre os temas relevantes.",
      },
      {
        title: "Monitorização inteligente",
        body: "Acompanhe títulos e previsões de mercado para aproveitar as oportunidades no momento certo.",
      },
      {
        title: "Resumos com IA",
        body: "Do jargão técnico às palavras claras: compreenda cada conceito em 60 segundos.",
      },
      {
        title: "Tempo real",
        body: "Atualizações a cada minuto para nunca perder uma oportunidade no mercado.",
      },
      {
        title: "Acessível a todos",
        body: "A Finzy torna as finanças claras mesmo para quem não é especialista do setor.",
      },
    ],
  },
  process: {
    overline: "Processo",
    title: "Como funciona a Finzy",
    subtitle: "Quatro passos para finanças simplificadas.",
    steps: [
      {
        title: "Crie a sua conta",
        body: "Registe-se em segundos com email ou Google. Sem cartão de crédito para começar.",
      },
      {
        title: "Configure o seu feed",
        body: "Escolha os mercados, títulos e temas que lhe interessam. A Finzy adapta-se aos seus interesses.",
      },
      {
        title: "Receba sinais",
        body: "Notificações em tempo real sobre oportunidades e movimentos relevantes dos seus títulos.",
      },
      {
        title: "Aja com confiança",
        body: "Resumos com IA claros e dados ao minuto para decidir com segurança.",
      },
    ],
  },
  learning: {
    overline: "Learning",
    title: "Aprenda com o Finzy",
    subtitle: "Aprenda finanças enquanto navega. Sem cursos universitários aborrecidos.",
    cards: [
      {
        title: "Guias financeiros",
        body: "Artigos claros sobre conceitos-chave: ações, obrigações, ETF, diversificação e gestão de risco.",
        badge: "50+ guias",
      },
      {
        title: "Vídeo-aulas",
        body: "Vídeos curtos de 3-5 minutos que explicam estratégias de investimento e análise de mercado passo a passo.",
        badge: "120+ vídeos",
      },
      {
        title: "Cursos base",
        body: "Cursos estruturados para iniciantes: da terminologia básica à construção de uma carteira.",
        badge: "8 cursos",
      },
    ],
  },
  testimonials: {
    overline: "Testemunhos",
    title: "O que dizem os nossos utilizadores",
    subtitle: "Milhares de pessoas usam o Finzy todos os dias para se manterem a par.",
    items: [
      {
        quote:
          "A Finzy poupa-me horas por dia. Os resumos com IA são claríssimos e finalmente percebo o que acontece nos mercados.",
        name: "Alessandro M.",
      },
      {
        quote:
          "O feed personalizado mantém-me atualizado apenas sobre as notícias que me interessam. Zero ruído, só o que importa.",
        name: "Carlo C.",
      },
      {
        quote:
          "Os alertas em tempo real são impressionantes. Aproveito as oportunidades antes de os outros as verem.",
        name: "Giacomo M.",
      },
    ],
  },
  sources: {
    title: "Notícias e dados de fontes fiáveis",
    subtitle: "Tudo o que precisa de saber, de fontes verificadas.",
  },
  story: {
    overline: "A nossa história",
    titleLine1: "A especulação,",
    titleLine2: "tornada simples",
    body: "Criámos a finzy para tornar a especulação simples. Sinais inteligentes, dados de fluxo em tempo real e a calma para se manter firme quando o mercado acelera.",
    stats: [
      { value: "250+", label: "notícias selecionadas para si" },
      { value: "60 sec", label: "Para se manter atualizado" },
      { value: "12+", label: "Mercados monitorizados" },
    ],
    cardLabel: "Notícias por dia",
    cardValue: "1500+",
    imageAlt: "Formação de coral que evoca o movimento dos mercados",
  },
  pricing: {
    overline: "Preços",
    title: "Escolha o plano certo para si",
    monthly: "Mensal",
    annual: "Anual",
    annualBadge: "-20%",
    perMonth: "/mês",
    billedAnnually: "faturado anualmente",
    popular: "Mais popular",
    plans: [
      {
        tagline: "Para começar a explorar os mercados",
        features: [
          "Feed base personalizado",
          "Sinais com 15 min de atraso",
          "3 títulos monitorizados",
          "Resumos diários",
        ],
        cta: "Começar grátis",
      },
      {
        tagline: "Para quem quer estar sempre à frente",
        features: [
          "Feed ilimitado personalizado",
          "Sinais em tempo real",
          "Títulos monitorizados ilimitados",
          "Resumos com IA instantâneos",
          "Alertas personalizados",
          "Análise técnica avançada",
        ],
        cta: "Experimentar 14 dias",
      },
      {
        tagline: "Para equipas e instituições",
        features: [
          "Tudo do plano Premium",
          "API dedicada",
          "Suporte prioritário 24/7",
          "Dashboard de equipa",
          "Onboarding personalizado",
        ],
        cta: "Contacte-nos",
      },
    ],
  },
  contact: {
    overline: "Pedir acesso",
    titleLine1: "Comece a",
    titleLine2: "especular",
    name: { label: "O seu nome", placeholder: "Nome completo" },
    email: { label: "Email", placeholder: "ola@email.com" },
    goal: {
      label: "O seu objetivo",
      placeholder: "Fale-nos da sua estratégia de mercado…",
    },
    submit: "Pedir acesso",
    storesLabel: "Prefere descarregar a app?",
    privacyNote: "Os teus dados estão seguros. Nunca spam.",
    success:
      "Obrigado! Recebemos o seu pedido — entraremos em contacto em breve.",
  },
  footer: {
    tagline:
      "Especule de forma simples. Sinais inteligentes, fluxo de mercado em tempo real, tudo num só lugar.",
    columns: [
      {
        title: "Explorar",
        links: [
          { label: "Início", href: "/" },
          { label: "O que é a Finzy", href: "#cos-e-finzy" },
          { label: "Fontes", href: "#fonti" },
          { label: "A nossa história", href: "#storia" },
        ],
      },
      {
        title: "Ligar",
        links: [
          { label: "Pedir acesso", href: "#contatti" },
          { label: "Newsletter", href: "#" },
        ],
      },
    ],
    cta: "Comece a especular",
    copyright: "© 2026 finzy. Todos os direitos reservados.",
    privacy: "Privacidade",
    terms: "Termos",
  },
};

export const dictionaries: Record<Lang, Dict> = { en, it, es, fr, pt };

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLang(value: string | null): value is Lang {
  return LANGUAGES.some((l) => l.code === value);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    const stored = window.localStorage.getItem("finzy-lang");
    if (isLang(stored)) setLangState(stored);
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
