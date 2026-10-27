import { test, expect } from "@playwright/test";

// Class codes: a short code (or link, or QR code) that opens a game with the same setup on every device. Nothing is stored or sent, so no network is needed.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

const cards = async (page) => {
  await expect(page.locator(".gm-sq")).toHaveCount(16);
  return page.locator(".gm-sq span").allTextContents();
};

test("every card on the hub shows its code, and typing a code opens that game", async ({ page }) => {
  await page.goto("/teacher/activities");
  await expect(page.locator(".act-code code")).toHaveCount(17);
  const codes = await page.locator(".act-code code").allTextContents();
  expect(codes).toContain("BINGO");
  expect(codes).toContain("QUIZ");

  await page.getByLabel("Got a class code?").fill("  bingo 7 ");
  await page.getByRole("button", { name: "Open the game" }).click();
  await expect(page.getByRole("heading", { name: "Parliament bingo" })).toBeVisible();
  await expect(page.locator(".cc-code")).toHaveText("BINGO-7");
  await expect(page).toHaveURL(/\/teacher\/activities\/BINGO-7$/);
});

test("a code that is not ours is explained, and the hub stays put", async ({ page }) => {
  await page.goto("/teacher/activities");
  await page.getByLabel("Got a class code?").fill("NOPE-3");
  await page.getByRole("button", { name: "Open the game" }).click();
  await expect(page.getByRole("alert")).toContainText("not one of ours");
  await expect(page.locator(".act-card")).toHaveCount(17);
});

test("the code follows the setup, and can be copied as a code or a link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/teacher/activities");
  await page.getByRole("button", { name: /Team quiz/ }).click();
  await expect(page.locator(".cc-code")).toHaveText("QUIZ");

  await page.getByRole("button", { name: "4 teams" }).click();
  await expect(page.locator(".cc-code")).toHaveText("QUIZ-4-10-11");
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.locator(".cc-code")).toHaveText("QUIZ-4-5-11");
  await expect(page).toHaveURL(/\/teacher\/activities\/QUIZ-4-5-11$/);

  await page.getByRole("button", { name: "Copy the code" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Code copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("QUIZ-4-5-11");
  await page.getByRole("button", { name: "Copy the link" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/teacher\/activities\/QUIZ-4-5-11$/);

  await page.getByText("Show the QR code").click();
  await expect(page.getByRole("img", { name: /QR code that opens the game with the code QUIZ-4-5-11/ })).toBeVisible();
});

test("a link opens the game for a pupil, set up as the code says, without the teacher's tabs", async ({ page }) => {
  await page.goto("/teacher/activities/QUIZ-4-5-99");
  await expect(page.getByRole("heading", { name: "Team quiz" })).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(page.locator(".cc")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "4 teams" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Team 4 name")).toBeVisible();

  await page.getByRole("link", { name: "More activities and games" }).click();
  await expect(page.getByRole("heading", { name: "Activities and games" })).toBeVisible();
  await expect(page.getByRole("tablist")).toBeVisible();
});

test("the same code gives two separate devices the same game, and another code a different one", async ({ browser }) => {
  const open = async (code) => {
    const p = await (await browser.newContext()).newPage();
    await p.route("**/127.0.0.1:54321/**", (route) => route.abort());
    await p.goto(`/teacher/activities/${code}`);
    await expect(p.getByRole("heading", { name: "Parliament bingo" })).toBeVisible();
    const words = await cards(p);
    await p.context().close();
    return words;
  };
  const a = await open("BINGO-12");
  const b = await open("BINGO-12");
  const c = await open("BINGO-13");
  expect(a).toHaveLength(16);
  expect(a).toEqual(b);
  expect(c).not.toEqual(a);

  // The quiz asks the same first question on two devices with the same code.
  const firstQuestion = async (code) => {
    const p = await (await browser.newContext()).newPage();
    await p.route("**/127.0.0.1:54321/**", (route) => route.abort());
    await p.goto(`/teacher/activities/${code}`);
    await p.getByRole("button", { name: "Start the quiz" }).click();
    const q = await p.locator(".gm-prompt b").textContent();
    await p.context().close();
    return q;
  };
  expect(await firstQuestion("QUIZ-2-5-77")).toBe(await firstQuestion("QUIZ-2-5-77"));
});

test("a new card in bingo gives a new code that can be shared", async ({ page }) => {
  await page.goto("/teacher/activities");
  await page.getByRole("button", { name: /Parliament bingo/ }).click();
  await expect(page.locator(".cc-code")).toHaveText("BINGO");
  await page.getByRole("button", { name: "Deal a new card" }).click();
  await expect(page.locator(".cc-code")).toHaveText("BINGO-4");
  const words = await cards(page);
  await page.goto("/teacher/activities/BINGO-4");
  expect(await cards(page)).toEqual(words);
});

test("a phone sees the pupil view without scrolling sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/teacher/activities/QUIZ-4-5-99");
  await expect(page.getByRole("heading", { name: "Team quiz" })).toBeVisible();
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  await page.goto("/teacher/activities");
  await page.getByRole("button", { name: /Parliament bingo/ }).click();
  await expect(page.locator(".cc")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
