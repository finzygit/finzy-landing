import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers.ts";

const PRIVACY_POLICY_URL = "https://www.iubenda.com/privacy-policy/68699235";

const nextConfig: NextConfig = {
  // Niente `X-Powered-By: Next.js` (MOB-625): non serve dire chi siamo.
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Tutte le rotte, asset compresi (MOB-625, src/lib/security-headers.ts).
        source: "/(.*)",
        headers: securityHeaders({
          dev: process.env.NODE_ENV === "development",
          vercelPreview: process.env.VERCEL_ENV === "preview",
        }),
      },
    ];
  },
  async redirects() {
    return [
      // Alias inglese della pagina contatti: /contatti resta l'URL canonico.
      { source: "/contact", destination: "/contatti", permanent: true },
      // Alias inglese della pagina di eliminazione (MOB-591).
      { source: "/delete-account", destination: "/elimina-account", permanent: true },
      // Le vecchie copie dei termini dell'app stampano finzyapp.com/privacy-policy
      // (MOB-998): porta alla policy di iubenda, la stessa del footer.
      // Deve restare uguale a PRIVACY_POLICY_URL di src/lib/company.ts
      // (lo controlla src/lib/redirects.test.ts).
      { source: "/privacy-policy", destination: PRIVACY_POLICY_URL, permanent: true },
      { source: "/privacy", destination: PRIVACY_POLICY_URL, permanent: true },
    ];
  },
};

export default nextConfig;
