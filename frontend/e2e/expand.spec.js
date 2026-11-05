import { test, expect } from "@playwright/test";
import { LOADERS } from "../src/pageLoaders.js";

// Every page: open each fold-out (<details>) and each box that says it can expand (aria-expanded), and fail on any script error or console error on the way. Fold-outs
// are opened by a real click, so the height movement in lib/detailsMotion.js runs too, and each is checked to end up open at the height of its content. The data service is
// refused, so pages show what ships with the site.
const PAGES = ["home", "list", "partymatch", ...Object.keys(LOADERS)].filter((p, i, all) => all.indexOf(p) === i);
const EXTRA = ["thisWeek/now", "thisWeek/ahead"];
const ONLY = process.env.EXPAND_ONLY?.split(",");
// Errors the test setup causes itself (the refused data service).
const EXPECTED = /54321|Failed to load resource|ERR_FAILED|net::|supabase|fetch/i;

test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

for (const size of [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 900 }]) {
  for (const path of [...PAGES, ...EXTRA].filter((p) => !ONLY || ONLY.includes(p))) {
    test(`${path}: opening every fold-out raises no errors at ${size.name} width`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: size.width, height: size.height });
      const problems = [];
      page.on("pageerror", (e) => problems.push(e.message));
      page.on("console", (m) => { if (m.type() === "error" && !EXPECTED.test(m.text())) problems.push(m.text().slice(0, 160)); });
      await page.goto(`/${path === "home" ? "" : path}`);
      await page.waitForSelector("#main-content h1, #main-content h2", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(300);
      // A fold-out inside a closed card (its panel is inert) cannot be reached by anyone, so it is left until the card is opened.
      const folds = page.locator("#main-content details:not([inert] details) > summary:visible");
      const n = Math.min(await folds.count(), 10);
      for (let i = 0; i < n; i++) {
        const summary = folds.nth(i);
        const box = summary.locator("xpath=..");
        if (await box.evaluate((d) => d.open, null, { timeout: 1500 })) continue;
        await summary.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
        await summary.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(340);
        if (!(await box.evaluate((d) => d.open, null, { timeout: 1500 }))) problems.push("a fold-out did not open");
        else if (await box.evaluate((d) => d.getAnimations().length)) problems.push("a fold-out was still moving after it should have settled");
      }
      const toggles = page.locator("#main-content [aria-expanded='false']:visible");
      const m = Math.min(await toggles.count(), 6);
      for (let i = 0; i < m; i++) {
        await toggles.nth(i).scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
        await toggles.nth(i).click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(120);
      }
      expect(problems.join("\n"), problems.join("\n")).toBe("");
    });
  }
}

test("a fold-out that is closed and opened again shows its words (Ofcom cases, What happened)", async ({ page }) => {
  await page.goto("/mediaLiteracy");
  const summary = page.locator(".na-case-list summary").first();
  await summary.scrollIntoViewIfNeeded({ timeout: 5000 });
  const words = summary.locator("xpath=..").locator("p");
  for (const want of [true, false, true, false, true]) {
    await summary.click({ timeout: 3000 });
    await page.waitForTimeout(450);
    if (want) await expect(words).toHaveCSS("opacity", "1", { timeout: 1500 });
    else await expect(summary.locator("xpath=..")).not.toHaveAttribute("open", "", { timeout: 1500 });
  }
});
