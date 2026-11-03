import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { createRequire } from "node:module";

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const RULES = { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules: { "color-contrast": { enabled: false } } };
const violations = (page) => page.evaluate(async (rules) => (await window.axe.run(document, rules)).violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`), RULES);

// The Coming up calendar, the plain-English panel every entry opens, and the tiers diagram. The data service is refused, so everything here comes from the files that ship with
// the site (the calendar and the tiers).
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

test("Coming up is one calendar across the page, and pressing a day lists what is on and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thisWeek/ahead");
  const table = page.getByRole("table", { name: /Sitting days from/ });
  await expect(table).toBeVisible({ timeout: 20000 });
  expect(await table.getByRole("row").count()).toBeGreaterThanOrEqual(5);
  const day = table.getByRole("button", { name: /Commons: sitting/ }).first();
  await day.scrollIntoViewIfNeeded();
  await day.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toContainText(/\d{1,2} \w+/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(day).toBeFocused();
});

test("every entry in the Coming up lists opens a plain-English account of what it is and what it is for", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thisWeek/ahead");
  await page.getByRole("heading", { name: "Bills due to be debated" }).waitFor({ timeout: 20000 });
  const bill = page.getByRole("list", { name: "Bills due to be debated" }).getByRole("button").first();
  await bill.scrollIntoViewIfNeeded();
  await bill.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "What this is" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "What the bill proposes" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "What happens next" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Parliament's site/ })).toHaveAttribute("href", /parliament\.uk/);
  await page.keyboard.press("Escape");
  const hearing = page.getByRole("list", { name: "Committees taking evidence" }).getByRole("button").first();
  await hearing.scrollIntoViewIfNeeded();
  await hearing.click();
  await expect(dialog.getByRole("heading", { name: "What this is" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "What it is for" })).toBeVisible();
  await expect(dialog).not.toContainText(/undefined|null/);
});

test("the tiers diagram has no Explore switch: a band is read straight away and a walk-through starts from the panel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howitworks");
  await page.locator("#tiers").waitFor();
  await page.evaluate(() => document.querySelector("#tiers").scrollIntoView());
  await expect(page.getByRole("button", { name: "Explore", exact: true })).toHaveCount(0);
  await page.locator(".tier-slab").nth(1).click();
  await expect(page.locator(".tier-info-head h3")).toHaveText("UK Government");
  await page.getByRole("button", { name: "A new law" }).click();
  await expect(page.locator(".tier-slab[aria-current='step']")).toHaveCount(1);
  await page.getByRole("button", { name: "A new law" }).click();
  await expect(page.locator(".tier-slab[aria-current='step']")).toHaveCount(0);
});

test("the tiers diagram fits a 320px phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/howitworks");
  await page.locator("#tiers").waitFor();
  await page.evaluate(() => document.querySelector("#tiers").scrollIntoView());
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
});

for (const width of [1280, 390]) {
  test(`the calendar, an open day, an open entry and the tiers walk-through have no accessibility violations at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/thisWeek/ahead");
    const table = page.getByRole("table", { name: /Sitting days from/ });
    await expect(table).toBeVisible({ timeout: 20000 });
    await page.evaluate(AXE);
    expect(await violations(page), "calendar").toEqual([]);
    await table.getByRole("button", { name: /Commons: sitting/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await violations(page), "open day").toEqual([]);
    await page.getByRole("dialog").getByRole("button").nth(1).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "What this is" })).toBeVisible();
    expect(await violations(page), "open entry").toEqual([]);
    await page.goto("/howitworks");
    await page.locator("#tiers").waitFor();
    await page.getByRole("button", { name: "A new money" }).or(page.getByRole("button", { name: "Where the money goes" })).click();
    await page.evaluate(AXE);
    expect(await violations(page), "tiers").toEqual([]);
  });
}

// Today is fixed to a day the calendar covers, so the clock, the timeline and the filter have something to show whatever the real date.
test("Today shows a live clock, a timeline of the day, a house filter and jump buttons that fit a phone", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-04T11:00:00Z") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/thisWeek/now");
  await expect(page.getByText("London time now")).toBeVisible({ timeout: 20000 });
  const timeline = page.getByRole("figure").filter({ hasText: "Today on a clock" });
  await expect(timeline).toBeVisible();
  expect(await timeline.getByRole("button").count()).toBeGreaterThan(0);
  await page.getByRole("group", { name: "Which house to show" }).getByRole("button", { name: "Lords" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.addScriptTag({ content: AXE });
  expect(await violations(page)).toEqual([]);
});

test("Coming up has jump buttons to each part, and a mix bar and bill timelines", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thisWeek/ahead");
  const jump = page.getByRole("navigation", { name: /Jump to bills, committees/ });
  await expect(jump).toBeVisible({ timeout: 20000 });
  await jump.getByRole("button", { name: /Bills due to be debated/ }).click();
  await expect(page.getByRole("heading", { name: "Bills due to be debated", level: 2 })).toBeInViewport({ timeout: 5000 });
  expect(await page.locator(".uc-mix").count()).toBeGreaterThan(0);
  expect(await page.locator(".en-strip").count()).toBeGreaterThan(0);
});
