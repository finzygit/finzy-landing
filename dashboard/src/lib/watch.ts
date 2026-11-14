// MOB-1198 (FZW-WEB-08): a watchlist row (an Azione of /api/watch-aziones)
// in the shape of a search result. Prices are stored in USD for every venue
// (UsdCurrencyNormalizer), as the app shows them.
import { toNumber } from "./format.ts";
import type { WatchRow } from "./types.ts";

export function watchToRow(r: WatchRow) {
  return {
    symbol: r.symbol,
    name: r.common_name || r.name || r.symbol,
    exchange: r.exchange ?? r.exchange_mic ?? null,
    currency: r.currency ?? "USD",
    last_price: toNumber(r.value),
    day_change_percent: toNumber(r.percent_change),
    logo_url: r.logo_url ?? null,
  };
}
