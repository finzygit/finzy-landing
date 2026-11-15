"use client";

// MOB-1372 (boards ADM-SHELL-03-attiva-*): the mandatory set-up for an
// admin without a confirmed authenticator. 1. link the app (QR or key) and
// confirm a code; 2. save the recovery codes (the tick is required).

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard, CodeInput } from "@/components/shell/AuthCard";
import { Icon } from "@/components/shell/Icon";
import { ApiError } from "@/lib/api";
import { useConsole, type Me } from "@/lib/console";
import { firstRoute } from "@/lib/nav";

type Setup = { secret: string; otpauth_url: string; qr_svg: string };

export default function SetupPage() {
  const { api, toast } = useConsole();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Me>("/me").then(setMe, () => undefined);
    api.get<Setup>("/two-factor/setup").then(setSetup, (e) => {
      if (e instanceof ApiError && e.code === "already_confirmed") router.replace("/sign-in/code");
      else if (e instanceof ApiError && e.status === 401) router.replace("/sign-in");
      else setError("Non è stato possibile preparare il codice QR. Ricarica la pagina.");
    });
  }, [api, router]);

  const confirm = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ recovery_codes: string[] }>("/two-factor/confirm", { code: value });
      setCodes(res.recovery_codes);
    } catch (e) {
      const c = e instanceof ApiError ? e.code : null;
      setError(c === "locked" ? "Troppi codici sbagliati. Riprova tra 5 minuti." : "Codice non valido. Controlla che l’ora del telefono sia automatica e riprova.");
      setCode("");
    }
    setBusy(false);
  };

  const download = () => {
    if (!codes) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([codes.join("\n") + "\n"], { type: "text/plain" }));
    a.download = "finzy-console-codici-di-recupero.txt";
    a.click();
  };

  return (
    <AuthCard wide>
      <div className="setup-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ fontSize: 24, lineHeight: "30px" }}>Attiva la verifica in due passaggi</h1>
          <p className="lead" style={{ fontSize: 15 }}>Per entrare nella console è obbligatoria. Ti servono il telefono e due minuti.</p>
          <ol style={{ margin: "10px 0 0", paddingLeft: 20, color: "var(--text-2)", lineHeight: "32px" }}>
            <li style={{ color: codes ? "var(--text-2)" : "var(--text)", fontWeight: codes ? 500 : 650 }}>Collega l’app</li>
            <li style={{ color: codes ? "var(--text)" : "var(--text-3)", fontWeight: codes ? 650 : 500 }}>Salva i codici di recupero</li>
          </ol>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--hair)" }}>
            <span className="note">Stai attivando la verifica per</span>
            <strong style={{ display: "block", fontSize: 14 }}>{me?.user.email ?? "…"}</strong>
            <button
              type="button"
              className="link-btn"
              onClick={async () => {
                await api.del("/session").catch(() => undefined);
                router.replace("/sign-in");
              }}
            >
              Esci
            </button>
          </div>
        </div>
        <div className="setup-right">
          {!codes ? (
            <>
              <p style={{ margin: 0 }}>1. Apri un’app di autenticazione (Google Authenticator, Microsoft Authenticator o 1Password) e inquadra il codice QR.</p>
              {/* The backend's SVG as an image: it can never run anything. */}
              {setup ? (
                // eslint-disable-next-line @next/next/no-img-element -- a data URI, nothing to optimise
                <img className="qr" alt="Codice QR per l’app di autenticazione" src={`data:image/svg+xml;utf8,${encodeURIComponent(setup.qr_svg)}`} />
              ) : (
                <span className="skeleton" style={{ width: 176, height: 176, borderRadius: 14 }} />
              )}
              {showKey && setup ? (
                <div>
                  <p className="note" style={{ fontSize: 14 }}>Scrivi questa chiave nell’app, come «chiave di configurazione».</p>
                  <code style={{ display: "block", marginTop: 8, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>{setup.secret}</code>
                </div>
              ) : (
                <button type="button" className="link-btn" style={{ alignSelf: "flex-start" }} onClick={() => setShowKey(true)}>
                  Non riesci a inquadrarlo? Mostra la chiave
                </button>
              )}
              <p style={{ margin: 0, paddingTop: 16, borderTop: "1px solid var(--hair)" }}>2. Scrivi il codice di 6 cifre che compare nell’app.</p>
              <CodeInput value={code} onChange={setCode} onComplete={(v) => !busy && confirm(v)} invalid={!!error} disabled={busy || !setup} />
              {error ? <p className="error-line" role="alert">{error}</p> : null}
              <button type="button" className="btn btn-primary btn-wide" style={{ maxWidth: 420 }} disabled={busy || code.length !== 6} onClick={() => confirm(code)}>
                {busy ? "…" : "Conferma"}
              </button>
            </>
          ) : (
            <>
              <h2 style={{ margin: 0, fontSize: 20 }}>Salva i codici di recupero</h2>
              <p style={{ margin: 0, color: "var(--text-2)" }}>
                Se perdi il telefono, con uno di questi codici entri lo stesso. Ogni codice vale una volta sola. Tienili in un posto sicuro, per esempio un gestore di password.
              </p>
              <div className="codes">{codes.map((c) => <span key={c}>{c}</span>)}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigator.clipboard?.writeText(codes.join("\n")).then(() => toast({ title: "Codici copiati" }), () => undefined)}
                >
                  <Icon name="copy" size={17} /> Copia tutti
                </button>
                <button type="button" className="btn" onClick={download}>
                  <Icon name="download" size={17} /> Scarica .txt
                </button>
              </div>
              <label style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ width: 22, height: 22 }} />
                Ho salvato i codici in un posto sicuro
              </label>
              <button
                type="button"
                className="btn btn-primary btn-wide"
                style={{ maxWidth: 420 }}
                disabled={!saved}
                onClick={() => {
                  toast({ title: "Verifica in due passaggi attiva", body: "Dal prossimo accesso ti chiediamo il codice dell’app." });
                  router.replace(firstRoute(new Set(me?.permissions ?? [])));
                }}
              >
                Entra nella console
              </button>
            </>
          )}
        </div>
      </div>
    </AuthCard>
  );
}
