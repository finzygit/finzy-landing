import type { TickerQuote } from "@/lib/ticker";
import { cn } from "@/lib/utils";

/**
 * Secondi di scorrimento per quotazione. La durata cresce con la lista, così
 * la velocità resta la stessa quando la configurazione cambia.
 */
const SECONDS_PER_QUOTE = 4.5;

function formatPrice(q: TickerQuote) {
  const price = q.price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${q.currency}${price}`;
}

function QuoteItem({ q }: { q: TickerQuote }) {
  const up = q.change >= 0;
  return (
    <span className="inline-flex items-center gap-2 text-sm tracking-wide">
      <span className="font-medium text-muted-foreground">{q.name}</span>
      <span className="tabular-nums text-foreground/90">{formatPrice(q)}</span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 tabular-nums",
          up ? "text-positive" : "text-negative",
        )}
      >
        <span aria-hidden className="text-[0.65rem] leading-none">
          {up ? "▲" : "▼"}
        </span>
        {`${up ? "+" : ""}${q.change.toFixed(2)}%`}
      </span>
    </span>
  );
}

/**
 * Nastro scorrevole delle quotazioni (lista duplicata per il loop senza stacchi).
 * I valori sono quelli reali dell'app, letti lato server da getTickerQuotes().
 * Senza quotazioni non mostra nulla. Riusato nel hero e nella navbar sticky.
 * Rispetta prefers-reduced-motion (resta statico).
 */
export function TickerTrack({
  quotes,
  className,
}: {
  quotes: TickerQuote[];
  className?: string;
}) {
  if (quotes.length === 0) return null;

  return (
    <div
      className={cn("flex w-max animate-marquee gap-10", className)}
      style={{ animationDuration: `${quotes.length * SECONDS_PER_QUOTE}s` }}
    >
      {[...quotes, ...quotes].map((q, i) => (
        <QuoteItem key={`${q.symbol}-${i}`} q={q} />
      ))}
    </div>
  );
}

/** Barra superiore full-width con il ticker di mercato. */
export function MarketTicker({ quotes }: { quotes: TickerQuote[] }) {
  if (quotes.length === 0) return null;

  return (
    <div className="relative z-30 overflow-hidden border-b border-white/5 bg-[#05070a]">
      <TickerTrack quotes={quotes} className="py-3 pl-10" />
    </div>
  );
}
