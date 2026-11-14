"use client";

// MOB-1372 (boards ADM-SHELL-09-account-*): the signed-in admin's own data,
// the second step's state, new recovery codes (confirmed with the app code)
// and sign-out.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { CodeInput } from "@/components/shell/AuthCard";
import { ConfirmDialog } from "@/components/shell/overlays";
import { PageHead, Section, Status } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";

export default function AccountPage() {
  const { api, me, reloadMe } = useConsole();
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  const regenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<{ recovery_codes: string[] }>("/two-factor/recovery-codes", { code });
      setCodes(r.recovery_codes);
      setAsking(false);
      reloadMe();
    } catch (e) {
      setError(e instanceof ApiError && e.code === "locked" ? "Troppi codici sbagliati. Riprova tra 5 minuti." : "Codice non valido. Riprova con il codice che vedi adesso nell’app.");
      setCode("");
    }
    setBusy(false);
  };

  return (
    <AdminFrame title="Il mio account">
      <PageHead title="Il mio account" sub="I tuoi dati di accesso alla console." crumbs={["Il mio account"]} />
      {me ? (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
          <Section title="Profilo">
            <div>
              <div className="kv"><span>Nome</span><span>{me.user.name}</span></div>
              <div className="kv"><span>Email</span><span>{me.user.email}</span></div>
              <div className="kv"><span>Ruolo</span><span>{me.role?.label ?? "—"}</span></div>
            </div>
          </Section>
          <Section title="Verifica in due passaggi">
            <Status kind="ok">Attiva · app collegata</Status>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 14, borderTop: "1px solid var(--hair)" }}>
              <span>
                <strong>Codici di recupero</strong>
                <span className="sub">{me.two_factor.recovery_left} ancora validi</span>
              </span>
              <button type="button" className="btn" onClick={() => (setAsking(true), setCode(""), setError(null))}>Crea nuovi codici</button>
            </div>
            <p className="note" style={{ fontSize: 14 }}>Cambi telefono? Chiedi a un super amministratore di azzerare la tua verifica: al prossimo accesso colleghi il telefono nuovo.</p>
          </Section>
          <Section title="Sessione">
            <p style={{ margin: 0, color: "var(--text-2)" }}>Per sicurezza la console ti fa uscire dopo {me.idle_minutes} minuti senza attività.</p>
            <div>
              <button type="button" className="btn" onClick={async () => { await api.del("/session").catch(() => undefined); router.replace("/accedi"); }}>Esci</button>
            </div>
          </Section>
        </div>
      ) : null}
      {asking ? (
        <ConfirmDialog
          title="Creare nuovi codici di recupero?"
          message="Scrivi il codice dell’app per confermare. I codici che hai adesso smettono di valere."
          confirmLabel="Crea"
          kind="primary"
          busy={busy}
          error={error}
          onConfirm={regenerate}
          onCancel={() => setAsking(false)}
        >
          <CodeInput id="regen-code" value={code} onChange={setCode} invalid={!!error} />
        </ConfirmDialog>
      ) : null}
      {codes ? (
        <ConfirmDialog
          title="Nuovi codici di recupero"
          message="I codici di prima non valgono più. Salva questi in un posto sicuro."
          confirmLabel="Fatto"
          kind="primary"
          cancelLabel="Copia tutti"
          onConfirm={() => setCodes(null)}
          onCancel={() => navigator.clipboard?.writeText(codes.join("\n")).catch(() => undefined)}
        >
          <div className="codes">{codes.map((c) => <span key={c}>{c}</span>)}</div>
        </ConfirmDialog>
      ) : null}
    </AdminFrame>
  );
}
