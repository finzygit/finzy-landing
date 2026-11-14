"use client";

// MOB-1198 (FZW-WEB-08): web_watch_button and the watchlist of the account.
// The list is the app's (GET/POST/DELETE /api/watch-aziones), so what is
// added here is on the phone too. States: off, on (turquoise), saving,
// disabled; a round eye on the phone. Adding confirms with a toast.
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/app";
import type { StockHeader, WatchRow } from "@/lib/types";
import { Icon, Spinner } from "./ui";

export function WatchButton({
  on,
  saving,
  disabled = false,
  onToggle,
  round = false,
}: {
  on: boolean;
  saving: boolean;
  disabled?: boolean;
  onToggle: () => void;
  round?: boolean;
}) {
  const { t } = useApp();
  const label = on ? t("watch_on") : t("watch_off");
  const look = on ? "border border-[rgba(39,216,199,0.62)] bg-[linear-gradient(180deg,rgba(39,204,216,0.16),rgba(39,204,216,0.06))] text-accent" : "raised text-ink";
  if (round) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={on}
        disabled={disabled || saving}
        onClick={onToggle}
        className={`inline-flex h-11 w-11 flex-none items-center justify-center rounded-full disabled:opacity-40 ${look}`}
      >
        {saving ? <Spinner /> : <Icon name="eye" size={20} />}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      aria-busy={saving || undefined}
      disabled={disabled || saving}
      onClick={onToggle}
      className={`inline-flex h-11 flex-none items-center gap-2.5 whitespace-nowrap rounded-control px-4 text-row font-semibold disabled:opacity-40 ${saving ? "raised" : look}`}
    >
      {saving ? <Spinner /> : <Icon name="eye" size={18} />}
      {!saving && label}
    </button>
  );
}

/** The watch state of one stock: read from the account's list, toggled with the API. */
export function useWatch(stock: StockHeader | null) {
  const { api, t, toast } = useApp();
  const [on, setOn] = useState(false);
  const [rowId, setRowId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const symbol = stock?.symbol ?? null;

  useEffect(() => {
    if (!symbol) return;
    let alive = true;
    api
      .get<WatchRow[]>("/watch-aziones", { limit: 100 })
      .then((rows) => {
        if (!alive) return;
        const row = (rows ?? []).find((r) => r.symbol?.toUpperCase() === symbol.toUpperCase());
        setOn(Boolean(row));
        setRowId(row?.id ?? null);
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [api, symbol]);

  const azioneId = stock?.id ?? rowId;

  const toggle = useCallback(async () => {
    if (!azioneId || saving) return;
    setSaving(true);
    try {
      if (on) {
        await api.del(`/watch-aziones/${azioneId}`);
        setOn(false);
      } else {
        await api.post("/watch-aziones", { azione_id: azioneId });
        setOn(true);
        toast(t("w_added"), t("w_added_sub"));
      }
    } catch {
      toast(t("watch_error"));
    } finally {
      setSaving(false);
    }
  }, [api, azioneId, on, saving, t, toast]);

  return { on, saving, disabled: !ready || !azioneId, toggle };
}
