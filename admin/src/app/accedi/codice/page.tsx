"use client";

// MOB-1372 (boards ADM-SHELL-02-codice-*): the authenticator code after the
// password, or a recovery code. Locked after 5 wrong codes (recovery codes
// included), a code already used is refused (the backend's shared service).

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard, CodeInput } from "@/components/shell/AuthCard";
import { ApiError } from "@/lib/api";
import { useConsole, type Me } from "@/lib/console";

const MESSAGES: Record<string, string> = {
  invalid_code: "Codice non valido. Controlla che l’ora del telefono sia automatica e riprova.",
  code_used: "Questo codice è già stato usato. Aspetta il prossimo nell’app e riprova.",
  locked: "Troppi codici sbagliati. Per sicurezza l’accesso è bloccato per 5 minuti, anche con i codici di recupero.",
  offline: "Sei offline. Riprova quando torna la connessione.",
};

export default function CodePage() {
  const { api, toast } = useConsole();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Me>("/me").then(setMe, (e) => {
      if (e instanceof ApiError && e.status === 401) router.replace("/accedi");
    });
  }, [api, router]);

  const send = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ recovery_left: number }>("/session/two-factor", recovery ? { recovery_code: value } : { code: value });
      if (recovery) toast({ title: "Hai usato un codice di recupero", body: `Te ne restano ${res.recovery_left}. Puoi crearne di nuovi da «Il mio account».`, kind: "info" });
      router.replace("/");
    } catch (e) {
      const c = e instanceof ApiError ? e.code ?? "" : "";
      setError(MESSAGES[c] ?? (recovery ? "Codice di recupero non valido o già usato." : MESSAGES.invalid_code));
      setBusy(false);
    }
  };
  const locked = error === MESSAGES.locked;

  return (
    <AuthCard>
      <div>
        <h1>{recovery ? "Codice di recupero" : "Codice di verifica"}</h1>
        <p className="lead" style={{ marginTop: 10 }}>
          {recovery
            ? "Scrivi uno dei codici di recupero che hai salvato quando hai attivato la verifica. Ogni codice vale una volta sola."
            : "Apri l’app di autenticazione sul telefono e scrivi il codice di 6 cifre di Finzy."}
        </p>
        {me ? <p className="note" style={{ marginTop: 10, fontSize: 14 }}>Accesso come {me.user.email}</p> : null}
      </div>
      {recovery ? (
        <div className="field">
          <label htmlFor="recovery">Codice di recupero</label>
          <input id="recovery" className="input mono" value={code} onChange={(e) => setCode(e.target.value.trim())} aria-invalid={!!error || undefined} autoComplete="off" />
        </div>
      ) : (
        <CodeInput value={code} onChange={setCode} onComplete={(v) => !busy && send(v)} invalid={!!error} disabled={busy} />
      )}
      {error ? <p className="error-line" role="alert">{error}</p> : null}
      <button type="button" className="btn btn-primary btn-wide" disabled={busy || locked || (recovery ? code.length < 10 : code.length !== 6)} onClick={() => send(code)}>
        {busy ? "…" : "Verifica"}
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <button type="button" className="link-btn" disabled={locked} onClick={() => (setRecovery((r) => !r), setCode(""), setError(null))}>
          {recovery ? "Usa il codice dell’app" : "Usa un codice di recupero"}
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={async () => {
            await api.del("/session").catch(() => undefined);
            router.replace("/accedi");
          }}
        >
          Torna all’accesso
        </button>
      </div>
      {recovery && error ? <p className="note" style={{ textAlign: "center" }}>Hai perso il telefono e i codici? Chiedi a un super amministratore di azzerare la verifica.</p> : null}
    </AuthCard>
  );
}
