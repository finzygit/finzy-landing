// MOB-1198: serves the static export like the nginx block of
// app.finzyapp.com: try_files $uri $uri.html =404, error_page 404 /404.html. /api is answered
// by the tests (page.route); here it is a 404 so nothing leaves the Mac.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "..", "out");
const port = Number(process.env.PORT ?? 3199);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };

function file(p) {
  const full = normalize(join(root, p));
  if (!full.startsWith(root)) return null;
  return existsSync(full) && statSync(full).isFile() ? full : null;
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.startsWith("/api/")) {
    res.writeHead(404, { "Content-Type": "application/json" }).end('{"success":false}');
    return;
  }
  const found = path === "/" ? file("/index.html") : file(path) ?? file(`${path}.html`);
  const hit = found ?? file("/404.html");
  res.writeHead(found ? 200 : 404, { "Content-Type": types[extname(hit)] ?? "application/octet-stream" });
  createReadStream(hit).pipe(res);
}).listen(port, () => console.log(`dashboard on http://localhost:${port}`));
