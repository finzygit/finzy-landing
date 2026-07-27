import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Serif editoriale per i wordmark di Forbes e la Repubblica (fascia fonti).
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const siteUrl = "https://finzyapp.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "finzy — la tua app per la finanza personale",
    template: "%s · finzy",
  },
  description:
    "finzy ti aiuta a gestire spese, risparmi e obiettivi finanziari in un'unica app semplice e intelligente.",
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: "finzy",
    title: "finzy — la tua app per la finanza personale",
    description:
      "finzy ti aiuta a gestire spese, risparmi e obiettivi finanziari in un'unica app semplice e intelligente.",
  },
  twitter: {
    card: "summary_large_image",
    title: "finzy — la tua app per la finanza personale",
    description:
      "finzy ti aiuta a gestire spese, risparmi e obiettivi finanziari in un'unica app semplice e intelligente.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
