// Draws each page's own link-preview image (public/og/<page>-<code>.jpg, 1200 by 630), so a shared link to a page shows that page's heading and summary instead of the site's
// one image. The same look as public/og-image.png (see scripts/ogParts.mjs).
//
//   node scripts/build-page-og.mjs            draws the images that are missing, and removes ones for pages that no longer exist or whose wording has changed
//   node scripts/build-page-og.mjs --all      redraws every image
//   node scripts/build-page-og.mjs --check    draws nothing; exits 1 and lists the pages with no up-to-date image (what the tests use)
//
// Run it after adding a page or changing a page's heading or description (the image is named from them, see ogFileName in build-seo-pages.mjs), and commit public/og. The build
// (npm run build) only reads these images; it cannot draw them, as the build server has no browser. A page with no image just keeps the site's own, so nothing breaks if one is
// missed. The drawing needs Chromium: run `npx playwright install chromium` first if it is not installed.

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { routeEntries, ogFileName } from "./build-seo-pages.mjs";
import { PUBLIC, NAME, MARK, FACES, CARD_BACKGROUND } from "./ogParts.mjs";

const OUT = path.join(PUBLIC, "og");
const here = path.dirname(new URL(import.meta.url).pathname);

export function wanted() {
  const source = fs.readFileSync(path.join(here, "../src/data/sidebarSections.js"), "utf8");
  return routeEntries(source).filter((e) => e.path !== "/").map((e) => ({ entry: e, file: ogFileName(e) }));
}

// The page's own words, sized so a short heading is large and a long one still fits in three lines.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FACES}
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; color: #fff; font-family: "Public Sans", system-ui, sans-serif; background: ${CARD_BACKGROUND}; }
.brand { position: absolute; left: 70px; top: 44px; display: flex; align-items: center; gap: 18px; }
.brand svg { width: 96px; height: 67px; display: block; }
.brand span { font-size: 30px; font-weight: 700; letter-spacing: -0.2px; }
.rule { position: absolute; left: 80px; top: 168px; width: 72px; height: 8px; border-radius: 4px; background: #ffb84d; }
.body { position: absolute; left: 80px; top: 196px; width: 1030px; }
h1 { margin: 0; max-height: 232px; overflow: hidden; font-weight: 800; letter-spacing: -1.4px; line-height: 1.1; }
p { margin: 26px 0 0; width: 960px; font-size: 29px; line-height: 1.38; font-weight: 500; color: rgba(255,255,255,0.9);
  display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.where { position: absolute; left: 80px; bottom: 36px; font-size: 24px; font-weight: 600; color: rgba(255,255,255,0.72); letter-spacing: 0.1px; }
</style></head><body><div class="card" id="card">
  <div class="brand"><svg viewBox="0 0 120 84" fill="none">${MARK}</svg><span>${NAME}</span></div>
  <div class="rule"></div>
  <div class="body"><h1 id="h"></h1><p id="d"></p></div><div class="where" id="w"></div>
</div></body></html>`;

// Runs in the page: puts the words in, shrinks the heading until it fits its box, then gives the description as many lines as fit between the heading and the address line.
function fill({ heading, description, where }) {
  const h = document.getElementById("h");
  const d = document.getElementById("d");
  h.textContent = heading;
  d.textContent = description;
  document.getElementById("w").textContent = where;
  let size = heading.length <= 26 ? 96 : heading.length <= 44 ? 80 : 68;
  h.style.fontSize = `${size}px`;
  while (h.scrollHeight > h.clientHeight + 1 && size > 40) { size -= 2; h.style.fontSize = `${size}px`; }
  const room = 556 - d.getBoundingClientRect().top;
  const lines = Math.max(1, Math.min(3, Math.floor(room / 40)));
  d.style.webkitLineClamp = String(lines);
  return { size, lines, fits: h.scrollHeight <= h.clientHeight + 1 };
}

async function main() {
  const mode = process.argv[2];
  const list = wanted();
  fs.mkdirSync(OUT, { recursive: true });
  const have = new Set(fs.readdirSync(OUT).filter((f) => f.endsWith(".jpg")));
  const missing = list.filter((w) => mode === "--all" || !have.has(w.file));
  if (mode === "--check") {
    if (missing.length) { console.error(`${missing.length} pages have no up-to-date share image:\n${missing.map((w) => `  ${w.entry.path}`).join("\n")}\nRun: node scripts/build-page-og.mjs`); process.exit(1); }
    console.log(`All ${list.length} pages have a share image.`);
    return;
  }
  const keep = new Set(list.map((w) => w.file));
  for (const f of have) if (!keep.has(f)) fs.rmSync(path.join(OUT, f));

  if (!missing.length) { console.log(`All ${list.length} share images are up to date.`); return; }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  let tight = 0;
  for (const { entry, file } of missing) {
    const r = await page.evaluate(fill, { heading: entry.heading, description: entry.description, where: `domesdaylive.co.uk${entry.path}` });
    if (!r.fits) { tight += 1; console.warn(`  heading does not fit even at ${r.size}px: ${entry.path}`); }
    await page.locator("#card").screenshot({ path: path.join(OUT, file), type: "jpeg", quality: 86 });
  }
  await browser.close();
  console.log(`Drew ${missing.length} share images into public/og${tight ? ` (${tight} with a heading that is very long)` : ""}.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await main();
