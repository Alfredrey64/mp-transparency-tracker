import { test, expect } from "@playwright/test";

// The Welsh version of the site's frame: the language switch, the header and menus, the footer, search, the notice on pages that are English only, and what
// happens when a device has no Welsh voice. Nothing here needs the network.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

test("?lang=cy turns the site's frame Welsh, marks the page as Welsh, and the footer switch turns it back", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/?lang=cy");
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
  const nav = page.getByRole("navigation", { name: "Prif ddewislen" });
  await expect(nav.getByRole("button", { name: "Dysgu" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Eich ardal" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Senedd y DU" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Rhifau Prydain" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dod o hyd i'ch AS" }).first()).toBeVisible();

  const footer = page.locator("footer");
  await expect(footer.getByRole("heading", { name: "Eich ardal" })).toBeVisible();
  await expect(footer).toContainText("Drafft cyntaf yw'r fersiwn Gymraeg");
  await expect(footer.getByRole("link", { name: "Rhoi gwybod am gamgymeriad" })).toHaveAttribute("href", /github\.com\/.*issues\/new/);

  // The strip above the header holds the switch on a wide screen.
  await page.locator(".langbar").getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Learn" })).toBeVisible();
  await expect(footer).not.toContainText("Drafft cyntaf");
  // And the footer has one too.
  await footer.getByRole("button", { name: "Cymraeg" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
});

test("the choice is remembered, and the address can override it either way", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/?lang=cy");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
  await page.goto("/?lang=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  // ?lang=en does not save English over a saved Welsh choice, it only decides this visit.
  expect(await page.evaluate(() => localStorage.getItem("simple-politics-lang"))).toBe("cy");
});

test("a page with no Welsh version says so in both languages and is marked as English, while the frame stays Welsh", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/economy?lang=cy");
  const notice = page.locator(".lang-notice");
  await expect(notice.locator("p[lang='cy']")).toContainText("Mae'r dudalen hon ar gael yn Saesneg yn unig");
  await expect(notice.locator("p[lang='en']")).toContainText("This page is only in English for now");
  await expect(page.locator("main")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
  // The tab title matches the page it names, so it stays in English here.
  await expect(page).toHaveTitle(/^The economy \| Simple Politics$/);
  await expect(page.getByRole("link", { name: "Hafan" }).first()).toBeVisible();
});

test("no notice on an English page, and none appears in English mode", async ({ page }) => {
  await page.goto("/economy");
  await expect(page.locator(".lang-notice")).toHaveCount(0);
  await expect(page.locator("main")).not.toHaveAttribute("lang", "en");
});

test("the Welsh header never collides with itself or scrolls sideways, at any width", async ({ page }) => {
  for (const width of [1101, 1280, 1366, 1400, 1401, 1440, 1536, 1700, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/howtovote?lang=cy");
    await expect(page.locator(".site-header")).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, `${width}px sideways scroll`).toBeLessThanOrEqual(0);
    // Whatever is visible in the bar sits in its own space: no two boxes overlap.
    const boxes = await page.evaluate(() => {
      const kids = [...document.querySelectorAll(".site-bar > *, .site-nav > button, .site-actions > *")].filter((e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== "none");
      return kids.filter((e) => !e.matches(".site-actions, .site-nav")).map((e) => { const r = e.getBoundingClientRect(); return { n: e.className || e.textContent, l: r.left, r: r.right, t: r.top, b: r.bottom }; });
    });
    for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i]; const b = boxes[j];
      const overlap = a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
      expect(overlap, `${width}px: ${a.n} overlaps ${b.n}`).toBe(false);
    }
    const folded = await page.locator(".site-burger").isVisible();
    expect(folded, `${width}px folds into the menu button ${width <= 1400 ? "" : "not "}`).toBe(width <= 1400);
  }
});

test("English keeps its full header at 1280", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howtovote");
  await expect(page.locator(".site-burger")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

test("on a phone the menu holds the language switch, and it works both ways", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator(".langbar")).toBeHidden();
  await page.getByRole("dialog", { name: "Site menu" }).getByRole("button", { name: "Cymraeg" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
  // The menu's own name is now Welsh too.
  const drawer = page.getByRole("dialog", { name: "Dewislen y safle" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", { name: "English" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Dod o hyd i'ch AS" })).toBeVisible();
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  await drawer.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("search is in Welsh, and finds a page by its Welsh name", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/?lang=cy");
  await expect(page.getByRole("button", { name: "Chwilio'r safle" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("/");
  const box = page.getByRole("dialog", { name: "Chwilio'r safle" });
  await expect(box).toBeVisible();
  await expect(box.getByPlaceholder(/Chwilio ASau, seddi, etholiadau/)).toBeVisible();
  await box.getByRole("searchbox").fill("etholiadau lleol");
  await expect(box.getByRole("button", { name: "Etholiadau lleol", exact: true })).toBeVisible();
});

test("with no Welsh voice on the device, reading aloud says so instead of using an English voice", async ({ page }) => {
  await page.addInitScript(() => {
    const spoken = [];
    window.__spoken = spoken;
    const synth = { speak(u) { spoken.push(u.lang); }, cancel() {}, pause() {}, resume() {}, getVoices: () => [{ lang: "en-GB", name: "English" }], addEventListener() {} };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/accessibility?lang=cy");
  await page.getByRole("button", { name: "Gwrando ar y dudalen hon" }).first().click();
  const player = page.getByRole("region", { name: "Darllen yn uchel" });
  await expect(player).toContainText("Nid oes llais Cymraeg ar y ddyfais hon");
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0);
});

test("with a Welsh voice, it reads in Welsh", async ({ page }) => {
  await page.addInitScript(() => {
    const spoken = [];
    window.__spoken = spoken;
    const synth = { speak(u) { spoken.push({ lang: u.lang, voice: u.voice?.name }); }, cancel() {}, pause() {}, resume() {}, getVoices: () => [{ lang: "en-GB", name: "English" }, { lang: "cy-GB", name: "Cymraeg" }], addEventListener() {} };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/accessibility?lang=cy");
  await page.getByRole("button", { name: "Gwrando ar y dudalen hon" }).first().click();
  await expect(page.getByRole("region", { name: "Darllen yn uchel" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__spoken[0])).toEqual({ lang: "cy-GB", voice: "Cymraeg" });
});

test("the accessibility panel has a language choice too, and the strip is not there on a folded header", async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 900 });
  await page.goto("/");
  await expect(page.locator(".langbar")).toBeVisible();
  await page.getByRole("button", { name: /Accessibility: text size/ }).click();
  const panel = page.getByRole("dialog", { name: "Make the site easier to use" });
  await panel.getByRole("button", { name: "Cymraeg" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "cy");
  await expect(page.getByRole("dialog", { name: "Gwneud y safle'n haws ei ddefnyddio" }).getByRole("heading", { name: "Iaith" })).toBeVisible();
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(page.locator(".langbar")).toBeHidden();
});
