import fs from "node:fs";
import { test, expect } from "@playwright/test";

// The Coming up page's drawing, in Safari's engine (it sets text wider than Chrome, which is where the words on the calendar crowded together): the line of the Now / Today /
// Coming up stepper runs through the middle of its dots, the house name and its status on a calendar day never touch, and a day's panel has its pictures.
test.use({ browserName: "webkit" });

const busiestDay = () => {
  const { events } = JSON.parse(fs.readFileSync(new URL("../src/data/parliamentCalendar.json", import.meta.url), "utf8"));
  const count = {};
  for (const e of events) if (e.h === "C" || e.h === "L") count[e.d] = (count[e.d] ?? 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
};

async function open(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/thisWeek/ahead");
  await expect(page.locator(".up-cal")).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(600);
}

test("the stepper line runs through the middle of its dots", async ({ page }) => {
  await open(page, 1000);
  const m = await page.evaluate(() => {
    const bar = document.querySelector(".tw-time");
    const b = bar.getBoundingClientRect();
    const line = getComputedStyle(bar, "::before");
    const lineMid = b.top + parseFloat(line.top) + parseFloat(line.height) / 2;
    return [...bar.querySelectorAll("button i")].map((i) => { const r = i.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - lineMid); });
  });
  expect(m.length).toBe(3);
  for (const off of m) expect(off).toBeLessThan(1);
});

for (const width of [1000, 1280]) {
  test(`a calendar day's house name and its status never touch at ${width}px`, async ({ page }) => {
    await open(page, width);
    const bad = await page.evaluate(() => [...document.querySelectorAll(".uc-bar")].flatMap((bar) => {
      const a = bar.querySelector(".uc-hn").getBoundingClientRect();
      const s = bar.querySelector(".uc-st").getBoundingClientRect();
      const stacked = s.top >= a.bottom - 1;
      const gap = stacked ? s.top - a.bottom : s.left - a.right;
      const inside = a.left >= bar.getBoundingClientRect().left && s.right <= bar.getBoundingClientRect().right;
      return gap >= 3 && inside ? [] : [{ text: bar.textContent, gap, inside }];
    }));
    expect(bad).toEqual([]);
  });
}

for (const width of [1000, 375]) {
  test(`a day's panel shows the houses, what is listed and when it starts at ${width}px`, async ({ page }) => {
    await open(page, width);
    const day = Number(busiestDay().slice(8));
    await page.locator(".uc-cell button").filter({ has: page.locator(".uc-date b", { hasText: new RegExp(`^${day}$`) }) }).first().click();
    const box = page.getByRole("dialog");
    await expect(box.locator(".dd-houses p")).toHaveCount(2);
    await expect(box.getByRole("img")).toBeVisible();
    expect(await box.locator(".dd-dot").count()).toBeGreaterThan(0);
    // The panel scrolls inside itself, and nothing in it pushes the page sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const names = await box.locator(".dd-name").evaluateAll((els) => els.map((e) => e.scrollWidth <= e.clientWidth));
    expect(names.every(Boolean)).toBe(true);
    // A dot opens that entry, and Back returns to the day.
    await box.locator(".dd-dot").first().click();
    await expect(page.getByRole("button", { name: "Back to the day" })).toBeVisible();
  });
}

test("a bill's row shows its stages as a ladder", async ({ page }) => {
  await open(page, 390);
  const row = page.locator('.en-row[data-kind="bill"]').first();
  await row.scrollIntoViewIfNeeded();
  expect(await row.locator(".bl-step").count()).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
