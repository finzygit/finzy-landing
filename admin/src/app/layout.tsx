import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { ConsoleProvider } from "@/lib/console";
import "./globals.css";

// MOB-1372 (D398, D400): the console is never indexed (noindex here,
// robots.txt «Disallow: /», X-Robots-Tag in nginx) and says nothing about
// Finzy's other modules. Italian only.
export const metadata: Metadata = {
  title: "Finzy · Console",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Suspense>
          <ConsoleProvider>{children}</ConsoleProvider>
        </Suspense>
      </body>
    </html>
  );
}
