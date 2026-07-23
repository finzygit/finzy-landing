"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Quote = {
  label: string;
  price: number;
  decimals: number;
  change: number; // variazione % giornaliera
};

const INITIAL: Quote[] = [
  { label: "FTSE 100", price: 8045.3, decimals: 2, change: 0.18 },
  { label: "DAX", price: 18432.1, decimals: 2, change: 0.25 },
  { label: "NIKKEI", price: 39512.0, decimals: 2, change: -0.33 },
  { label: "HANG SENG", price: 17654.2, decimals: 2, change: 0.55 },
  { label: "EUR/USD", price: 1.0892, decimals: 4, change: 0.08 },
  { label: "BTC/USD", price: 64210, decimals: 0, change: 1.24 },
  { label: "ETH/USD", price: 3412, decimals: 0, change: 0.87 },
  { label: "GOLD", price: 2410.3, decimals: 2, change: 0.15 },
  { label: "OIL", price: 78.45, decimals: 2, change: -0.22 },
  { label: "S&P 500", price: 5432.1, decimals: 2, change: 0.4 },
];

function formatPrice(q: Quote) {
  return q.price.toLocaleString("en-US", {
    minimumFractionDigits: q.decimals,
    maximumFractionDigits: q.decimals,
  });
}

function QuoteItem({ q }: { q: Quote }) {
  const up = q.change >= 0;
  return (
    <span className="inline-flex items-center gap-2 text-xs tracking-wide">
      <span className="font-medium text-muted-foreground">{q.label}</span>
      <span className="tabular-nums text-foreground/90">{formatPrice(q)}</span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 tabular-nums",
          up ? "text-positive" : "text-negative",
        )}
      >
        <span aria-hidden className="text-[0.6rem] leading-none">
          {up ? "▲" : "▼"}
        </span>
        {`${up ? "+" : ""}${q.change.toFixed(2)}%`}
      </span>
    </span>
  );
}

/**
 * Nastro scorrevole delle quotazioni (lista duplicata per il loop senza stacchi).
 * Simulazione "live": ogni pochi secondi i valori oscillano leggermente
 * (random walk). Nessuna API: i dati sono di esempio. Riusato nel hero e nella
 * navbar sticky. Rispetta prefers-reduced-motion (resta statico).
 */
export function TickerTrack({ className }: { className?: string }) {
  const [quotes, setQuotes] = useState(INITIAL);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setQuotes((prev) =>
        prev.map((q) => {
          const drift = (Math.random() - 0.5) * 2; // -1..1
          const change = Math.max(-3.5, Math.min(3.5, q.change + drift * 0.05));
          const price = Math.max(0.0001, q.price * (1 + drift * 0.0004));
          return { ...q, price, change };
        }),
      );
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("flex w-max animate-marquee gap-10", className)}>
      {[...quotes, ...quotes].map((q, i) => (
        <QuoteItem key={`${q.label}-${i}`} q={q} />
      ))}
    </div>
  );
}

/** Barra superiore full-width con il ticker di mercato. */
export function MarketTicker() {
  return (
    <div className="relative z-30 overflow-hidden border-b border-white/5 bg-[#05070a]">
      <TickerTrack className="py-2 pl-10" />
    </div>
  );
}
