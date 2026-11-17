"use client";

// MOB-1376 (boards ADM-NEWS-01-oggi-*): today per source. Counts since
// midnight, the hours, the latest arrivals and the AI summaries and images of
// the feed; an amber line when a source stops (decision 4).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { Banner, PageHead, Section, StateBlock } from "@/components/shell/parts";
import { AiLine, FeedChip, SourceCard, SummaryWord, Thumb } from "@/components/news/parts";
import styles from "@/components/news/news.module.css";
import { useConsole } from "@/lib/console";
import { hhmm, type Today } from "@/lib/news";

export default function TodayPage() {
  const { api, can } = useConsole();
  const [data, setData] = useState<Today | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      setData(await api.get<Today>("/news/today"));
      setState("ready");
    } catch {
      setState((s) => (s === "ready" ? s : "error"));
    }
  }, [api]);
  useEffect(() => {
    queueMicrotask(load);
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const stopped = data?.sources.filter((s) => s.state === "stop") ?? [];
  const nowHour = data ? Number(new Date(data.updated_at).toLocaleString("it-IT", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Rome" })) : undefined;
  const quiet = data?.sources.find((s) => s.state === "quiet");
  const weekend = data ? ["sab", "dom"].includes(new Date(data.updated_at).toLocaleDateString("it-IT", { weekday: "short", timeZone: "Europe/Rome" })) : false;

  return (
    <AdminFrame title="Oggi">
      <PageHead
        title="Oggi"
        sub={data ? `Le notizie arrivate oggi, fonte per fonte. Aggiornato alle ${hhmm(data.updated_at)}.` : "Le notizie arrivate oggi, fonte per fonte."}
        crumbs={["Notizie", "Oggi"]}
        actions={
          <Link className="btn" href="/news/articles?period=today">
            Articoli di oggi
          </Link>
        }
      />
      {state === "loading" ? (
        <StateBlock kind="loading" />
      ) : state === "error" || !data ? (
        <StateBlock kind="error" title="Non è stato possibile caricare la giornata" action={<button type="button" className="btn" onClick={() => (setState("loading"), load())}>Riprova</button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {stopped.map((s) => (
            <Banner key={s.id} action={can("console.spend.view") ? <Link href="/health">Salute dei servizi</Link> : undefined}>
              {s.name} non manda articoli dalle {hhmm(s.latest_at)}.
            </Banner>
          ))}
          {weekend && quiet ? (
            <Banner kind="info">Il sabato e la domenica {quiet.name} pubblica poco: nessun avviso fino a lunedì alle {quiet.working_hours[0]}:00.</Banner>
          ) : null}
          <div className={styles.grid2}>
            {data.sources.map((s) => (
              <SourceCard key={s.id} s={s} nowHour={nowHour} />
            ))}
          </div>
          <div className={styles.gridToday}>
            <Section title="Ultimi arrivati" action={<Link href="/news/articles?period=today">Tutti gli articoli di oggi ›</Link>}>
              {data.latest.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>Ancora nessun articolo oggi.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th scope="col">Titolo</th>
                      <th scope="col" style={{ width: 110 }}><span className="sr-only">Feed</span></th>
                      <th scope="col" style={{ width: 130 }}>Riassunto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.latest.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link href={`/news/articles/detail?id=${a.id}`} className={styles.titleCell} style={{ color: "var(--text)" }}>
                            <Thumb url={a.image_url} state={a.image} size={40} />
                            <span style={{ minWidth: 0 }}>
                              <strong>{a.title}</strong>
                              <span className="sub">{a.source?.name} · {hhmm(a.created_at)}</span>
                            </span>
                          </Link>
                        </td>
                        <td>{a.in_feed ? <FeedChip /> : null}</td>
                        <td><SummaryWord state={a.summary} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Section>
            <Section title="Riassunti e immagini AI di oggi">
              <AiLine label="Riassunti" c={data.ai.summaries} />
              <AiLine label="Immagini AI" c={data.ai.images} female />
              <p className="note">Solo gli articoli nel feed della Home ricevono riassunto e immagine: gli altri l’app non li mostra.</p>
            </Section>
          </div>
        </div>
      )}
    </AdminFrame>
  );
}
