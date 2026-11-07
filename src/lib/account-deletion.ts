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
      "Scrivi a {email} dall'indirizzo del tuo account (o indicalo nel messaggio), con oggetto «Eliminazione account». Ti confermiamo l'eliminazione via email.",
    emailSubject: "Eliminazione account",
    deletedTitle: "Cosa eliminiamo",
    deletedBody:
      "Il tuo account e i dati personali collegati: profilo, email, risposte dell'onboarding, preferenze, articoli salvati, watchlist e wallet.",
    keptTitle: "Cosa resta",
    keptBody:
      "L'eliminazione non annulla un abbonamento: annullalo prima nelle impostazioni dell'App Store o di Google Play. I pagamenti restano registrati da Apple o da Google. Le copie di sicurezza del server vengono cancellate entro 8 giorni.",
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
      "Write to {email} from your account's email address (or tell us that address), with the subject “Account deletion”. We will confirm the deletion by email.",
    emailSubject: "Account deletion",
    deletedTitle: "What we delete",
    deletedBody:
      "Your account and the personal data linked to it: profile, email, onboarding answers, preferences, saved articles, watchlist and wallet.",
    keptTitle: "What stays",
    keptBody:
      "Deleting the account does not cancel a subscription: cancel it first in your App Store or Google Play settings. Payments stay on record with Apple or Google. Server backups are deleted within 8 days.",
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
      "Toca tu foto de perfil.",
      "Al final de la página, toca «Delete account» y confirma.",
    ],
    inAppNote: "La cuenta se elimina al momento y se cierra la sesión.",
    emailTitle: "Por email",
    emailBody:
      "Escribe a {email} desde la dirección de tu cuenta (o indícanosla en el mensaje), con el asunto «Eliminación de cuenta». Te confirmaremos la eliminación por email.",
    emailSubject: "Eliminación de cuenta",
    deletedTitle: "Qué eliminamos",
    deletedBody:
      "Tu cuenta y los datos personales vinculados: perfil, email, respuestas del onboarding, preferencias, artículos guardados, watchlist y wallet.",
    keptTitle: "Qué se conserva",
    keptBody:
      "Eliminar la cuenta no cancela una suscripción: cancélala antes en los ajustes del App Store o de Google Play. Los pagos quedan registrados en Apple o Google. Las copias de seguridad del servidor se borran en un plazo de 8 días.",
  },
  fr: {
    navLabel: "Supprimer le compte",
    overline: "Compte",
    title: "Supprimer votre compte",
    subtitle:
      "Vous pouvez supprimer votre compte Finzy depuis l'application ou nous le demander par e-mail.",
    inAppTitle: "Depuis l'application",
    steps: [
      "Ouvrez Finzy et connectez-vous à votre compte.",
      "Appuyez sur votre photo de profil.",
      "En bas de la page, appuyez sur « Delete account » et confirmez.",
    ],
    inAppNote: "Le compte est supprimé immédiatement et la session est fermée.",
    emailTitle: "Par e-mail",
    emailBody:
      "Écrivez à {email} depuis l'adresse de votre compte (ou indiquez-la dans le message), avec l'objet « Suppression du compte ». Nous vous confirmerons la suppression par e-mail.",
    emailSubject: "Suppression du compte",
    deletedTitle: "Ce que nous supprimons",
    deletedBody:
      "Votre compte et les données personnelles qui y sont liées : profil, e-mail, réponses de l'onboarding, préférences, articles enregistrés, watchlist et wallet.",
    keptTitle: "Ce qui est conservé",
    keptBody:
      "Supprimer le compte n'annule pas un abonnement : annulez-le d'abord dans les réglages de l'App Store ou de Google Play. Les paiements restent enregistrés chez Apple ou Google. Les sauvegardes du serveur sont effacées sous 8 jours.",
  },
  pt: {
    navLabel: "Eliminar conta",
    overline: "Conta",
    title: "Eliminar a conta",
    subtitle: "Pode eliminar a sua conta Finzy na app ou pedir-nos isso por email.",
    inAppTitle: "Na app",
    steps: [
      "Abra a Finzy e inicie sessão na sua conta.",
      "Toque na sua foto de perfil.",
      "No fim da página, toque em «Delete account» e confirme.",
    ],
    inAppNote: "A conta é eliminada de imediato e a sessão é terminada.",
    emailTitle: "Por email",
    emailBody:
      "Escreva para {email} a partir do endereço da sua conta (ou indique-o na mensagem), com o assunto «Eliminação de conta». Confirmamos a eliminação por email.",
    emailSubject: "Eliminação de conta",
    deletedTitle: "O que eliminamos",
    deletedBody:
      "A sua conta e os dados pessoais associados: perfil, email, respostas do onboarding, preferências, artigos guardados, watchlist e wallet.",
    keptTitle: "O que fica",
    keptBody:
      "Eliminar a conta não cancela uma subscrição: cancele-a antes nas definições da App Store ou do Google Play. Os pagamentos ficam registados na Apple ou na Google. As cópias de segurança do servidor são apagadas no prazo de 8 dias.",
  },
};
