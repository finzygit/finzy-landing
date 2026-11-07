/**
 * Pagina "Elimina account" (MOB-591): l'URL che Google Play chiede nella
 * sezione Data safety alle app con account. Spiega come eliminare l'account
 * dall'app e dà la strada via email per chi non ha più l'app.
 *
 * Fonte unica per la pagina, il footer, la sitemap e l'alias in
 * next.config.ts. Test: `src/lib/account-deletion.test.ts`.
 *
 * Le etichette dell'app sono quelle vere: l'app è in italiano e in inglese
 * (chiave `eliminaAccount` in lib/l10n/intl_*.arb), quindi in spagnolo,
 * francese e portoghese il pulsante resta «Delete account».
 * Il Profilo si apre toccando la foto profilo (user_profile_image.dart) e
 * «Elimina account» è l'ultima voce della pagina.
 */

/** URL canonico, da inserire in Play Console > Data safety. */
export const ACCOUNT_DELETION_PATH = "/elimina-account";

export type AccountDeletionCopy = {
  /** Etichetta del link nel footer. */
  navLabel: string;
  overline: string;
  title: string;
  subtitle: string;
  inAppTitle: string;
  steps: string[];
  inAppNote: string;
  emailTitle: string;
  /** `{email}` viene sostituito con la casella di assistenza. */
  emailBody: string;
  /** Oggetto precompilato nel link mailto:. */
  emailSubject: string;
  deletedTitle: string;
  deletedBody: string;
  keptTitle: string;
  keptBody: string;
};

