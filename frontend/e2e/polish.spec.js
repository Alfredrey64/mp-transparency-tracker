import { test, expect } from "@playwright/test";
import { HUBS } from "../src/data/sidebarSections.js";

// Details that make the site look finished rather than merely working, each of which was once wrong and is now held in place: the page heading sits flush under the
// strip of tabs, pages that sit side by side in a menu group are the same width, the legal and Settings pages are centred.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

const hubPages = HUBS.flatMap((h) => h.pages.map(([key]) => key));

for (const width of [1440, 390]) {
  test(`the heading band sits flush under the tabs or the header on every grouped page, at ${width}px`, async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width, height: 900 });
    const off = [];
    for (const key of hubPages) {
      await page.goto(`/${key}`);
      if (!(await page.waitForSelector(".page-hero", { timeout: 8000 }).then(() => true).catch(() => false))) { off.push(`${key}: no heading band`); continue; }
      const d = await page.evaluate(() => {
        const hero = document.querySelector(".page-hero").getBoundingClientRect().top;
        const above = (document.querySelector(".hubtabs") ?? document.querySelector(".site-header")).getBoundingClientRect().bottom;
        return Math.round(hero - above);
      });
      if (d !== 0) off.push(`${key}: ${d}px`);
    }
    expect(off).toEqual([]);
  });
}

test("pages in the same menu group are the same width, so moving between its tabs does not make the page jump", async ({ page }) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: 1920, height: 1000 });
  const widths = async (key) => {
    await page.goto(`/${key}`);
    await page.waitForSelector(".page-hero", { timeout: 8000 }).catch(() => {});
    return page.evaluate(() => { const g = document.querySelector("section[aria-label=\"What you're looking at\"]"); return g ? Math.round(g.getBoundingClientRect().width) : null; });
  };
  const uneven = [];
  for (const hub of HUBS) {
    const seen = new Map();
    for (const [key] of hub.pages) seen.set(key, await widths(key));
    const values = [...seen.values()].filter((v) => v !== null);
    if (values.length > 1 && Math.max(...values) - Math.min(...values) > 2) uneven.push(`${hub.key}: ${[...seen].map(([k, w]) => `${k} ${w}`).join(", ")}`);
  }
  expect(uneven).toEqual([]);
});

for (const path of ["/terms", "/privacy", "/settings"]) {
  test(`${path} is centred on a wide screen, not pushed to the left`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await page.goto(path);
    const box = await page.locator("main h2, main section, main > div > div:nth-of-type(2)").first().boundingBox();
    const left = box.x;
    const right = 1920 - (box.x + box.width);
    expect(Math.abs(left - right), `${path}: ${Math.round(left)}px on the left, ${Math.round(right)}px on the right`).toBeLessThanOrEqual(24);
  });
}

test("the language choice in Settings is a proper segmented control and works", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/settings");
  const seg = page.getByRole("group", { name: "Language" });
  await expect(seg.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  await seg.getByRole("button", { name: "Cymraeg" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
  await expect(seg.getByRole("button", { name: "Cymraeg" })).toHaveAttribute("aria-pressed", "true");
});

test("the language buttons in the accessibility panel are the same size of type as the text-size buttons", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/accessibility");
  const size = (name) => page.getByRole("button", { name, exact: true }).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const language = await size("English");
  const textSize = await size("Standard");
  expect(language).toBeGreaterThanOrEqual(14);
  expect(Math.abs(language - textSize)).toBeLessThanOrEqual(2);
});

test("a group with only two pages shows one 'next' link, not the same page as both previous and next", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/myBallot");
  await page.waitForSelector(".sn, .pf");
  const links = await page.locator(".sn-pn a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(new Set(links).size).toBe(links.length);
});
