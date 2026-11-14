"use client";

// MOB-1372 (boards ADM-SHELL-01-accesso-*): email and password, then the
// code page (or the mandatory set-up). One answer for every refusal, so the
// page never tells an admin account from an app account or a wrong password.

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/shell/AuthCard";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";

export default function SignInPage() {
  const { api } = useConsole();
  const router = useRouter();
  const expired = useSearchParams()?.get("scaduta") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ next: "two_factor" | "setup" }>("/session", { email, password });
      router.replace(res.next === "setup" ? "/accedi/attiva" : "/accedi/codice");
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(status === 429 ? "Troppi tentativi. Riprova tra qualche minuto." : status === 0 ? "Sei offline. Riprova quando torna la connessione." : "Email o password non corretti.");
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 22 }} noValidate>
        {expired ? <p className="note" style={{ fontSize: 14 }}>Sessione scaduta: accedi di nuovo per continuare.</p> : null}
        <div>
          <h1>Accedi alla console</h1>
          <p className="lead" style={{ marginTop: 10 }}>Riservata al team Finzy. Dopo la password ti chiediamo il codice dell’app di autenticazione.</p>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.it" aria-invalid={!!error || undefined} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="La tua password" aria-invalid={!!error || undefined} />
          {error ? <p className="error-line" role="alert">{error}</p> : null}
        </div>
        <button type="submit" className="btn btn-primary btn-wide" disabled={!email || !password || busy} aria-busy={busy || undefined}>
          {busy ? "…" : "Accedi"}
        </button>
        <p className="note" style={{ textAlign: "center" }}>Password dimenticata? Chiedi a un super amministratore di reimpostarla.</p>
      </form>
    </AuthCard>
  );
}
