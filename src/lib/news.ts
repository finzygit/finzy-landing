/**
 * Ultime notizie pubblicate nell'app, per le card del hero.
 *
 * Arrivano dall'API pubblica del backend Finzy, la stessa che usa l'app. Nel
 * sito non c'è nessun titolo scritto a mano.
 */

export type NewsItem = {
  id: number;
  /** Il backend traduce i titoli solo in italiano e in inglese. */
  title: { it: string; en: string };
  /** Data di pubblicazione nell'app, in ISO 8601. */
  publishedAt: string;
  /** Testata da citare accanto alla notizia, ad esempio "MTNewswires". */
  source: string;
};

const API_URL = "https://console.finzyapp.com/api/blogs";

/** Quante notizie ruotano nel hero, divise tra le card. */
const NEWS_COUNT = 6;

/** Ogni quanti secondi il sito rilegge le notizie. */
const REVALIDATE_SECONDS = 300;

/** Campi di /api/blogs che servono alle card. */
type ApiBlog = {
  id: number;
  title: { it?: string | null; en?: string | null } | null;
  created_at: string | null;
  testata: { name: string | null } | null;
};

/**
 * Le notizie più recenti, dalla più nuova.
 *
 * Senza `latest=true`: quel filtro tiene solo le ultime 24 ore e resta vuoto
 * dopo un weekend. La lista base è già ordinata per data e copre 30 giorni.
 *
 * Non lancia mai. Se l'API non risponde torna una lista vuota e le card
 * spariscono fino alla rigenerazione successiva.
 */
export async function getLatestNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${API_URL}?limit=${NEWS_COUNT}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body: { data?: unknown } = await res.json();
    const rows = Array.isArray(body.data) ? (body.data as ApiBlog[]) : [];

    return rows.flatMap((row) => {
      const it = row.title?.it?.trim() || row.title?.en?.trim();
      const en = row.title?.en?.trim() || it;
      if (!it || !en || !row.created_at) return [];
      return [
        {
          id: row.id,
          title: { it, en },
          publishedAt: row.created_at,
          source: row.testata?.name ?? "",
        },
      ];
    });
  } catch (error) {
    console.error("[news] notizie non disponibili:", error);
    return [];
  }
}
