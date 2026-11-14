import path from "node:path";
import type { NextConfig } from "next";

// MOB-1198: the web dashboard is a static export (no Node on the server):
// `next build` writes out/, which nginx serves on app.finzyapp.com with
// /api forwarded to Laravel on the same origin (see README.md).
const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  images: { unoptimized: true },
  // Its own app inside the landing repo: never let Turbopack climb to the
  // landing's lockfile and take the site as the workspace root.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
