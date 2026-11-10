import { test, expect } from "@playwright/test";

// How to get something done opens with a short question-by-question guide; the council budget page is a ring chart whose slices open; the think tank scale takes you to a
// think tank's card; opening a council, or anything else within a page, starts at its top; and the MP page's two columns share the width when the left one is short.

test("the guide asks questions, then marks where you are on the route", async ({ page }) => {
  await page.goto("/getThingsDone");
  await expect(page.getByRole("heading", { name: "What do you need help with?" })).toBeVisible();
  await page.getByRole("button", { name: /A council service/ }).click();
  await expect(page.getByRole("heading", { name: "Where do you live?" })).toBeFocused();
  await page.getByRole("button", { name: /^England/ }).click();
  await page.getByRole("button", { name: /Anything else the council does/ }).click();
  await page.getByRole("button", { name: /complained to the service/ }).click();
  await expect(page.getByRole("heading", { name: /Complain to the council, then the Ombudsman/ })).toBeVisible();
  await expect(page.getByText("You are here. Do this next")).toBeVisible();
  await expect(page.locator(".gf-step[data-state='now'] b")).toHaveText("Then the complaints officer");
  await expect(page.locator(".gf-step[data-state='done']")).toHaveCount(1);
  // An earlier answer can be changed from the trail.
  await page.getByRole("button", { name: /Where do you live\? England/ }).click();
  await expect(page.getByRole("heading", { name: "Where do you live?" })).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: "What do you need help with?" })).toBeVisible();
});

test("the guide's information request route can start from any step", async ({ page }) => {
  await page.goto("/getThingsDone");
  await page.getByRole("button", { name: /information from a public body/ }).click();
  await page.getByRole("button", { name: /They refused or I disagree/ }).click();
  await expect(page.locator(".gf-step[data-state='now'] b")).toHaveText("If you are unhappy, ask for an internal review");
  await expect(page.locator(".gf-step[data-state='done']")).toHaveCount(3);
  await page.getByRole("button", { name: "Read the full guide for this" }).click();
  await expect(page.locator("#st-h-5")).toBeInViewport();
});

test("the council budget page is a ring chart whose slices open", async ({ page }) => {
  await page.goto("/councilSpending");
  await expect(page.getByRole("region", { name: "At a glance" })).toHaveCount(0);
  const ring = page.getByRole("img", { name: /Council spending on services in England/ });
  await expect(ring).toBeVisible();
  const row = page.getByRole("button", { name: /Adult social care/ });
  await expect(row).toHaveAttribute("aria-expanded", "false");
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/councils themselves are responsible for arranging it/).first()).toBeVisible();
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "false");
});

test("opening a council from the list starts at the top of its page", async ({ page }) => {
  await page.goto("/councils");
  const first = page.locator("#all-councils button.nclick").first();
  await first.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
  await first.click();
  await expect(page).toHaveURL(/\/councils\/.+/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20);
});

test("the think tank scale takes you to the card for a think tank", async ({ page }) => {
  await page.goto("/thinkTanks");
  const chip = page.getByRole("button", { name: /^IFS, grade A/ });
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  await expect(page.locator("#tt-case-institute-for-fiscal-studies-ifs")).toBeInViewport();
});

test("on the MP page, cards flow under a short left column on a wide screen and stack on a phone", async ({ browser }) => {
  const mp = { id: 1, name: "Test Member", party: "Labour", party_colour: "C8102E", constituency: "Testville", thumbnail_url: null, parliament_member_id: 1, cabinet_role: null };
  for (const [viewport, wide] of [[{ width: 1280, height: 900 }, true], [{ width: 390, height: 844 }, false]]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.route("**/127.0.0.1:54321/**", (r) => {
      const wantsOne = (r.request().headers().accept ?? "").includes("pgrst.object");
      const body = r.request().url().includes("/politicians") ? (wantsOne ? mp : [mp]) : [];
      return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    });
    await page.goto("/mp/1");
    await expect(page.locator(".pg-grid")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const left = document.querySelector(".pg-left").getBoundingClientRect();
      const cells = [...document.querySelectorAll(".pg-cell")].map((c) => c.getBoundingClientRect()).filter((r) => r.height > 1);
      return { left: left.left, bottom: left.bottom, cells: cells.map((r) => ({ x: r.left, top: r.top, w: r.width })) };
    });
    const underLeft = m.cells.filter((c) => Math.abs(c.x - m.left) < 4 && c.top >= m.bottom - 1);
    if (wide) expect(underLeft.length, "some cards sit under the short left column").toBeGreaterThan(0);
    else expect(m.cells.every((c) => Math.abs(c.x - m.left) < 4), "one column on a phone").toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "no sideways scroll").toBe(true);
    await ctx.close();
  }
});
