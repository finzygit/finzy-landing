"use client";

// MOB-1461: what «Spesa AI» and «Salute dei servizi» share: one read at
// opening and on «Aggiorna» (no automatic refresh, as the Home), and the
// Aggiorna button.

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { useConsole } from "@/lib/console";
import s from "./spend.module.css";
import { T } from "./texts";

export function useLoad<D>(path: string) {
  const { api } = useConsole();
  const [data, setData] = useState<D | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const load = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setData(await api.get<D>(path));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [api, path]);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    queueMicrotask(() => void load());
  }, [load]);
  return { data, failed, busy, load };
}

export function RefreshButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button type="button" className="btn" onClick={() => !busy && onClick()} aria-disabled={busy || undefined} aria-busy={busy || undefined}>
      <span className={busy ? s.spin : undefined} style={{ display: "inline-flex" }}>
        <Icon name="pulse" size={17} />
      </span>
      {T.refresh}
    </button>
  );
}
