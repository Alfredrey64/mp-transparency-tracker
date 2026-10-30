// Checks that the live site is up and working, and says what is wrong if it is not.
//
//   node scripts/check-site.mjs [https://site]      (default: the live site; or set SITE_URL)
//
// It does what a visitor would. Every key address must answer within 15 seconds, the sitemap and manifest must be valid, and a real browser opens
// the busiest pages and fails the check on a script error, a failed request to the data service, the "Something broke on this page" screen, a page
// with no heading, or a home page whose figures did not load or are more than three days old. It reads and loads pages only. It is run every
// few hours by .github/workflows/site-health.yml, which opens an issue when it fails (GitHub emails the repository's owner) and closes it when
// the site is well again.

import { chromium } from "@playwright/test";

const SITE = (process.argv[2] ?? process.env.SITE_URL ?? "https://simple-politics.vercel.app").replace(/\/$/, "");
const problems = [];
const fail = (what) => { problems.push(what); console.log(`FAIL  ${what}`); };
const ok = (what) => console.log(`ok    ${what}`);

async function get(path, { json = false, text = false } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(`${SITE}${path}`, { signal: ctl.signal, headers: { "User-Agent": "simple-politics-site-check" } });
    if (res.status !== 200) { fail(`${path} answered ${res.status}`); return null; }
    const body = json ? await res.json() : text ? await res.text() : null;
    ok(path);
    return body;
  } catch (e) {
    fail(`${path} did not answer (${e.name === "AbortError" ? "no reply in 15 seconds" : e.message})`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 1. Addresses.
for (const p of ["/", "/taxRates", "/taxRates/vat", "/answers/why-housing-expensive", "/glossary", "/robots.txt", "/sw.js", "/p/howtovote"]) await get(p);
const sitemap = await get("/sitemap.xml", { text: true });
if (sitemap !== null && !(sitemap.includes("<urlset") && sitemap.includes("/taxRates/vat"))) fail("sitemap.xml is not a sitemap of the real pages");
const manifest = await get("/manifest.json", { json: true });
if (manifest && !(manifest.name && manifest.icons?.length && manifest.shortcuts?.length)) fail("manifest.json is missing its name, icons or shortcuts");

// 2. Pages in a browser.
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
for (const p of ["/", "/taxRates", "/taxRates/income-tax", "/constituency", "/voting", "/jobs", "/answers"]) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`script error: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400 && /supabase\.co|\/assets\//.test(r.url())) errors.push(`${r.status()} for ${r.url().replace(/\?.*/, "").slice(-70)}`); });
  try {
    const response = await page.goto(`${SITE}${p}`, { waitUntil: "networkidle", timeout: 30000 });
    if (response && response.status() !== 200) errors.push(`answered ${response.status()}`);
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      broke: /Something broke on this page/.test(document.body.innerText),
      text: document.body.innerText,
    }));
    if (info.broke) errors.push("shows the 'Something broke' screen");
    if (info.h1 !== 1) errors.push(`has ${info.h1} main headings, not 1`);
    if (p === "/") {
      const mps = /(\d[\d,]*)\s*\n?\s*MPs tracked/.exec(info.text);
      if (!mps || Number(mps[1].replace(/,/g, "")) < 500) errors.push("the home page figures did not load (MPs tracked)");
      // There are 650 seats, so there can never be more than 650 sitting MPs: more means someone who has left is still in the table (see remove-departed-mps.js).
      else if (Number(mps[1].replace(/,/g, "")) > 650) errors.push(`the home page counts ${mps[1]} MPs for 650 seats, so someone who has left is still listed`);
      const age = /(\d+)d ago\s*\n?\s*last updated/.exec(info.text);
      if (age && Number(age[1]) > 3) errors.push(`the data was last updated ${age[1]} days ago`);
      if (/Updated\s*\n?\s*(\d+) weeks? ago/.test(info.text)) errors.push("the data is weeks old");
    }
  } catch (e) {
    errors.push(`did not load: ${e.message.split("\n")[0]}`);
  }
  if (errors.length) fail(`${p}: ${[...new Set(errors)].join("; ")}`); else ok(`${p} in a browser`);
  await page.close();
}
await browser.close();

console.log(problems.length ? `\n${problems.length} problem${problems.length === 1 ? "" : "s"} on ${SITE}` : `\nEverything is working on ${SITE}`);
process.exit(problems.length ? 1 : 0);