/** Link mailto: con l'oggetto precompilato. */
export function deletionMailto(email: string, subject: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

export const ACCOUNT_DELETION_COPY: Record<
  "it" | "en" | "es" | "fr" | "pt",
  AccountDeletionCopy
> = {
  it: {
    navLabel: "Elimina account",
    overline: "Account",
    title: "Eliminare l'account",
    subtitle:
      "Puoi eliminare il tuo account Finzy dall'app oppure chiedercelo via email.",
    inAppTitle: "Dall'app",
    steps: [
      "Apri Finzy ed entra con il tuo account.",
      "Tocca la tua foto profilo per aprire il Profilo.",
      "In fondo alla pagina tocca «Elimina account» e conferma.",
    ],
    inAppNote: "L'account viene eliminato subito e la sessione si chiude.",
    emailTitle: "Via email",
    emailBody:
      "Scrivi a {email} dall'indirizzo del tuo account, con oggetto «Eliminazione account». Eliminiamo l'account e ti rispondiamo entro 2 giorni lavorativi.",
    emailSubject: "Eliminazione account",
    deletedTitle: "Cosa eliminiamo",
    deletedBody:
      "Il tuo account e i dati personali collegati: profilo, email, risposte dell'onboarding, preferenze, articoli salvati, watchlist e wallet.",
    keptTitle: "Cosa non cambia",
    keptBody:
      "L'eliminazione non annulla un abbonamento: annullalo prima nelle impostazioni dell'App Store o di Google Play. I pagamenti restano registrati da Apple o da Google.",
  },
  en: {
    navLabel: "Delete account",
    overline: "Account",
    title: "Delete your account",
    subtitle:
      "You can delete your Finzy account in the app, or ask us by email.",
    inAppTitle: "In the app",
    steps: [
      "Open Finzy and sign in to your account.",
      "Tap your profile picture to open your Profile.",
      "At the bottom of the page, tap “Delete account” and confirm.",
    ],
    inAppNote: "Your account is deleted straight away and you are signed out.",
    emailTitle: "By email",
    emailBody:
      "Write to {email} from your account's email address, with the subject “Account deletion”. We delete the account and reply within 2 business days.",
    emailSubject: "Account deletion",
    deletedTitle: "What we delete",
    deletedBody:
      "Your account and the personal data linked to it: profile, email, onboarding answers, preferences, saved articles, watchlist and wallet.",
    keptTitle: "What stays",
    keptBody:
      "Deleting the account does not cancel a subscription: cancel it first in your App Store or Google Play settings. Payments stay on record with Apple or Google.",
  },
  es: {
    navLabel: "Eliminar cuenta",
    overline: "Cuenta",
    title: "Eliminar la cuenta",
    subtitle:
      "Puedes eliminar tu cuenta de Finzy desde la app o pedírnoslo por email.",
    inAppTitle: "Desde la app",
    steps: [
      "Abre Finzy e inicia sesión con tu cuenta.",
      "Toca tu foto de perfil para abrir el Perfil.",
      "Al final de la página, toca «Delete account» y confirma.",
    ],
    inAppNote: "La cuenta se elimina al momento y se cierra la sesión.",
    emailTitle: "Por email",
    emailBody:
      "Escribe a {email} desde la dirección de tu cuenta, con el asunto «Eliminación de cuenta». Eliminamos la cuenta y te respondemos en un plazo de 2 días laborables.",
    emailSubject: "Eliminación de cuenta",
    deletedTitle: "Qué eliminamos",
    deletedBody:
      "Tu cuenta y los datos personales vinculados: perfil, email, respuestas del onboarding, preferencias, artículos guardados, watchlist y wallet.",
    keptTitle: "Qué no cambia",
    keptBody:
      "Eliminar la cuenta no cancela una suscripción: cancélala antes en los ajustes del App Store o de Google Play. Los pagos quedan registrados en Apple o Google.",
  },
  fr: {
    navLabel: "Supprimer le compte",
    overline: "Compte",
    title: "Supprimer le compte",
    subtitle:
      "Vous pouvez supprimer votre compte Finzy depuis l'application ou nous le demander par e-mail.",
    inAppTitle: "Depuis l'application",
    steps: [
      "Ouvrez Finzy et connectez-vous à votre compte.",
      "Touchez votre photo de profil pour ouvrir le Profil.",
      "En bas de la page, touchez « Delete account » et confirmez.",
    ],
    inAppNote: "Le compte est supprimé immédiatement et vous êtes déconnecté.",
    emailTitle: "Par e-mail",
    emailBody:
      "Écrivez à {email} depuis l'adresse de votre compte, avec l'objet « Suppression du compte ». Nous supprimons le compte et répondons sous 2 jours ouvrés.",
    emailSubject: "Suppression du compte",
    deletedTitle: "Ce que nous supprimons",
    deletedBody:
      "Votre compte et les données personnelles qui y sont liées : profil, e-mail, réponses de l'onboarding, préférences, articles enregistrés, watchlist et wallet.",
    keptTitle: "Ce qui ne change pas",
    keptBody:
      "Supprimer le compte n'annule pas un abonnement : annulez-le d'abord dans les réglages de l'App Store ou de Google Play. Les paiements restent enregistrés chez Apple ou Google.",
  },
  pt: {
    navLabel: "Eliminar conta",
    overline: "Conta",
    title: "Eliminar a conta",
    subtitle: "Pode eliminar a sua conta Finzy na app ou pedir-nos por email.",
    inAppTitle: "Na app",
    steps: [
      "Abra a Finzy e inicie sessão na sua conta.",
      "Toque na sua foto de perfil para abrir o Perfil.",
      "No fim da página, toque em «Delete account» e confirme.",
    ],
    inAppNote: "A conta é eliminada de imediato e a sessão é terminada.",
    emailTitle: "Por email",
    emailBody:
      "Escreva para {email} a partir do endereço da sua conta, com o assunto «Eliminação de conta». Eliminamos a conta e respondemos até 2 dias úteis.",
    emailSubject: "Eliminação de conta",
    deletedTitle: "O que eliminamos",
    deletedBody:
      "A sua conta e os dados pessoais associados: perfil, email, respostas do onboarding, preferências, artigos guardados, watchlist e wallet.",
    keptTitle: "O que não muda",
    keptBody:
      "Eliminar a conta não cancela uma subscrição: cancele-a antes nas definições da App Store ou do Google Play. Os pagamentos ficam registados na Apple ou na Google.",
  },
};
