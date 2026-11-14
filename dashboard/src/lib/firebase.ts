// MOB-1198 (FZW-WEB-01): «Accedi con Google» and «Accedi con Apple» through
// the Firebase JS SDK, which gives the same Firebase id_token the app sends;
// the backend verifies it on POST /api/web/social. Behind a config flag: the
// web config comes from the build environment (NEXT_PUBLIC_FIREBASE_*, a
// local .env that is never committed); without it the two buttons are hidden.
// The SDK is loaded only when a button is pressed.

export type SocialProvider = "google" | "apple";

export type FirebaseWebConfig = { apiKey: string; authDomain: string; projectId: string; appId: string };

export function firebaseConfig(env: Record<string, string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}): FirebaseWebConfig | null {
  const c = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
  };
  return c.apiKey && c.authDomain && c.projectId && c.appId ? c : null;
}

type Sdk = { app: typeof import("firebase/app"); auth: typeof import("firebase/auth") };
let sdk: Sdk | null = null;
let loading: Promise<Sdk> | null = null;

/**
 * Loads the SDK ahead of the click (the sign-in page calls it when the
 * config is there): the popup must open inside the click itself, or Safari
 * and Firefox block it.
 */
export function preloadFirebase(): Promise<Sdk> {
  if (sdk) return Promise.resolve(sdk);
  loading ??= Promise.all([import("firebase/app"), import("firebase/auth")]).then(([app, auth]) => (sdk = { app, auth }));
  return loading;
}

/** Opens the provider's window and returns the Firebase id_token for the backend. */
export async function socialIdToken(provider: SocialProvider): Promise<string> {
  const config = firebaseConfig();
  if (!config) throw new Error("Firebase web config missing");
  // Synchronous path when preloaded: signInWithPopup runs within the click.
  const { app: appMod, auth } = sdk ?? (await preloadFirebase());
  const app = appMod.getApps()[0] ?? appMod.initializeApp(config);
  const firebaseAuth = auth.getAuth(app);
  const p = provider === "google" ? new auth.GoogleAuthProvider() : new auth.OAuthProvider("apple.com");
  if (provider === "apple") (p as InstanceType<typeof auth.OAuthProvider>).addScope("email");
  const result = await auth.signInWithPopup(firebaseAuth, p);
  const token = await result.user.getIdToken();
  // The dashboard's session is the backend cookie: drop Firebase's own.
  await auth.signOut(firebaseAuth).catch(() => undefined);
  return token;
}
