import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Firma delle URL iniettate dal vecchio "Japanese keyword hack" su WordPress.
// Due forme:
//   - query string sulla root, es. /?goods/191031320, /?jp/062045413.html
//     (sul sito Next tornerebbero 200 = la home)
//   - path di "shop hack", es. /shopdetail/toy/284027327, /category/1063/1,
//     /shopping/087003213, /animetitle/?aid=19360 (ora 404)
// Le trasformiamo tutte in 410 Gone così Google le rimuove in fretta
// dall'indice (procedura consigliata da Google per i siti hackerati).
// Sono tutti prefissi da e-commerce: un'app di finanza non li avrà mai.
const HACK_QUERY = /^\?[a-z_]+\/\d/i;
const HACK_PATH =
  /\.html?$|^\/(?:goods|detail|jp|shopdetail|shopping|category|animetitle|product|item)(?:\/|$)/i;

export function proxy(request: NextRequest) {
  const { search, pathname } = request.nextUrl;

  const isHack =
    HACK_QUERY.test(search) ||
    search.includes(".html") ||
    HACK_PATH.test(pathname);

  if (isHack) {
    return new NextResponse(null, {
      status: 410,
      headers: { "x-robots-tag": "noindex" },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Esegui su tutte le rotte tranne asset statici e file di metadata.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
