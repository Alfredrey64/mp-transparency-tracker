import { test, expect } from "@playwright/test";

// The search box finds what is inside pages as well as their names, opens the page at that section, and says where a page lives in the menus. Pages also
// link to related pages in other sections.

test.beforeEach(async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
});

async function search(page, text) {
  await page.goto("/");
  await page.getByRole("button", { name: "Search the site" }).first().click();
  await page.getByPlaceholder(/Search MPs/).fill(text);
}

test("a word from a section heading finds that section, and the result opens the page at it", async ({ page }) => {
  await search(page, "worried");
  const hit = page.getByRole("button", { name: /What are people worried about/ });
  await expect(hit).toContainText("Laws made by ministers");
  await hit.click();
  await expect(page).toHaveURL(/\/statutoryInstruments$/);
  const heading = page.getByRole("heading", { name: /What are people worried about/ });
  await expect(heading).toBeVisible();
  await expect.poll(async () => Math.round((await heading.boundingBox())?.y ?? -1), { timeout: 10000 }).toBeLessThan(200);
});

test("words can be typed in any order, and a result says where the page lives", async ({ page }) => {
  await search(page, "times waiting");
  const hit = page.getByRole("button", { name: /The NHS/ }).first();
  await expect(hit).toContainText("Britain in numbers");
});

test("pages outside the menus, such as Privacy, can be found", async ({ page }) => {
  await search(page, "cookies");
  await page.getByRole("button", { name: /Privacy policy/ }).first().click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test("a page links to related pages in other sections", async ({ page }) => {
  await page.goto("/auditWatch");
  await page.waitForSelector("h1");
  const related = page.getByRole("navigation", { name: "Related pages" });
  await expect(related).toBeAttached();
  await expect(related.getByRole("link", { name: /Spending by department/ })).toBeAttached();
});
