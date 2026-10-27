import { test, expect } from "@playwright/test";

// The accessibility panel, the pages' foot (refer, print, report), and reading a page aloud.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

test("the panel changes how the site looks, and the choice is remembered", async ({ page }) => {
  await page.goto("/howitworks");
  await page.getByRole("button", { name: /Accessibility: text size/ }).click();
  const dialog = page.getByRole("dialog", { name: "Make the site easier to use" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Larger" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.zoom)).toBe("1.15");
  await dialog.getByRole("switch", { name: "Easy-to-read letters" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-readable", "on");
  await dialog.getByRole("switch", { name: "Stronger contrast" }).click();
  await dialog.getByRole("switch", { name: "Calmer motion" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-calm", "on");
  const font = await page.evaluate(() => getComputedStyle(document.querySelector("main h1, main h2, main p")).fontFamily);
  expect(font).toMatch(/Verdana|Atkinson/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-readable", "on");
  expect(await page.evaluate(() => document.documentElement.style.zoom)).toBe("1.15");

  await page.getByRole("button", { name: /Accessibility: text size/ }).click();
  await page.getByRole("button", { name: "Put everything back to standard" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-readable", "on");
  expect(await page.evaluate(() => document.documentElement.style.zoom)).toBe("");
});

test("larger text never makes a phone page scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/accessibility");
  await page.getByRole("button", { name: "Largest" }).click();
  await page.getByRole("switch", { name: "Roomier text" }).click();
  const zoom = Number(await page.evaluate(() => document.documentElement.style.zoom));
  expect(zoom).toBeLessThanOrEqual(390 / 340 + 0.001);
  for (const path of ["/accessibility", "/howitworks", "/glossary", "/teacher"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), path).toBe(true);
  }
});

test("every page can be referred to, printed and reported", async ({ page }) => {
  await page.goto("/howitworks");
  await expect(page.getByRole("complementary", { name: "Use this page" })).toBeVisible();
  await page.getByRole("button", { name: "Refer to this page" }).click();
  const dialog = page.getByRole("dialog", { name: "Refer to this page" });
  await expect(dialog.locator(".pf-cite")).toContainText(/Simple Politics \(\d{4}\)/);
  await dialog.getByRole("button", { name: "BibTeX" }).click();
  await expect(dialog.locator(".pf-cite")).toContainText("@misc{simplepolitics");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  const report = page.getByRole("link", { name: /Report a problem/ });
  await expect(report).toHaveAttribute("href", /github\.com\/.*\/issues\/new\?title=/);
  await expect(report).toHaveAttribute("target", "_blank");
});

test("a page can be read aloud, with a player that can be stopped", async ({ page }) => {
  await page.addInitScript(() => {
    // Headless browsers have no voices, so a stand-in records what would be spoken.
    window.__spoken = [];
    const synth = { speak: (u) => { window.__spoken.push(u.text); }, cancel() {}, pause() {}, resume() {}, getVoices: () => [] };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await page.goto("/howitworks");
  await page.getByRole("button", { name: /Accessibility: text size/ }).click();
  await page.getByRole("button", { name: "Listen to this page" }).click();
  const bar = page.getByRole("region", { name: "Reading aloud" });
  await expect(bar).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  await expect(page.locator(".ra-now")).toHaveCount(1);
  await bar.getByRole("button", { name: "Forward a paragraph" }).click();
  await bar.getByRole("button", { name: "Stop and close" }).click();
  await expect(bar).toBeHidden();
  await expect(page.locator(".ra-now")).toHaveCount(0);
});

test("the accessibility statement and What's new pages open", async ({ page }) => {
  await page.goto("/accessibility");
  await expect(page.getByRole("heading", { name: "Our accessibility statement" })).toBeVisible();
  await page.goto("/whatsnew");
  await expect(page.getByRole("heading", { name: "What's new", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Make the site easier to use" })).toBeVisible();
});

test("bigger or wider text folds the header's menu into the drawer so nothing overlaps", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/howitworks");
  await expect(page.locator(".site-nav")).toBeVisible();
  await page.getByRole("button", { name: /Accessibility: text size/ }).click();
  await page.getByRole("button", { name: "Largest" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".site-nav")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
