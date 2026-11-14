"use client";

// MOB-1198 (FZW-WEB-01): password reset with the app's 4-digit code.
// Email → POST /api/send_reset_code; code + new password →
// POST /api/validate_new_pass; then back to /accedi with the notice and the
// email filled in. The new password follows the app's rule.
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard, CodeBoxes, Field, Heading } from "@/components/Auth";
import { Shell } from "@/components/Shell";
import { LinkButton, Notice, PrimaryButton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useApp } from "@/lib/app";
import { passwordOk, RESET_EMAIL_KEY } from "@/lib/reset";

function Reset() {
  const { api, t } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const otp = code.join("");
  const codeComplete = code.every((d) => /^\d$/.test(d));
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<null | "send" | "code" | "rules" | "match">(null);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setFailed(null);
    try {
      await api.post("/send_reset_code", { email: email.trim() });
      setStep("code");
    } catch {
      setFailed("send");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!codeComplete) return setFailed("code");
    if (!passwordOk(pw)) return setFailed("rules");
    if (pw !== pw2) return setFailed("match");
    setBusy(true);
    setFailed(null);
    try {
      await api.post("/validate_new_pass", { email: email.trim(), otp, password: pw });
      try {
        window.sessionStorage.setItem(RESET_EMAIL_KEY, email.trim());
      } catch {
        // storage blocked: the email is simply not filled in
      }
      router.push("/accedi?reset=1");
    } catch (err) {
      setFailed(err instanceof ApiError && (err.status === 422 || err.status === 404) ? "code" : "send");
    } finally {
      setBusy(false);
    }
  }

  if (step === "email") {
    return (
      <AuthCard>
        <form onSubmit={sendCode} className="flex flex-col gap-[22px]" noValidate>
          <Heading title={t("forgot_title")} sub={t("forgot_sub")} />
          <Field label={t("email")} value={email} onChange={setEmail} placeholder={t("email_ph")} type="email" trailing="mail" autoComplete="email" autoFocus />
          {failed === "send" && <Notice text={t("err_title")} action={t("retry")} onAction={() => sendCode()} />}
          <PrimaryButton disabled={!email.trim()} loading={busy}>
            {t("send_code")}
          </PrimaryButton>
          <div className="text-center">
            <LinkButton onClick={() => router.push("/accedi")}>{t("signin")}</LinkButton>
          </div>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form onSubmit={verify} className="flex flex-col gap-5" noValidate>
        <Heading title={t("code_title")} sub={<b className="font-bold text-ink">{email}</b>} />
        <div className="flex flex-col gap-3">
          <CodeBoxes value={code} onChange={setCode} error={failed === "code"} />
          {failed === "code" && <Notice text={t("code_error")} />}
        </div>
        <Field label={t("new_pw")} value={pw} onChange={setPw} type="password" trailing="eye" autoComplete="new-password" error={failed === "rules"} hint={t("pw_rules")} />
        <Field
          label={t("confirm_pw")}
          value={pw2}
          onChange={setPw2}
          type="password"
          trailing="eye"
          autoComplete="new-password"
          error={failed === "match"}
          hint={failed === "match" ? t("pw_mismatch") : undefined}
        />
        {failed === "send" && <Notice text={t("err_title")} />}
        <PrimaryButton disabled={!codeComplete || !pw || !pw2} loading={busy}>
          {t("verify")}
        </PrimaryButton>
        <p className="m-0 text-center text-row text-ink-2">
          {t("no_code")} <LinkButton onClick={() => sendCode()}>{t("resend")}</LinkButton>
        </p>
      </form>
    </AuthCard>
  );
}

export default function PasswordPage() {
  return (
    <Shell search={false}>
      <Reset />
    </Shell>
  );
}
