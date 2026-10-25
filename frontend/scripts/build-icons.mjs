// Draws the app icons (public/favicon.svg and the PNG sizes) from the Houses of Parliament mark.
//
//   node scripts/build-icons.mjs
//
// The mark is the same silhouette as src/components/LogoMark.jsx. It is scaled down and placed a little above and to the left of the middle,
// because the building is heavier at the bottom and on the right, so it looks centred rather than merely measuring centred. The "any" icons
// carry the mark at 72% of its full size, the padded "maskable" icons (which the phone crops to a circle or rounded square) at 62%.
// A hairline outline in white closes the seams that show where shapes meet once the mark is scaled.
// The PNGs are drawn with Chromium through Playwright, so run `npx playwright install chromium` first if it is not installed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, "../public");
const INDIGO = "#1E4FB8";

// The mark in its own units: it spans x 40 to 456 and y 24 to 430, so its middle is (248, 227).
const SHAPES = `<rect x="56" y="324" width="200" height="100"/><rect x="56" y="306" width="16" height="18"/><rect x="82" y="306" width="16" height="18"/><rect x="108" y="306" width="16" height="18"/><rect x="134" y="306" width="16" height="18"/><rect x="160" y="306" width="16" height="18"/><rect x="186" y="306" width="16" height="18"/><rect x="212" y="306" width="16" height="18"/><rect x="238" y="306" width="16" height="18"/>
    <rect x="282" y="126" width="96" height="16"/><rect x="292" y="142" width="76" height="282"/>
    <polygon points="292,126 330,52 368,126"/>
    <rect x="327" y="24" width="6" height="30"/>
    <circle cx="330" cy="190" r="22" fill="${INDIGO}" stroke="#ffffff" stroke-width="7"/>
    <rect x="396" y="348" width="44" height="76"/><polygon points="396,348 418,306 440,348"/>
    <rect x="40" y="424" width="416" height="6"/>`;
const MIDDLE = [248, 227];
const AT = [250, 238]; // where the middle of the mark goes on the 512 square

function svg({ size, scale, rounded }) {
  const tx = AT[0] - scale * MIDDLE[0];
  const ty = AT[1] - scale * MIDDLE[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512"${rounded ? ' rx="112"' : ""} fill="${INDIGO}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale})" fill="#ffffff" stroke="#ffffff" stroke-width="0.8">
    ${SHAPES}
  </g>
</svg>
`;
}

const PNGS = [
  { file: "icon-512.png", size: 512, scale: 0.72, rounded: false },
  { file: "icon-192.png", size: 192, scale: 0.72, rounded: false },
  { file: "apple-touch-icon.png", size: 180, scale: 0.72, rounded: false },
  { file: "icon-maskable-512.png", size: 512, scale: 0.62, rounded: false },
  { file: "icon-maskable-192.png", size: 192, scale: 0.62, rounded: false },
  { file: "favicon-32.png", size: 32, scale: 0.8, rounded: true },
];

fs.writeFileSync(path.join(PUBLIC, "favicon.svg"), svg({ size: 512, scale: 0.72, rounded: true }));
const browser = await chromium.launch();
const page = await browser.newPage();
for (const p of PNGS) {
  await page.setViewportSize({ width: p.size, height: p.size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg(p)}`);
  await page.screenshot({ path: path.join(PUBLIC, p.file), omitBackground: true, clip: { x: 0, y: 0, width: p.size, height: p.size } });
  console.log(`Wrote public/${p.file}`);
}
await browser.close();
