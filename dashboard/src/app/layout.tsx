import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { AppProvider } from "@/lib/app";
import "./globals.css";

// MOB-1198 (FZW-WEB-01): the dashboard is kept out of search engines: a
// noindex meta on every page, plus robots.txt «Disallow: /» (public/) and
// the X-Robots-Tag of the nginx block.
export const metadata: Metadata = {
  title: "Finzy · Dashboard",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Suspense>
          <AppProvider>{children}</AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
