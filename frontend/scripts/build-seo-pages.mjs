// Builds the pages search engines and link previews can read.
//
// The app's pages are real paths such as /answers/why-housing-expensive. It is a single-page app, so every path is answered with the same index.html;
// scripts/prerender.mjs (run after the build) writes a copy of it for each page with that page's own title, description and text. This file writes the
// older small pages at /p/<page> and /p/answers/<id>, which send a visitor straight on to the real page and which a link preview can read, and
// sitemap.xml listing the real pages. `routeEntries` is the list of pages, shared with the prerender.
//
// Run by `npm run build` (see the prebuild step in package.json). The output goes into public/p and public/sitemap.xml, which are not
// kept in git.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PAGE_GUIDES, GUIDE_ALIASES } from "../src/data/pageGuides.js";
import { ANSWERS } from "../src/data/answers.js";
import { TAXES, GROUPS } from "../src/data/taxCatalogue.js";

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
  const out = [{ key: "home", label: "Simple Politics", hint: "A simple breakdown of UK politics", description: "A simple breakdown of UK politics. See who your MP is, who funds them, how they vote and what the numbers say about the country, all explained in plain English from official sources.", hash: "/" }];
  for (const p of pages) {
    if (seen.has(p.key)) continue;
    seen.add(p.key);
    const guide = PAGE_GUIDES[p.key] ?? PAGE_GUIDES[GUIDE_ALIASES[p.key]];
    out.push({ ...p, description: guide?.what ?? p.hint, why: guide?.why ?? "", hash: `/${p.key}` });
  }
  return out;
}

// The start of some text, cut at the end of a sentence (or a word) so it fits in a search result.
export function clip(text, max = 200) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (stop > 60) return cut.slice(0, stop + 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}\u2026`;
}

// Every page that has an address of its own and something to say before the app starts: { path, title, description, heading, bodyHtml, priority }.
export function routeEntries(sidebarSource) {
  const out = [];
  for (const p of pageList(sidebarSource)) {
    out.push({
      path: p.key === "home" ? "/" : `/${p.key}`,
      title: p.key === "home" ? "Simple Politics | A simple breakdown of UK politics" : `${p.label} | Simple Politics`,
      description: p.description,
      heading: p.key === "home" ? "A simple breakdown of UK politics" : p.label,
      bodyHtml: p.why ? `<p>${esc(p.why)}</p>` : "",
      priority: p.key === "home" ? "1.0" : "0.7", freq: p.key === "home" ? "daily" : "weekly", key: p.key,
    });
  }
  for (const a of ANSWERS) {
    const reasons = a.reasons.map((r) => `<li><strong>${esc(r.title)}.</strong> ${esc(r.text)}</li>`).join("");
    out.push({ path: `/answers/${a.id}`, title: `${a.question} | Simple Politics`, description: a.short, heading: a.question, bodyHtml: `<h2>Why it happens</h2><ul>${reasons}</ul>`, priority: "0.8", freq: "weekly", answer: a.id });
  }
  for (const t of TAXES) {
    const group = GROUPS.find((g) => g.key === t.group);
    const notes = t.notes?.length ? `<h2>Worth knowing</h2><ul>${t.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : "";
    out.push({ path: `/taxRates/${t.id}`, title: `${t.name}: how the rate has changed | Simple Politics`, description: clip(`${t.summary} ${t.about}`, 200), lead: `${group?.label ?? "Tax"}. ${t.about}`, heading: `${t.name}: how the rate has changed`, bodyHtml: notes, priority: "0.6", freq: "monthly", tax: t.id });
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
<style>body{margin:0;background:#F3F5F9;color:#0A1424;font-family:system-ui,sans-serif;line-height:1.6}main{max-width:720px;margin:0 auto;padding:40px 20px}h1{font-size:30px;line-height:1.2;margin:0 0 12px}a{color:#1E4FB8;font-weight:700}p,li{font-size:16px}.k{font-weight:700;color:#5E5C68;font-size:14px;margin:0 0 6px}</style>
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
  for (const e of routeEntries(sidebarSource)) {
    const url = `${SITE}${e.path === "/" ? "/" : e.path}`;
    urls.push({ loc: url, priority: e.priority, freq: e.freq });
    // The older /p/ pages, kept so links already shared keep working. Their canonical address is the real page.
    if (e.key && e.key !== "home") fs.writeFileSync(path.join(pDir, `${e.key}.html`), pageHtml({ url, title: e.title, description: e.description, heading: e.heading, bodyHtml: `<p>${esc(e.lead ?? e.description)}</p>${e.bodyHtml}`, go: e.path }));
    if (e.answer) fs.writeFileSync(path.join(pDir, "answers", `${e.answer}.html`), pageHtml({ url, title: e.title, description: e.description, heading: e.heading, bodyHtml: `<p>${esc(e.lead ?? e.description)}</p>${e.bodyHtml}`, go: e.path }));
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
