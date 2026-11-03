import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { createRequire } from "node:module";
import { LOADERS } from "../src/pageLoaders.js";

// Runs the axe accessibility checker (WCAG 2.1 A and AA, plus its best-practice rules) on every page, at a phone and a desktop width, and fails on anything it calls a
// violation: missing names on buttons and links, images without text, form fields without labels, headings out of order, landmarks missing or repeated, bad ARIA, and the
// like. Colour contrast has its own test (contrast.spec.js), so it is left out here. It cannot judge everything (reading order, meaning of alt text), so it complements, not
// replaces, trying the site with a keyboard and a screen reader.
const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const PAGES = ["home", "list", "partymatch", ...Object.keys(LOADERS)].filter((p, i, all) => all.indexOf(p) === i);
const EXTRA = ["thisWeek/now", "thisWeek/ahead", "upcoming"];
// AXE_ONLY=howitworks,thisWeek/ahead checks just those pages, for a quick run while working on them.
const ONLY = process.env.AXE_ONLY?.split(",");

test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

for (const size of [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 900 }]) {
  test(`axe finds no violations on any page at ${size.name} width`, async ({ page }) => {
    test.setTimeout(900000);
    await page.setViewportSize({ width: size.width, height: size.height });
    const found = {};
    for (const path of [...PAGES, ...EXTRA].filter((p) => !ONLY || ONLY.includes(p))) {
      await page.goto(`/${path === "home" ? "" : path}`);
      await page.waitForSelector("#main-content h1, #main-content h2", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(600);
      await page.evaluate(AXE);
      const res = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }));
      for (const v of res.violations) {
        const key = `${v.id} (${v.impact}): ${v.help}`;
        (found[key] ??= []).push(`${path}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
      }
    }
    const report = Object.entries(found).map(([k, v]) => `${k}\n   ${v.length} page(s), for example ${v.slice(0, 4).join("\n     ")}`).join("\n");
    expect(report, report).toBe("");
  });
}
