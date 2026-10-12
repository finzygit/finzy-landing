import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawler dei principali sistemi AI: addestramento, ricerca e richieste utente.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      // Già coperti da "*": la regola esplicita dichiara l'accesso senza
      // ambiguità. Non basta da sola: anche CDN e WAF devono lasciarli passare.
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
