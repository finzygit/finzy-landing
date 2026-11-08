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
 *
 * «Cosa eliminiamo» e «Cosa resta» seguono AccountDeletionService del
 * backend (finzy-backend #81, MOB-867): non scrivere niente che il backend
 * non fa. Non si cancellano: il cliente RevenueCat (job pronto ma spento
 * finché manca REVENUECAT_SECRET_API_KEY: quando si accende, aggiornare la
 * pagina), i dati di Segment, AppsFlyer, Mixpanel e Firebase Analytics, e il
 * token di Apple (MOB-891). Il registro subscription_webhook_events resta e,
 * per i pagamenti Stripe, contiene email e nome del cliente.
 * Niente tempi dei backup: la scadenza su AWS non è verificabile (MOB-664).
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
      "Eliminiamo il tuo account e questi dati: profilo, email, foto profilo, risposte dell'onboarding, preferenze, notifiche, articoli salvati, watchlist, wallet, Stock Snapshot richiesti e dati inseriti nei calcolatori. Delle letture e dei voti agli articoli resta solo il conteggio, non più collegato a te e senza IP né dispositivo. Questi dati vengono eliminati subito.",
    keptTitle: "Cosa resta",
    keptBody:
      "L'eliminazione non annulla un abbonamento: annullalo prima nelle impostazioni dell'App Store o di Google Play. I pagamenti restano registrati da Apple o da Google. Noi teniamo il registro dei pagamenti per la contabilità; per chi ha pagato con Stripe contiene anche email e nome. Su Stripe restano la scheda cliente e le fatture, come documenti fiscali.",
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
      "We delete your account and this data: profile, email, profile picture, onboarding answers, preferences, notifications, saved articles, watchlist, wallet, requested Stock Snapshots and what you entered in the calculators. For articles you read or rated, only the count stays, no longer linked to you and with no IP address or device. This data is deleted straight away.",
    keptTitle: "What stays",
    keptBody:
      "Deleting the account does not cancel a subscription: cancel it first in your App Store or Google Play settings. Payments stay on record with Apple or Google. We keep our payment log for accounting; for Stripe payments it also holds your email and name. Stripe keeps your customer record and invoices as tax documents.",
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
      "Eliminamos tu cuenta y estos datos: perfil, email, foto de perfil, respuestas del onboarding, preferencias, notificaciones, artículos guardados, watchlist, wallet, Stock Snapshots solicitados y lo que introdujiste en las calculadoras. De los artículos que leíste o valoraste solo queda el recuento, ya no vinculado a ti y sin IP ni dispositivo. Estos datos se eliminan al momento.",
    keptTitle: "Qué se conserva",
    keptBody:
      "Eliminar la cuenta no cancela una suscripción: cancélala antes en los ajustes del App Store o de Google Play. Los pagos quedan registrados en Apple o Google. Nosotros conservamos el registro de pagos para la contabilidad; en los pagos con Stripe incluye también tu email y tu nombre. Stripe conserva tu ficha de cliente y las facturas como documentos fiscales.",
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
      "Nous supprimons votre compte et ces données : profil, e-mail, photo de profil, réponses de l'onboarding, préférences, notifications, articles enregistrés, watchlist, wallet, Stock Snapshots demandés et ce que vous avez saisi dans les calculateurs. Pour les articles lus ou notés, seul le décompte reste, sans lien avec vous, sans IP ni appareil. Ces données sont supprimées immédiatement.",
    keptTitle: "Ce qui est conservé",
    keptBody:
      "Supprimer le compte n'annule pas un abonnement : annulez-le d'abord dans les réglages de l'App Store ou de Google Play. Les paiements restent enregistrés chez Apple ou Google. Nous gardons le registre des paiements pour la comptabilité ; pour les paiements Stripe, il contient aussi votre e-mail et votre nom. Stripe conserve votre fiche client et vos factures comme documents fiscaux.",
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
      "Eliminamos a sua conta e estes dados: perfil, email, foto de perfil, respostas do onboarding, preferências, notificações, artigos guardados, watchlist, wallet, Stock Snapshots pedidos e o que introduziu nas calculadoras. Dos artigos que leu ou avaliou fica só a contagem, já sem ligação a si, sem IP nem dispositivo. Estes dados são eliminados de imediato.",
    keptTitle: "O que fica",
    keptBody:
      "Eliminar a conta não cancela uma subscrição: cancele-a antes nas definições da App Store ou do Google Play. Os pagamentos ficam registados na Apple ou na Google. Nós guardamos o registo de pagamentos para a contabilidade; nos pagamentos com Stripe inclui também o seu email e o seu nome. A Stripe guarda a sua ficha de cliente e as faturas como documentos fiscais.",
  },
};
