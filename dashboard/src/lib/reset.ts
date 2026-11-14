// MOB-1198: after a password reset the sign-in page fills in the email. It
// travels in sessionStorage (this tab only), never in the URL.
export const RESET_EMAIL_KEY = "finzy-dashboard-reset-email";

/** The app's password rule (ARB password_requirements): 10+ characters, upper, lower, digit, special. */
export function passwordOk(pw: string): boolean {
  return pw.length >= 10 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}
