import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Alias inglese della pagina contatti: /contatti resta l'URL canonico.
      { source: "/contact", destination: "/contatti", permanent: true },
    ];
  },
};

export default nextConfig;
