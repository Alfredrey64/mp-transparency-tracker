// Draws the link-preview image (public/og-image.png, 1200 by 630) that shows when a page is shared.
//
//   node scripts/build-og-image.mjs
//
// The mark is the same open book as src/components/LogoMark.jsx. The type is Public Sans, the site's own body font, read from
// public/fonts so the image does not depend on anything installed on the machine. The PNG is drawn with Chromium through Playwright, so run
// `npx playwright install chromium` first if it is not installed. Bump the ?v= on the og:image links in index.html after changing it, so shared links refresh.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "../public");
const NAME = "Domesday Live";

const font = fs.readFileSync(path.join(PUBLIC, "fonts/public-sans-latin.woff2")).toString("base64");

// The open book from src/components/LogoMark.jsx at rest, with "UK Politics" on its pages. The words are drawn in the colour behind the mark.
const HOLE = "#4a3fc9";
const WORDS = `font-family="Public Sans" font-size="12.5" font-weight="800" text-anchor="middle" fill="${HOLE}"`;
const LINES = (cx) => [[48, 34], [54, 28], [60, 32]].map(([y, w]) => `<path d="M${cx - w / 2} ${y}h${w}" stroke="${HOLE}" stroke-opacity=".35" stroke-width="1.8" stroke-linecap="round"/>`).join("");
const MARK = `<path d="M58 19C46 11 26 10 6 14V67C26 63 46 64 58 72Z"/><path d="M62 19C74 11 94 10 114 14V67C94 63 74 64 62 72Z"/>
  <path d="M3 71C24 66 46 67 60 76C74 67 96 66 117 71" fill="none" stroke-width="2.6" stroke-linecap="round"/>
  <text x="32" y="39" ${WORDS}>UK</text><text x="88" y="39" ${WORDS}>Politics</text>${LINES(32)}${LINES(88)}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Public Sans"; font-weight: 100 900; src: url(data:font/woff2;base64,${font}) format("woff2"); }
html, body { margin: 0; }
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; color: #fff; font-family: "Public Sans", system-ui, sans-serif;
  background: radial-gradient(900px 600px at 0% 0%, #7a78ef 0%, rgba(122,120,239,0) 70%), linear-gradient(135deg, #6a66e8 0%, #4a3fc9 45%, #2c2487 100%); }
.brand { position: absolute; left: 70px; top: 48px; display: flex; align-items: center; gap: 24px; }
.brand svg { width: 132px; height: 92px; display: block; }
.brand span { font-size: 38px; font-weight: 700; letter-spacing: -0.2px; }
h1 { position: absolute; left: 80px; top: 226px; margin: 0; font-size: 82px; line-height: 1.12; font-weight: 800; letter-spacing: -1.6px; }
h1 i { display: inline-block; width: 22px; height: 22px; border-radius: 50%; background: #ffb84d; margin-left: 8px; }
p { position: absolute; left: 80px; top: 432px; margin: 0; width: 760px; font-size: 28px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,0.88); }
.chips { position: absolute; left: 80px; top: 546px; display: flex; gap: 14px; }
.chips b { background: rgba(255,255,255,0.18); border-radius: 999px; padding: 13px 22px; font-size: 22px; font-weight: 700; }
</style></head><body><div class="card">
  <div class="brand"><svg viewBox="0 0 120 84" fill="#fff" stroke="#fff" stroke-width="0">${MARK}</svg><span>${NAME}</span></div>
  <h1>A simple breakdown<br>of UK politics<i></i></h1>
  <p>Who your MP is, who funds them, how they vote and what the numbers say. In plain English.</p>
  <div class="chips"><b>Your MP</b><b>Follow the money</b><b>The bills</b><b>The numbers</b></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(PUBLIC, "og-image.png"), clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log("Wrote public/og-image.png");
