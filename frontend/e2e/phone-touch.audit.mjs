// Opens every page in mobile WebKit (an iPhone-sized screen, real touch) and checks four things the other audits do not:
//   1. tap targets: every visible button, control and stand-alone link is at least 24 by 24 CSS pixels (the WCAG 2.2 minimum), counting the invisible larger tap area the site gives buttons;
//      links inside a line of text are left out, as the standard leaves them out;
//   2. turned on its side (844 by 390) the page does not scroll sideways;
//   3. no error is thrown and nothing the site itself serves (a file, an image, a font) fails to load;
//   4. a text field is at least 16px, because Safari zooms the page in when it is given focus if it is smaller.
// Prints what it finds. Usage: node e2e/phone-touch.audit.mjs [baseUrl]      (ONLY=page,page limits it)
import { webkit, devices } from "@playwright/test";
import { PAGE_NAMES } from "./pageList.mjs";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:4178";
const specText = fs.readFileSync(new URL("./phone-layout.spec.js", import.meta.url), "utf8");
const TABS = JSON.parse(specText.match(/const TABS = (\[.*?\]);/s)[1]);
const ONLY = process.env.ONLY?.split(",");
const PAGES = ["home", "list", "partymatch", ...PAGE_NAMES, ...TABS].filter((p, i, a) => a.indexOf(p) === i && (!ONLY || ONLY.includes(p)));
const phone = { ...Object.fromEntries(Object.entries(devices["iPhone 13"]).filter(([k]) => k !== "defaultBrowserType")), reducedMotion: "reduce" };

// Runs in the page.
function audit() {
  const out = { small: [], fields: [] };
  const tag = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
  const name = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.value || "").trim().replace(/\s+/g, " ").slice(0, 30);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0 || e.hasAttribute("hidden") || e.getAttribute("aria-hidden") === "true" || e.inert) return false;
    }
    return true;
  };
  // A link that sits inside a line of text: it has text from its parent on either side.
  const inline = (a) => {
    if (a.tagName !== "A") return false;
    const p = a.parentElement;
    if (!p) return false;
    const own = [...p.childNodes].filter((n) => n !== a && n.nodeType === 3 && n.textContent.trim()).length;
    return own > 0 && getComputedStyle(a).display === "inline";
  };
  for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=radio], [role=checkbox], [tabindex='0']")) {
    if (!visible(el) || el.disabled) continue;
    if (el.closest(".sr-only, .skip-link") || el.matches(".skip-link, [class*='skip']")) continue;
    // The hidden radio/checkbox inside a styled label: the label is the target.
    if (el.matches("input[type=radio], input[type=checkbox]") && el.closest("label")) continue;
    if (inline(el)) continue;
    const r = el.getBoundingClientRect();
    let w = r.width;
    let h = r.height;
    const after = getComputedStyle(el, "::after");
    if (after.content !== "none" && after.position === "absolute") { w = Math.max(w, parseFloat(after.width) || 0); h = Math.max(h, parseFloat(after.height) || 0); }
    const label = el.closest("label");
    if (label) { const lr = label.getBoundingClientRect(); w = Math.max(w, lr.width); h = Math.max(h, lr.height); }
    if (w < 24 || h < 24) out.small.push(`${tag(el)} "${name(el)}" ${Math.round(w)}x${Math.round(h)}`);
    if (el.matches("input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea, select")) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) out.fields.push(`${tag(el)} "${name(el)}" font ${fs}px`);
    }
  }
  return out;
}

const browser = await webkit.launch();
const found = {};
const add = (pg, msg) => (found[pg] ??= []).push(msg);
let n = 0;
for (const pg of PAGES) {
  const ctx = await browser.newContext({ ...phone });
  const page = await ctx.newPage();
  const origin = new URL(base).origin;
  page.on("pageerror", (e) => { if (!/^ResizeObserver loop/.test(e.message)) add(pg, `ERROR ${e.message.slice(0, 120)}`); });
  page.on("response", (r) => { if (r.url().startsWith(origin) && r.status() >= 400) add(pg, `FAILED ${r.status()} ${r.url().replace(origin, "")}`); });
  page.on("requestfailed", (r) => { if (r.url().startsWith(origin) && !/net::ERR_ABORTED|cancelled/i.test(r.failure()?.errorText ?? "")) add(pg, `FAILED ${r.url().replace(origin, "")}`); });
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  try {
    await page.goto(`${base}/${pg === "home" ? "" : pg}`, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("main h1, h1", { timeout: 20000 });
    await page.waitForTimeout(700);
    await page.evaluate(() => window.dispatchEvent(new Event("ons-show-all-cards")));
    await page.waitForTimeout(300);
    const r = await page.evaluate(audit);
    for (const s of r.small.slice(0, 6)) add(pg, `SMALL TARGET ${s}`);
    if (r.small.length > 6) add(pg, `SMALL TARGET ...and ${r.small.length - 6} more`);
    for (const f of r.fields) add(pg, `FIELD ${f}`);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) add(pg, `LANDSCAPE scrolls sideways by ${over}px`);
  } catch (e) {
    add(pg, `COULD NOT OPEN ${e.message.split("\n")[0]}`);
  }
  await ctx.close();
  if (++n % 40 === 0) console.error(`...${n}/${PAGES.length}`);
}
await browser.close();
const bad = Object.keys(found);
console.log(`Checked ${PAGES.length} pages. ${bad.length} with something to look at.\n`);
for (const pg of bad) console.log(`${pg}\n${found[pg].map((m) => `  - ${m}`).join("\n")}\n`);
