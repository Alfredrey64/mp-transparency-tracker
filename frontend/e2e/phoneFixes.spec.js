import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { createRequire } from "node:module";

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

// Things that were wrong on a phone and are checked here so they stay right. Each runs on a 390px-wide touch screen; the data requests are refused so none of it
// depends on the live database.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (r) => r.abort()); });

for (const view of ["darkMoney", "revolvingDoor", "lobbyingRegister", "thinkTanks"]) {
  test(`${view}: no picture needs a sideways scroll`, async ({ page }) => {
    await page.goto(`/${view}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    const wide = await page.evaluate(() => [...document.querySelectorAll("main .st-visual, main .st-visual-wide")].filter((f) => /auto|scroll/.test(getComputedStyle(f).overflowX) && f.scrollWidth > f.clientWidth + 2).map((f) => f.textContent.slice(0, 40)));
    expect(wide, "pictures that scroll sideways").toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("the strip of tabs across the top of a group of pages scrolls sideways, and opens on this page's own tab", async ({ page }) => {
  await page.goto("/honours");
  const strip = page.locator(".hubtabs ul");
  await expect(strip).toBeVisible({ timeout: 15000 });
  const m = await strip.evaluate((ul) => ({ scrolls: ul.scrollWidth > ul.clientWidth + 20, boxWidth: Math.round(ul.getBoundingClientRect().width), start: ul.scrollLeft }));
  expect(m.scrolls, "more tabs than fit").toBe(true);
  expect(m.boxWidth, "the strip is held to the screen's width").toBeLessThanOrEqual(390);
  expect(m.start, "scrolled along to the current tab").toBeGreaterThan(0);
  await strip.evaluate((ul) => { ul.scrollLeft = 0; });
  expect(await strip.evaluate((ul) => ul.scrollLeft)).toBe(0);
});

test("How Parliament works gives a phone the list of stages and no scrolling line, and names who to contact in bold", async ({ page }) => {
  await page.goto("/howitworks");
  await expect(page.getByRole("heading", { name: "How a bill becomes law" })).toBeVisible({ timeout: 15000 });
  expect(await page.locator(".billroute").count(), "no route on a phone").toBe(0);
  await expect(page.getByRole("button", { name: /1st Reading/ })).toBeVisible();
  const bold = await page.locator("h3", { hasText: "Who do I contact?" }).locator("xpath=..").locator("strong").allTextContents();
  expect(bold).toContain("Your council");
  expect(bold).toContain("Your MP");
});

test("How Parliament works keeps the scrolling line on a wide screen", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/howitworks");
  await expect(page.getByRole("heading", { name: "How a bill becomes law" })).toBeVisible({ timeout: 15000 });
  expect(await page.locator(".billroute").count()).toBe(1);
  await ctx.close();
});

test("the Cabinet chart on a phone is a two-column grid of departments", async ({ page }) => {
  const rows = ["Prime Minister", "Chancellor of the Exchequer", "Home Secretary", "Secretary of State for Health and Social Care", "Secretary of State for Education", "Secretary of State for Transport"]
    .map((cabinet_role, id) => ({ id, name: `Person ${id}`, party: "Labour", party_colour: "C8102E", constituency: "X", thumbnail_url: null, cabinet_role, cabinet_role_start_date: "2024-07-05", biography: null }));
  await page.route("**/127.0.0.1:54321/**", (r) => (r.request().url().includes("politicians")
    ? r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(rows) })
    : r.abort()));
  await page.goto("/cabinet");
  const grid = page.locator(".cab-grid");
  await expect(grid).toBeVisible({ timeout: 15000 });
  const boxes = await grid.locator(".cab-node").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), left: Math.round(r.left), width: Math.round(r.width) }; }));
  expect(boxes.length).toBeGreaterThan(3);
  expect(boxes[1].top, "the first two departments share a row").toBe(boxes[0].top);
  expect(boxes[2].top, "the third starts the next row").toBeGreaterThan(boxes[0].top + 50);
  expect(boxes[0].width, "two to a row").toBeLessThan(200);
  expect(await page.locator(".cab-chart").evaluate((c) => c.scrollWidth <= c.clientWidth + 1), "nothing wider than the chart").toBe(true);
});

for (const [name, size] of [["a phone", { width: 390, height: 844 }], ["a desktop", { width: 1280, height: 900 }]]) {
  test(`Party History on ${name}: every party shows its leader, the lineage flow is drawn, and axe (with contrast) finds nothing`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/history");
    await page.locator("main").getByText("Party History & Lineage", { exact: true }).click();
    const cards = page.locator(".ph-card");
    await expect(cards).toHaveCount(12, { timeout: 15000 });
    await expect(page.locator(".ph-led")).toHaveCount(12);
    // scroll through so each card plays its reveal, then check the flows ended up visible
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
    await page.waitForTimeout(2500);
    expect(await page.locator(".ph-card:not([data-go='1'])").count(), "every card has revealed").toBe(0);
    const hidden = await page.locator(".ph-flow li").evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length);
    expect(hidden, "every box in every flow is fully shown").toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no sideways scroll").toBe(true);
    await page.evaluate(AXE);
    const res = await page.evaluate(() => window.axe.run(document.querySelector(".ph"), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
    expect(res.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}
