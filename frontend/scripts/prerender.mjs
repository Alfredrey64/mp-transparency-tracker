// Gives every page its own HTML after the build.
//
// The site is a single-page app: every address is answered with the same index.html and the browser works out the page from the path. That means a
// search engine or a link preview sees the same title and an empty page for all of them, and a visitor sees nothing until the scripts have run. This
// takes the built dist/index.html and writes a copy for each page (dist/taxRates/vat/index.html and so on) with the page's own title, description and
// share tags, and a plain heading and introduction already in the page. The app replaces that text when it starts, so nothing else changes, but the
// first thing a visitor sees now arrives with the HTML instead of after the scripts. Addresses with no copy of their own (a seat, an MP) are answered with
// the home page's HTML by the rewrite in vercel.json; /pre.js hides its opening text when the address is not the home page.
//
//   node scripts/prerender.mjs [distDir]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { routeEntries, SITE } from "./build-seo-pages.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Written to look like the top of a page in the app, which is where it will be replaced. The description is set a little larger than the app's own
// introduction so the first paint is the largest one on the page.
const CSS = `
.pre{box-sizing:border-box;padding:76px 20px 40px;max-width:820px;margin:0 auto;color:var(--c-ink);font-family:'Public Sans',system-ui,sans-serif}
.pre .k{font-size:13px;font-weight:700;color:var(--c-ink-soft);margin:0}
.pre h1{font-family:'Newsreader',Georgia,serif;font-size:clamp(26px,4vw,34px);line-height:1.2;margin:12px 0 0}
.pre p{font-size:18px;line-height:1.6;color:var(--c-ink-soft);max-width:780px;margin:14px 0 0}
.pre h2{font-size:18px;margin:26px 0 0}
.pre ul{margin:10px 0 0;padding-left:20px;max-width:780px;color:var(--c-ink-soft);line-height:1.6}
@media (min-width:881px){.pre{padding:48px 40px 40px;margin:0 0 0 300px;max-width:1120px}}
`;

export function render(template, entry) {
  const url = `${SITE}${entry.path}`;
  const title = esc(entry.title);
  const description = esc(entry.description);
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);
  const block = `<div class="pre" data-path="${esc(entry.path)}"><p class="k">Simple Politics</p><h1>${esc(entry.heading)}</h1><p>${esc(entry.lead ?? entry.description)}</p>${entry.bodyHtml ?? ""}</div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${block}</div><script src="/pre.js"></script>`).replace("</head>", `<style id="pre-css">${CSS.replace(/\n/g, "")}</style></head>`);
  return html;
}

export function prerender(distDir, sidebarSource) {
  const template = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  if (!template.includes('<div id="root"></div>')) throw new Error("dist/index.html has no empty root to fill.");
  let written = 0;
  for (const entry of routeEntries(sidebarSource)) {
    const file = entry.path === "/" ? path.join(distDir, "index.html") : path.join(distDir, entry.path.replace(/^\//, ""), "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, render(template, entry));
    written += 1;
  }
  return written;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = path.resolve(process.argv[2] ?? path.join(root, "dist"));
  const n = prerender(dist, fs.readFileSync(path.join(root, "src/data/sidebarSections.js"), "utf8"));
  console.log(`Wrote ${n} pages into ${path.relative(process.cwd(), dist) || "."}`);
}
