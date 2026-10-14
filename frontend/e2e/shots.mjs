// Saves a picture of the main pages at phone, tablet, laptop, desktop and ultrawide sizes so a person can look at them.
//
//   npm run shots                       the default set of pages
//   npm run shots -- taxRates/vat glossary    particular pages (addresses after the #/)
//
// It builds nothing: run `npm run build` first. It serves dist itself, writes the pictures to screenshots/<size>/ and an index.html that shows
// them side by side. The folder is not committed. The layout audit (npm run test:layout) checks what a machine can check; this is for what it cannot.

import { chromium } from "@playwright/test";
import { preview } from "vite";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const SIZES = [
  { name: "phone", width: 390, height: 844, mobile: true },
  { name: "tablet", width: 820, height: 1180, mobile: true },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
  { name: "ultrawide", width: 3440, height: 1440 },
];
const DEFAULT = ["home", "constituency", "councils", "generalElection", "glossary", "taxRates", "taxRates/council-tax", "taxRates/pay", "taxRates/government/thatcher", "economy", "budget", "howitworks", "settings"];
const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
const slug = (p) => p.replace(/[^a-z0-9]+/gi, "-");

const server = await preview({ preview: { port: 4177, strictPort: true }, build: {} });
const base = `http://localhost:4177`;
const browser = await chromium.launch();
rmSync("screenshots", { recursive: true, force: true });
const done = [];
for (const size of SIZES) {
  mkdirSync(`screenshots/${size.name}`, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, isMobile: Boolean(size.mobile), hasTouch: Boolean(size.mobile), deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  for (const p of pages) {
    await page.goto(p === "home" ? `${base}/` : `${base}/${p}`);
    await page.locator("h1").first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    const file = `screenshots/${size.name}/${slug(p)}.png`;
    // A tall page is cut at five screens so an ultrawide picture stays a sensible size.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: file, fullPage: true, ...(height > size.height * 5 ? { fullPage: false, clip: { x: 0, y: 0, width: size.width, height: size.height * 5 } } : {}) }).catch(async () => page.screenshot({ path: file }));
    done.push({ size: size.name, page: p, file: file.replace("screenshots/", "") });
  }
  await ctx.close();
}
await browser.close();
await server.close();
const rows = pages.map((p) => `<h2>${p}</h2><div class="row">${SIZES.map((s) => `<figure><figcaption>${s.name} ${s.width}</figcaption><img loading="lazy" src="${s.name}/${slug(p)}.png"></figure>`).join("")}</div>`).join("");
writeFileSync("screenshots/index.html", `<!doctype html><meta charset="utf-8"><title>Layout pictures</title><style>body{font-family:system-ui;margin:20px}.row{display:flex;gap:12px;align-items:flex-start;overflow-x:auto}figure{margin:0}img{display:block;border:1px solid #ccc;max-height:900px;width:auto}figcaption{font-size:12px;color:#555;margin-bottom:4px}</style><h1>Layout pictures</h1>${rows}`);
console.log(`Saved ${done.length} pictures. Open screenshots/index.html to look at them.`);
