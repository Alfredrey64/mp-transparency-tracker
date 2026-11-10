// Draws the link-preview image (public/og-image.png, 1200 by 630) that shows when a page is shared.
//
//   node scripts/build-og-image.mjs
//
// The mark is the same open book as src/components/LogoMark.jsx. The type is Public Sans, the site's own body font, and Newsreader for the words on the book, read from
// public/fonts so the image does not depend on anything installed on the machine. The PNG is drawn with Chromium through Playwright, so run
// `npx playwright install chromium` first if it is not installed. Bump the ?v= on the og:image links in index.html after changing it, so shared links refresh.

import path from "node:path";
import { chromium } from "playwright";
import { PUBLIC, NAME, MARK, FACES, CARD_BACKGROUND } from "./ogParts.mjs";

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FACES}
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; color: #fff; font-family: "Public Sans", system-ui, sans-serif;
  background: ${CARD_BACKGROUND}; }
.brand { position: absolute; left: 70px; top: 48px; display: flex; align-items: center; gap: 24px; }
.brand svg { width: 144px; height: 101px; display: block; }
.brand span { font-size: 38px; font-weight: 700; letter-spacing: -0.2px; }
h1 { position: absolute; left: 80px; top: 226px; margin: 0; font-size: 82px; line-height: 1.12; font-weight: 800; letter-spacing: -1.6px; }
h1 i { display: inline-block; width: 22px; height: 22px; border-radius: 50%; background: #ffb84d; margin-left: 8px; }
p { position: absolute; left: 80px; top: 432px; margin: 0; width: 760px; font-size: 28px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,0.88); }
.chips { position: absolute; left: 80px; top: 546px; display: flex; gap: 14px; }
.chips b { background: rgba(255,255,255,0.18); border-radius: 999px; padding: 13px 22px; font-size: 22px; font-weight: 700; }
</style></head><body><div class="card">
  <div class="brand"><svg viewBox="0 0 120 84" fill="none">${MARK}</svg><span>${NAME}</span></div>
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
