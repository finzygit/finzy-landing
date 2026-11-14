"use client";

// MOB-1198 (FZW-WEB-01): sign-in with the app account. Email and password
// (POST /api/web/login), Google and Apple through Firebase when the build has
// its web config (POST /api/web/social), «Password dimenticata». After a
// reset the email is filled in and the notice says to sign in again.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthCard, DOWNLOAD_URL, Field, Heading, OrDivider } from "@/components/Auth";
import { Shell } from "@/components/Shell";
import { GoogleGlyph, AppleGlyph, Icon, Notice, PrimaryButton, SecondaryButton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useApp } from "@/lib/app";
import { firebaseConfig, preloadFirebase, socialIdToken, type SocialProvider } from "@/lib/firebase";
import { RESET_EMAIL_KEY } from "@/lib/reset";

function readResetEmail(): string {
  try {
    return window.sessionStorage.getItem(RESET_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function SignIn() {
  const { api, t, reloadMe } = useApp();
  const params = useSearchParams();
  const afterReset = params.get("reset") === "1";
  const [email, setEmail] = useState(() => (afterReset && typeof window !== "undefined" ? readResetEmail() : ""));
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [socialError, setSocialError] = useState<null | { provider: SocialProvider; noAccount: boolean }>(null);
  const social = firebaseConfig() !== null;
  useEffect(() => {
    if (social) void preloadFirebase().catch(() => undefined);
  }, [social]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setError(false);
    try {
      await api.post("/web/login", { email: email.trim(), password });
      await reloadMe();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function signInWith(provider: SocialProvider) {
    setSocialError(null);
    try {
      const idToken = await socialIdToken(provider);
      await api.post("/web/social", { id_token: idToken, provider });
      await reloadMe();
    } catch (err) {
      setSocialError({ provider, noAccount: err instanceof ApiError && err.status === 404 });
    }
  }

  const socialMessage = socialError ? (socialError.noAccount ? t("social_no_account") : t(socialError.provider === "google" ? "social_error" : "apple_error")) : null;

  return (
    <AuthCard>
      <form onSubmit={submit} className="flex flex-col gap-[26px]" noValidate>
        {afterReset && (
          <div role="status" className="card flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[rgba(39,204,216,0.18)] text-accent">
              <Icon name="check" size={16} stroke={2.6} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-label font-bold text-ink">{t("reset_done")}</span>
              <span className="text-meta text-ink-2">{t("reset_done_sub")}</span>
            </span>
          </div>
        )}
        <Heading title={t("login_title")} sub={t("login_sub")} />
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-3">
            <Field label={t("email")} value={email} onChange={setEmail} placeholder={t("email_ph")} type="email" trailing="mail" autoComplete="email" autoFocus={!afterReset} error={error} />
            <Field
              label={t("password")}
              value={password}
              onChange={setPassword}
              placeholder={t("password_ph")}
              type="password"
              trailing="eye"
              autoComplete="current-password"
              autoFocus={afterReset}
              error={error}
              hint={error ? t("login_error") : undefined}
            />
          </div>
          <div className="-mt-1 flex justify-end">
            <Link href="/password" className="text-row font-semibold text-accent">
              {t("forgot")}
            </Link>
          </div>
          <PrimaryButton disabled={!email || !password} loading={busy}>
            {t("signin")}
          </PrimaryButton>
          {social && (
            <>
              <OrDivider />
              <div className="flex flex-col gap-2">
                <SecondaryButton full onClick={() => signInWith("google")}>
                  <GoogleGlyph />
                  {t("login_google")}
                </SecondaryButton>
                {socialError?.provider === "google" && socialMessage && <Notice text={socialMessage} action={t("retry")} onAction={() => signInWith("google")} />}
              </div>
              <div className="flex flex-col gap-2">
                <SecondaryButton full onClick={() => signInWith("apple")}>
                  <AppleGlyph />
                  {t("login_apple")}
                </SecondaryButton>
                {socialError?.provider === "apple" && socialMessage && <Notice text={socialMessage} action={t("retry")} onAction={() => signInWith("apple")} />}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="m-0 text-row text-ink-2">
            {t("no_account")}{" "}
            <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
              {t("get_app")}
            </a>
          </p>
          <p className="m-0 text-meta text-ink-3">{t("stay_signed")}</p>
        </div>
      </form>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Shell search={false}>
      <SignIn />
    </Shell>
  );
}
