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
      { label: "Fonti", href: "#fonti" },
      { label: "La nostra storia", href: "#storia" },
      { label: "Contatti", href: "#contatti" },
    ],
    cta: "Richiedi l'accesso",
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
    title: "Tutto ciò che ti serve, in un'app",
    subtitle: "La tua finestra semplice e personalizzata sul mondo della finanza.",
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
    title: "Everything you need, in one app",
    subtitle: "Your simple, personalized window into the world of finance.",
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

const es: Dict = {
  nav: {
    open: "Abrir menú",
    close: "Cerrar menú",
    dialog: "Menú de navegación",
    links: [
      { label: "Inicio", href: "/" },
      { label: "¿Qué es Finzy?", href: "#cos-e-finzy" },
      { label: "Fuentes", href: "#fonti" },
      { label: "Nuestra historia", href: "#storia" },
      { label: "Contacto", href: "#contatti" },
    ],
    cta: "Solicitar acceso",
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
    title: "Todo lo que necesitas, en una app",
    subtitle: "Tu ventana simple y personalizada al mundo de las finanzas.",
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
      { value: "1500+", label: "Noticias analizadas" },
      { value: "60 sec", label: "Para estar al día" },
      { value: "12+", label: "Mercados monitoreados" },
    ],
    cardLabel: "Noticias al día",
    cardValue: "1500+",
    imageAlt: "Formación de coral que evoca el movimiento de los mercados",
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
      { label: "Sources", href: "#fonti" },
      { label: "Notre histoire", href: "#storia" },
      { label: "Contact", href: "#contatti" },
    ],
    cta: "Demander l'accès",
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
    title: "Tout ce qu'il vous faut, dans une seule app",
    subtitle: "Votre fenêtre simple et personnalisée sur le monde de la finance.",
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
      { value: "1500+", label: "Actualités analysées" },
      { value: "60 sec", label: "Pour rester à jour" },
      { value: "12+", label: "Marchés suivis" },
    ],
    cardLabel: "Actualités par jour",
    cardValue: "1500+",
    imageAlt: "Formation de corail évoquant le mouvement des marchés",
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
      { label: "Fontes", href: "#fonti" },
      { label: "A nossa história", href: "#storia" },
      { label: "Contacto", href: "#contatti" },
    ],
    cta: "Pedir acesso",
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
    title: "Tudo o que precisa, numa só app",
    subtitle: "A sua janela simples e personalizada para o mundo das finanças.",
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
      { value: "1500+", label: "Notícias analisadas" },
      { value: "60 sec", label: "Para se manter atualizado" },
      { value: "12+", label: "Mercados monitorizados" },
    ],
    cardLabel: "Notícias por dia",
    cardValue: "1500+",
    imageAlt: "Formação de coral que evoca o movimento dos mercados",
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
