import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Alias inglese della pagina contatti: /contatti resta l'URL canonico.
      { source: "/contact", destination: "/contatti", permanent: true },
      // Alias inglese della pagina di eliminazione (MOB-591).
      { source: "/delete-account", destination: "/elimina-account", permanent: true },
    ];
  },
};

export default nextConfig;
