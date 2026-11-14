import path from "node:path";
import type { NextConfig } from "next";

// MOB-1372: the admin console is a static export (no Node on the server):
// `next build` writes out/, which nginx serves under a hidden path on
// console.finzyapp.com, with /api/admin forwarded to Laravel on the same
// origin. The path comes from the build environment and is never committed
// (D400: a guessed URL shows nothing; the nginx gate answers 404 too).
const base = (process.env.NEXT_PUBLIC_ADMIN_BASE ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: base || undefined,
  trailingSlash: false,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Its own app inside the landing repo: never let Turbopack climb to the
  // landing's lockfile and take the site as the workspace root.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
