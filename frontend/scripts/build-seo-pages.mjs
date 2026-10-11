// Builds the pages search engines and link previews can read.
//
// The app uses addresses like /#/answers/why-housing-expensive, and everything after the # is invisible to a crawler or a link preview, so
// every page looks like the home page to them. This writes a small static page for each section of the site and each answer, at
// /p/<page> and /p/answers/<id>, with its own title, description, share image and a plain-text summary. A visitor who lands on one is sent
// straight to the real page; a crawler or a link preview reads the text. It also writes sitemap.xml listing them all.
//
// Run by `npm run build` (see the prebuild step in package.json). The output goes into public/p and public/sitemap.xml, which are not
// kept in git.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PAGE_GUIDES, GUIDE_ALIASES } from "../src/data/pageGuides.js";
import { ANSWERS } from "../src/data/answers.js";

export const SITE = "https://simple-politics.vercel.app";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The sidebar's pages: key, label and hint, read from the source text (that file imports icon components, so it cannot be loaded here).
export function readSidebarPages(source) {
  const pages = [];
  for (const line of source.split("\n")) {
    const m = /\{ key: "([A-Za-z0-9]+)", label: "([^"]+)"/.exec(line);
    if (!m) continue;
    const hint = /hint: "([^"]*)"/.exec(line)?.[1] ?? "";
    pages.push({ key: m[1], label: m[2], hint });
  }
  return pages;
}

export function pageList(sidebarSource) {
  const pages = readSidebarPages(sidebarSource);
  const seen = new Set();
  const out = [{ key: "home", label: "Simple Politics", hint: "A simple breakdown of UK politics", description: "A simple breakdown of UK politics. See who your MP is, who funds them, how they vote and what the numbers say about the country, all explained in plain English from official sources.", hash: "#/" }];
  for (const p of pages) {
    if (seen.has(p.key)) continue;
    seen.add(p.key);
    const guide = PAGE_GUIDES[p.key] ?? PAGE_GUIDES[GUIDE_ALIASES[p.key]];
    out.push({ ...p, description: guide?.what ?? p.hint, why: guide?.why ?? "", hash: `#/${p.key}` });
  }
  return out;
}

function pageHtml({ url, title, description, heading, bodyHtml, go }) {
  return `<!doctype html>
<html lang="en" data-go="${esc(go)}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=12" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=12" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=12" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Simple Politics" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${SITE}/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${SITE}/og-image.png" />
<style>body{margin:0;background:#F0E8D5;color:#191A23;font-family:system-ui,sans-serif;line-height:1.6}main{max-width:720px;margin:0 auto;padding:40px 20px}h1{font-size:30px;line-height:1.2;margin:0 0 12px}a{color:#4F46E5;font-weight:700}p,li{font-size:16px}.k{font-weight:700;color:#5E5C68;font-size:14px;margin:0 0 6px}</style>
</head>
<body>
<main>
<p class="k">Simple Politics</p>
<h1>${esc(heading)}</h1>
${bodyHtml}
<p><a href="${esc(go)}">Open this page on Simple Politics</a></p>
</main>
<script src="/p/go.js" defer></script>
</body>
</html>
`;
}

export function buildSeoPages(outDir, sidebarSource) {
  const pDir = path.join(outDir, "p");
  fs.rmSync(pDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(pDir, "answers"), { recursive: true });
  fs.writeFileSync(path.join(pDir, "go.js"), 'var go = document.documentElement.getAttribute("data-go");\nif (go) location.replace(go);\n');

  const urls = [];
  for (const p of pageList(sidebarSource)) {
    const url = p.key === "home" ? `${SITE}/` : `${SITE}/p/${p.key}`;
    const title = p.key === "home" ? "Simple Politics | A simple breakdown of UK politics" : `${p.label} | Simple Politics`;
    const body = `<p>${esc(p.description)}</p>${p.why ? `<p>${esc(p.why)}</p>` : ""}`;
    if (p.key !== "home") fs.writeFileSync(path.join(pDir, `${p.key}.html`), pageHtml({ url, title, description: p.description, heading: p.label, bodyHtml: body, go: `/${p.hash}` }));
    urls.push({ loc: url, priority: p.key === "home" ? "1.0" : "0.7", freq: p.key === "home" ? "daily" : "weekly" });
  }
  for (const a of ANSWERS) {
    const url = `${SITE}/p/answers/${a.id}`;
    const reasons = a.reasons.map((r) => `<li><strong>${esc(r.title)}.</strong> ${esc(r.text)}</li>`).join("");
    const body = `<p>${esc(a.short)}</p><h2>Why it happens</h2><ul>${reasons}</ul>`;
    fs.writeFileSync(path.join(pDir, "answers", `${a.id}.html`), pageHtml({ url, title: `${a.question} | Simple Politics`, description: a.short, heading: a.question, bodyHtml: body, go: `/#/answers/${a.id}` }));
    urls.push({ loc: url, priority: "0.8", freq: "weekly" });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
  return urls;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = fs.readFileSync(path.join(root, "src/data/sidebarSections.js"), "utf8");
  const urls = buildSeoPages(path.join(root, "public"), source);
  console.log(`Wrote ${urls.length} pages and sitemap.xml to public/`);
}
