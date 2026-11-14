import type { ReactNode } from "react";

/** The sign-in pages: the logo with «Console» above one card; no menu, no link elsewhere. */
export function AuthCard({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="auth">
      <div className="brand" style={{ padding: 0 }}>
        <span style={{ color: "var(--accent)" }}>Finzy</span>
        <small>Console</small>
      </div>
      <div className={wide ? "card wide" : "card"}>{children}</div>
      <p className="note">Accesso protetto dalla verifica in due passaggi.</p>
    </div>
  );
}

/** The 6-digit code: one input (paste works), drawn large; the sixth digit sends. */
export function CodeInput({ value, onChange, onComplete, invalid, disabled, id = "code" }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; invalid?: boolean; disabled?: boolean; id?: string }) {
  return (
    <div className="code-cells">
      <input
        id={id}
        className="input"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label="Codice di 6 cifre"
        autoFocus
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          onChange(v);
          if (v.length === 6 && onComplete) onComplete(v);
        }}
      />
    </div>
  );
}
