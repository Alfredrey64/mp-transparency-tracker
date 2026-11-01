// Draws the link-preview image (public/og-image.png, 1200 by 630) that shows when a page is shared.
//
//   node scripts/build-og-image.mjs
//
// The mark is the same silhouette as public/favicon.svg and src/components/LogoMark.jsx. The type is Public Sans, the site's own body font, read from
// public/fonts so the image does not depend on anything installed on the machine. The PNG is drawn with Chromium through Playwright, so run
// `npx playwright install chromium` first if it is not installed. Bump the ?v= on the og:image links in index.html after changing it, so shared links refresh.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "../public");
const INDIGO = "#1E4FB8";
const NAME = "Domesday Live";

const font = fs.readFileSync(path.join(PUBLIC, "fonts/public-sans-latin.woff2")).toString("base64");

const MARK = `<rect x="56" y="324" width="200" height="100"/><rect x="56" y="306" width="16" height="18"/><rect x="82" y="306" width="16" height="18"/><rect x="108" y="306" width="16" height="18"/><rect x="134" y="306" width="16" height="18"/><rect x="160" y="306" width="16" height="18"/><rect x="186" y="306" width="16" height="18"/><rect x="212" y="306" width="16" height="18"/><rect x="238" y="306" width="16" height="18"/>
  <rect x="282" y="126" width="96" height="16"/><rect x="292" y="142" width="76" height="282"/>
  <polygon points="292,126 330,52 368,126"/>
  <rect x="327" y="24" width="6" height="30"/>
  <circle cx="330" cy="190" r="22" fill="#4a3fc9" stroke="#ffffff" stroke-width="7"/>
  <rect x="396" y="348" width="44" height="76"/><polygon points="396,348 418,306 440,348"/>
  <rect x="40" y="424" width="416" height="6"/>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Public Sans"; font-weight: 100 900; src: url(data:font/woff2;base64,${font}) format("woff2"); }
html, body { margin: 0; }
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; color: #fff; font-family: "Public Sans", system-ui, sans-serif;
  background: radial-gradient(900px 600px at 0% 0%, #7a78ef 0%, rgba(122,120,239,0) 70%), linear-gradient(135deg, #6a66e8 0%, #4a3fc9 45%, #2c2487 100%); }
.brand { position: absolute; left: 80px; top: 50px; display: flex; align-items: center; gap: 24px; }
.brand svg { width: 96px; height: 94px; display: block; }
.brand span { font-size: 38px; font-weight: 700; letter-spacing: -0.2px; }
h1 { position: absolute; left: 80px; top: 226px; margin: 0; font-size: 82px; line-height: 1.12; font-weight: 800; letter-spacing: -1.6px; }
h1 i { display: inline-block; width: 22px; height: 22px; border-radius: 50%; background: #ffb84d; margin-left: 8px; }
p { position: absolute; left: 80px; top: 432px; margin: 0; width: 760px; font-size: 28px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,0.88); }
.chips { position: absolute; left: 80px; top: 546px; display: flex; gap: 14px; }
.chips b { background: rgba(255,255,255,0.18); border-radius: 999px; padding: 13px 22px; font-size: 22px; font-weight: 700; }
</style></head><body><div class="card">
  <div class="brand"><svg viewBox="40 24 416 406" fill="#fff" stroke="#fff" stroke-width="0.8">${MARK}</svg><span>${NAME}</span></div>
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
