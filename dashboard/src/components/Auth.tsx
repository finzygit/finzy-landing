"use client";

// MOB-1198 (FZW-WEB-01): web_auth_card, the fields of the kit, the code
// boxes, web_gate with the two stores. On a phone the card's content sits
// on the ground with no card around it, as the boards draw it.
import { useId, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/lib/app";
import { AppleGlyph, Icon } from "./ui";

export const APP_STORE_URL = "https://apps.apple.com/it/app/id6795460404";
/** The site's smart link: a phone goes to its store, a computer to the site (finzy-landing /download). */
export const DOWNLOAD_URL = "https://finzyapp.com/download";
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=it.mokkastudios.finzyapp";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[440px] pt-3 sm:pt-16">
      <div className="sm:card sm:px-[30px] sm:pb-[30px] sm:pt-[34px]">{children}</div>
    </div>
  );
}

export function Heading({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="m-0 text-auth font-bold tracking-[-0.02em] text-ink">{title}</h1>
      {sub && <p className="m-0 text-body text-ink-2">{sub}</p>}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  trailing,
  error = false,
  hint,
  autoComplete,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password";
  trailing?: "mail" | "eye";
  error?: boolean;
  hint?: ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const look = error ? "capsule-error" : focus ? "capsule-focus" : "capsule";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="pl-1 text-label text-ink-2">
        {label}
      </label>
      <div className={`flex h-[46px] items-center gap-2.5 rounded-control px-4 ${look}`}>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          type={type === "password" && show ? "text" : type}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={error || undefined}
          className="min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-ink-3"
          style={{ outline: "none" }}
        />
        {trailing === "mail" && <Icon name="mail" size={18} className="text-ink-2" />}
        {trailing === "eye" && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={label} aria-pressed={show} className="text-ink-2">
            <Icon name="eye" size={18} />
          </button>
        )}
      </div>
      {hint && <div className={`pl-1 text-meta ${error ? "text-warn" : "text-ink-3"}`}>{hint}</div>}
    </div>
  );
}

export function OrDivider() {
  const { t } = useApp();
  return (
    <div className="flex items-center gap-3 text-meta text-ink-3" aria-hidden>
      <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(39,204,216,0),rgba(39,204,216,0.6))]" />
      {t("or")}
      <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(39,204,216,0.6),rgba(39,204,216,0))]" />
    </div>
  );
}

/** The four boxes of the reset code (the app's 4 digits): four fixed slots. */
export function CodeBoxes({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, typed: string) => {
    const digits = typed.replace(/\D/g, "");
    if (digits.length >= 4) {
      // a pasted code fills the four boxes
      onChange(digits.slice(0, 4).split(""));
      refs.current[3]?.focus();
      return;
    }
    const next = value.slice();
    next[i] = digits.slice(-1); // typing over a digit replaces it
    onChange(next);
    if (next[i] && i < 3) refs.current[i + 1]?.focus();
  };
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {value.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${i + 1}/4`}
          aria-invalid={error || undefined}
          onChange={(e) => set(i, e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && refs.current[i - 1]?.focus()}
          className={`h-[54px] rounded-control text-center text-[26px] font-bold text-ink ${error ? "capsule-error" : "raised"}`}
          style={{ outline: "none" }}
        />
      ))}
    </div>
  );
}

/**
 * The two stores. Text buttons, not the official badges: Apple's and
 * Google's badges must be taken from their own generators and Google's needs
 * its trademark line under it (a new text for Victor to approve), so they
 * are not bundled here (see dashboard/README.md).
 */
export function StoreButtons() {
  const { t } = useApp();
  const base = "raised inline-flex h-[46px] items-center gap-2.5 rounded-control px-4 text-left text-ink";
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={base} aria-label="App Store">
        <AppleGlyph size={20} />
        <span className="flex flex-col leading-none">
          <span className="text-[10px] text-ink-2">{t("store_apple")}</span>
          <span className="text-[17px] font-semibold">App Store</span>
        </span>
      </a>
      <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className={base} aria-label="Google Play">
        <svg aria-hidden width="20" height="20" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gplay" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00c3ff" />
              <stop offset="0.4" stopColor="#00e676" />
              <stop offset="0.72" stopColor="#ffce00" />
              <stop offset="1" stopColor="#ff3b44" />
            </linearGradient>
          </defs>
          <path fill="url(#gplay)" d="M4 3.5c0-.9.97-1.46 1.74-1L20 11c.77.44.77 1.56 0 2L5.74 21.5C4.97 21.96 4 21.4 4 20.5V3.5z" />
        </svg>
        <span className="flex flex-col leading-none">
          <span className="text-[10px] text-ink-2">{t("store_google")}</span>
          <span className="text-[17px] font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
