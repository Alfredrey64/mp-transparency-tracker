// Serves the built site (dist/) the way Vercel does: a file or a page's own index.html when there is one, and the home page's index.html for every other address.
// `vite preview` answers every address with the home page's HTML, so it never shows the per-page HTML that scripts/prerender.mjs writes; the speed check runs against this instead,
// so it measures what a visitor is sent.
//
//   node scripts/serve-dist.mjs [port] [distDir]

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

// The file for a request path: the file itself, a folder's index.html, or null.
export function resolveFile(dist, urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\/+$/, "");
  const target = path.join(dist, clean);
  if (target !== dist && !target.startsWith(dist + path.sep)) return null;
  for (const candidate of [target, path.join(target, "index.html"), `${target}.html`]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export function serve(port, dist) {
  const server = http.createServer((req, res) => {
    const file = resolveFile(dist, req.url) ?? path.join(dist, "index.html");
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    const hashed = /\/assets\//.test(file);
    const headers = { "Content-Type": type, "Cache-Control": hashed ? "public, max-age=31536000, immutable" : "no-cache" };
    let body = fs.readFileSync(file);
    // Vercel sends text compressed, and the speed check's slow connection makes the difference between 86 KB and 280 KB of script count.
    if (/^(text|application\/(json|xml))|svg/.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "")) { body = zlib.gzipSync(body); headers["Content-Encoding"] = "gzip"; }
    res.writeHead(200, headers);
    res.end(body);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.argv[2] ?? 4176);
  const dist = path.resolve(process.argv[3] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist"));
  await serve(port, dist);
  console.log(`Serving ${dist} on http://localhost:${port}`);
}
