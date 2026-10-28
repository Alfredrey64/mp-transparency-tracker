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

test("the first two What's hidden pages open with differently laid out figure bars, and the two diagrams on the dark money page keep their words inside their boxes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const variant = async (path) => { await page.goto(path); await page.waitForSelector(".st-board"); return page.locator(".st-board").getAttribute("data-variant"); };
  const seen = [await variant("/darkMoney"), await variant("/revolvingDoor"), await variant("/lobbyingRegister"), await variant("/thinkTanks")];
  expect(new Set(seen.slice(0, 2)).size, `the first two bars: ${seen}`).toBe(2);
  expect(seen[0] && seen[1]).toBeTruthy();

  await page.goto("/darkMoney");
  await page.waitForSelector(".st-chapter figure svg");
  const label = page.locator("svg.st-trail-wide text").filter({ hasText: /^the association$/ });
  const fit = await label.evaluate((t) => { const box = t.getBBox(); const pill = t.previousElementSibling.previousElementSibling; return { text: box.width, pill: Number(pill.getAttribute("width")) }; });
  expect(fit.text, "the party's 'the association' label").toBeLessThanOrEqual(fit.pill - 8);
  // Each step on the thresholds picture has room for its title and its line.
  const over = await page.locator("svg:not(.st-trail-tall) foreignObject").evaluateAll((els) => els.filter((f) => f.firstElementChild && f.firstElementChild.getBoundingClientRect().height > f.getBoundingClientRect().height + 1).map((f) => f.textContent.slice(0, 30)));
  expect(over).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`the think tank diagram's 'Independent expert' label fits inside its bar, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/thinkTanks");
    await page.waitForSelector(".st-chapter figure svg", { state: "attached" });
    const fit = await page.locator("svg:visible text").filter({ hasText: /^Independent expert$/ }).evaluate((t) => ({ text: t.getBBox().width, bar: Number(t.previousElementSibling.getAttribute("width")) }));
    expect(fit.text, "the label").toBeLessThanOrEqual(fit.bar - 12);
  });
}

for (const width of [1440, 390]) {
  test(`opening a game from far down the Activities list brings its top into view, and going back does too, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/teacher/activities");
    const cards = page.locator(".act-card");
    await expect(cards).toHaveCount(17);
    const last = cards.nth(12);
    await last.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(900);
    await last.click();
    const heading = page.locator(".act h2");
    await expect(heading).toBeFocused();
    await expect.poll(() => heading.evaluate((h) => Math.round(h.getBoundingClientRect().top))).toBeLessThan(260);
    expect(await heading.evaluate((h) => h.getBoundingClientRect().top)).toBeGreaterThan(0);
    await page.locator(".act-back").click();
    await expect.poll(() => page.locator(".act h2").evaluate((h) => Math.round(h.getBoundingClientRect().top))).toBeLessThan(260);
  });
}

// Every word drawn inside a box on the What's hidden pictures stays inside that box, on a wide screen and on a phone.
for (const width of [1440, 390]) {
  test(`words in the What's hidden pictures stay inside their boxes, at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    const spill = [];
    for (const key of ["darkMoney", "revolvingDoor", "lobbyingRegister", "thinkTanks"]) {
      await page.goto(`/${key}`);
      await page.waitForSelector(".st-chapter figure svg", { state: "attached" });
      const found = await page.evaluate(() => [...document.querySelectorAll("figure svg")].filter((s) => s.getBoundingClientRect().width > 0).flatMap((s) => [...s.querySelectorAll("g")].flatMap((g) => {
        const rect = [...g.children].find((c) => c.tagName === "rect" && c.getAttribute("width"));
        if (!rect) return [];
        const x = Number(rect.getAttribute("x") ?? 0), w = Number(rect.getAttribute("width"));
        return [...g.children].filter((c) => c.tagName === "text").flatMap((t) => {
          const b = t.getBBox();
          return b.x < x + 2 || b.x + b.width > x + w - 2 ? [`${t.textContent.slice(0, 30)} (${Math.round(b.width)} in ${w})`] : [];
        });
      })));
      for (const f of found) spill.push(`${key}: ${f}`);
    }
    expect(spill).toEqual([]);
  });
}

// The pages written as data (components/explainers) all draw, carry a list of sources with links, and fit a phone as well as a wide screen.
import { EXPLAINER_KEYS } from "../src/data/explainerKeys.js";
for (const width of [1440, 390]) {
  test(`every explainer page draws with a heading, sources and no sideways scroll, at ${width}px`, async ({ page }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width, height: 900 });
    const bad = [];
    for (const key of EXPLAINER_KEYS) {
      await page.goto(`/${key}`);
      await page.waitForSelector(".st-chapter", { timeout: 10000 }).catch(() => bad.push(`${key}: did not draw`));
      const r = await page.evaluate(() => ({
        h1: document.querySelector("h1")?.textContent?.length ?? 0,
        links: document.querySelectorAll(".st-sources a[href^='https://']").length,
        side: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      if (!r.h1) bad.push(`${key}: no heading`);
      if (r.links < 1) bad.push(`${key}: no source links`);
      if (r.side > 0) bad.push(`${key}: ${r.side}px sideways`);
    }
    expect(bad).toEqual([]);
  });
}
