import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/store-links";

/**
 * Smart link per il QR code: manda Android su Google Play, iOS su App Store,
 * tutto il resto (desktop) sulla home. 302 così gli scanner non cachano.
 */
export function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";

  if (/android/i.test(ua)) {
    return Response.redirect(GOOGLE_PLAY_URL, 302);
  }
  if (/iphone|ipad|ipod/i.test(ua)) {
    return Response.redirect(APP_STORE_URL, 302);
  }
  return Response.redirect(new URL("/", request.url), 302);
}
