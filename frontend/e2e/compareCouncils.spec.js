import { test, expect } from "@playwright/test";

// Compare councils uses only the files saved with the site, so there is no network to mock.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

test("a pair in the address shows both councils, line by line, without a verdict", async ({ page }) => {
  await page.goto("/compareCouncils/E06000009~E09000033");
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: "Blackpool", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Westminster", exact: true })).toBeVisible();

  const runs = main.getByRole("group", { name: "Who runs it" });
  await expect(runs).toContainText("Labour majority");
  await expect(runs).toContainText("Conservative majority");
  await expect(main.getByRole("group", { name: "Seats" })).toContainText("needed for a majority");
  await expect(main.getByRole("group", { name: "Next election" })).toContainText(/2027/);

  const tax = main.getByRole("group", { name: /Council tax, Band D/ });
  await expect(tax).toContainText("£2,5");
  await expect(tax).toContainText("£1,050");
  await expect(tax).toContainText("up 66% since 2010 to 11");
  await expect(main.getByText(/Blackpool's bill is £[\d,]+ higher than Westminster's\./)).toBeVisible();

  const dep = main.getByRole("group", { name: "Deprivation" });
  await expect(dep).toContainText("1st");
  await expect(dep).toContainText("of 296 English councils");
  await expect(main.getByText(/region each council is in \(North West and London\)/)).toBeVisible();

  // Nothing says which is better.
  await expect(main).not.toContainText(/better run|worse|winner|best council/i);
  // A screen reader hears whose figure each one is.
  await expect(tax.locator(".sr-only").first()).toHaveText(/Blackpool: /);
});

test("swapping the two changes the address and the order", async ({ page }) => {
  await page.goto("/compareCouncils/E06000009~E09000033");
  await page.getByRole("button", { name: "Swap the two" }).click();
  await expect(page).toHaveURL(/compareCouncils\/E09000033~E06000009$|compareCouncils\/E09000033%7EE06000009$/);
  const heads = await page.locator(".cc-head a").allTextContents();
  expect(heads).toEqual(["Westminster", "Blackpool"]);
});

test("search finds a council and puts it in the address", async ({ page }) => {
  await page.goto("/compareCouncils");
  await expect(page.getByRole("heading", { name: "Pick two councils to begin" })).toBeVisible();
  await page.getByLabel("First council").fill("manch");
  await page.getByRole("button", { name: /^Manchester England/ }).click();
  await page.getByLabel("Second council").fill("leeds");
  await page.getByRole("button", { name: /^Leeds England/ }).click();
  await expect(page).toHaveURL(/E08000003(~|%7E)E08000035$/);
  await expect(page.locator(".cc-head a")).toHaveText(["Manchester", "Leeds"]);
});

test("a suggested pair is one press away", async ({ page }) => {
  await page.goto("/compareCouncils");
  await page.getByRole("button", { name: /Manchester\s*Leeds/ }).click();
  await expect(page.locator(".cc-head a")).toHaveText(["Manchester", "Leeds"]);
});

test("a county council and a council in another nation are explained, not left blank", async ({ page }) => {
  await page.goto("/compareCouncils/E10000016~W06000015");
  const main = page.locator("main");
  await expect(main.getByText("A county council has no bill of its own")).toBeVisible();
  await expect(main.getByText(/Council tax is set differently in Wales/)).toBeVisible();
  await expect(main.getByText(/different nations, whose deprivation indices are built differently/)).toBeVisible();
});

test("nonsense in the address shows the empty state, not an error", async ({ page }) => {
  await page.goto("/compareCouncils/hello~<script>");
  await expect(page.getByRole("heading", { name: "Pick two councils to begin" })).toBeVisible();
  await page.goto("/compareCouncils/E06000009~E99999999");
  await expect(page.getByText("We could not find one of those councils")).toBeVisible();
});

test("a phone sees two aligned columns and never scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/compareCouncils/E06000009~E09000033");
  await expect(page.getByRole("group", { name: /Council tax, Band D/ })).toBeVisible();
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  const boxes = await page.locator(".cc-pair").first().locator("> div").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
  expect(Math.abs(boxes[0] - boxes[1])).toBeLessThanOrEqual(1);
});

test("sits in the Your council group with its sister pages", async ({ page }) => {
  await page.goto("/councils");
  const tabs = page.getByRole("navigation", { name: "Your council" });
  await tabs.getByRole("link", { name: "Compare councils" }).click();
  await expect(page).toHaveURL(/\/compareCouncils$/);
});
