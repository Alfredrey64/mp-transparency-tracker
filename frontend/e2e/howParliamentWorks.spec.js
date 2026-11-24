import { test, expect } from "@playwright/test";

// The redesigned How Parliament works page: the layers of who is in charge laid out in full, the two Houses as a dot for every member, the MPs taking their seats, the stepper for
// the election, and the job of an MP as cards under three tabs (no rows of drop-downs).

test("who is in charge is four layers, all in view, with the two Houses drawn as a dot for every member", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howitworks");
  await expect(page.locator(".hwk-layer")).toHaveCount(4);
  await expect(page.locator(".hwk-layer").nth(1)).toContainText("The legislature, makes the laws");
  await expect(page.locator(".hwk-house").first()).toContainText("650 elected MPs");
  await expect(page.locator(".hwk-house").nth(1)).toContainText("~800 members");
  await expect(page.locator(".hwk-houses .hwk-dot")).toHaveCount(1450);
  // Nothing on the page is a row of drop-downs any more.
  await expect(page.locator("main button[aria-expanded]:not([aria-label])").filter({ hasText: /Election Called|A Typical Week|1st Reading/ })).toHaveCount(0);
});

// Sixty MPs in three parties, so the chamber has someone to seat.
const MPS = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, name: `Member ${i + 1}`, party: i < 30 ? "Labour" : i < 48 ? "Conservative" : "Liberal Democrat", party_colour: i < 30 ? "E4003B" : i < 48 ? "0087DC" : "FAA61A", constituency: `Place ${i + 1}`, cabinet_role: i === 0 ? "Prime Minister" : null }));

test("the MPs take their seats when the chamber comes into view, and a party can be lit", async ({ page }) => {
  await page.route("**/rest/v1/politicians*", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(MPS) }));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howitworks");
  const plan = page.locator(".chm-plan");
  await plan.scrollIntoViewIfNeeded();
  await expect(plan).toHaveAttribute("data-go", "1");
  const seats = page.locator(".chm-seat");
  await expect(seats).toHaveCount(60);
  // Once they have sat down no seat is left displaced.
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(".chm-seat")].every((c) => { const t = getComputedStyle(c).transform; return t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)"; })), { timeout: 8000 }).toBe(true);
  const chips = page.locator(".chm-chip");
  await chips.first().click();
  await expect(chips.first()).toHaveAttribute("aria-pressed", "true");
  const dimmed = await page.evaluate(() => [...document.querySelectorAll(".chm-seat")].filter((c) => Number(c.style.opacity) < 0.5).length);
  expect(dimmed).toBeGreaterThan(0);
  await chips.first().click();
  await expect(chips.first()).toHaveAttribute("aria-pressed", "false");
});

test("the election is a stepper: next, back, the arrow keys, and a play button", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howitworks");
  const deck = page.locator(".hwk-deck").first();
  await deck.scrollIntoViewIfNeeded();
  await expect(deck.getByRole("tab", { selected: true })).toContainText("Election Called");
  await expect(deck.getByRole("tabpanel")).toContainText("Stage 1 of 6");
  await deck.getByRole("button", { name: "Next stage" }).click();
  await expect(deck.getByRole("tabpanel")).toContainText("Candidates Stand");
  await deck.getByRole("tab", { name: "Government Forms" }).click();
  await expect(deck.getByRole("tabpanel")).toContainText("326+");
  await deck.getByRole("tab", { selected: true }).press("ArrowLeft");
  await expect(deck.getByRole("tabpanel")).toContainText("An MP Is Elected");
  await deck.getByRole("button", { name: "Back" }).click();
  await expect(deck.getByRole("tabpanel")).toContainText("Voters Vote (FPTP)");
  await expect(deck.getByRole("button", { name: "Play the walk-through" })).toBeVisible();
});

test("the job of an MP is three tabs of cards holding all ten topics", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/howitworks");
  const job = page.locator(".hwk-job");
  await job.scrollIntoViewIfNeeded();
  await expect(job.getByRole("tab")).toHaveCount(3);
  const titles = [];
  for (const name of ["The work", "The money", "The rules"]) {
    await job.getByRole("tab", { name }).click();
    await expect(job.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
    titles.push(...(await job.locator(".hwk-card-title").allTextContents()));
  }
  expect(titles).toEqual(["A Typical Week", "Constituency Casework", "Debates, Votes & Committees", "Party & Public Life", "Salary", "Staff & Office Budget", "Expenses (IPSA)", "Pension", "Second Jobs & Outside Earnings", "Resigning"]);
  await expect(job.locator(".hwk-card").first()).toBeVisible();
});

test("on a phone the bill's journey is the stepper, with all ten stages on its track", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/howitworks");
  const decks = page.locator(".hwk-deck");
  await expect(decks).toHaveCount(2);
  const bill = decks.first();
  await expect(bill.getByRole("tab")).toHaveCount(10);
  await bill.getByRole("tab").nth(7).click();
  await expect(bill.getByRole("tabpanel")).toContainText("Ping Pong");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
