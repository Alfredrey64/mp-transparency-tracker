import { test, expect } from "@playwright/test";

// The calendar files on the Coming up page, and a bill's own timeline with its pace line and glossary terms on the stage names. Data requests are answered by the test.
const cors = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" };

test("Coming up offers three calendar files to subscribe to, with the ways in", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/thisWeek/ahead");
  const heading = page.getByRole("heading", { name: "Put this in your calendar" });
  await expect(heading).toBeVisible({ timeout: 20000 });
  const feeds = page.locator(".cf-item");
  await expect(feeds).toHaveCount(3);
  await expect(feeds.nth(0)).toContainText("Bills only");
  await expect(feeds.nth(1)).toContainText("Bills, debates and questions");
  await expect(feeds.nth(2)).toContainText("Everything listed");
  await expect(feeds.nth(0).getByRole("link", { name: /Subscribe/ })).toHaveAttribute("href", "webcal://domesdaylive.co.uk/calendar/parliament-bills.ics");
  await expect(feeds.nth(1).getByRole("link", { name: /Google Calendar/ })).toHaveAttribute("href", /calendar\.google\.com\/calendar\/r\?cid=webcal/);
  await expect(feeds.nth(2).getByRole("link", { name: /Download/ })).toHaveAttribute("href", "/calendar/parliament-everything.ics");
  // The file the link points at is really served, and is a calendar.
  const res = await page.request.get("/calendar/parliament-bills.ics");
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text.startsWith("BEGIN:VCALENDAR")).toBe(true);
  expect(text).toContain("END:VCALENDAR");
  // The jump chips still list only the four kinds of business, not the calendar.
  const chips = await page.locator(".st-chips a, .st-jump a, [aria-label^='Jump to bills']").allTextContents();
  expect(chips.join(" ")).not.toContain("calendar");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: "test-results/calendar-feeds-desktop.png" });
});

test("the calendar section fits a phone and Copy link says it copied", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  await page.route("**/127.0.0.1:54321/**", (r) => r.abort());
  await page.goto("/thisWeek/ahead");
  await expect(page.getByRole("heading", { name: "Put this in your calendar" })).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const first = page.locator(".cf-item").first();
  await first.getByRole("button", { name: /Copy link/ }).click();
  await expect(first.getByRole("button", { name: /Copied/ })).toBeVisible();
  await page.getByRole("heading", { name: "Put this in your calendar" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: "test-results/calendar-feeds-phone.png" });
  await ctx.close();
});

test("a bill's timeline says how long it has been going and explains its stage names", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const bill = { bill_id: 3896, short_title: "Test Private Bill", long_title: "A Bill to do two things; to do another", current_stage: "Committee stage", current_house: "Commons", sponsoring_department: "Test", is_act: false, is_defeated: false, last_updated: "2026-06-24T00:00:00Z", source_url: "https://bills.parliament.uk/bills/3896" };
  await page.route("**/127.0.0.1:54321/**", (r) => {
    const req = r.request();
    if (req.method() === "OPTIONS") return r.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    return r.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(req.url().includes("/bills") ? [bill] : []) });
  });
  await page.goto("/voting");
  await page.getByRole("button", { name: /Test Private Bill/ }).first().click();
  const journey = page.getByText("Its journey so far");
  await expect(journey).toBeVisible({ timeout: 20000 });
  const box = journey.locator("xpath=..");
  // From the first recorded day in the file (27 November 2024) to today.
  await expect(box).toContainText("First recorded 27 November 2024");
  await expect(box).toContainText("days ago");
  await expect(box).toContainText("Latest recorded day: Committee stage, 24 June 2026");
  // The stage names are explained: "1st reading" and "2nd reading" are the glossary's First and Second Reading.
  await expect(box.locator("[data-gloss-term]").first()).toBeVisible();
  const terms = await box.locator("[data-gloss-term]").evaluateAll((els) => els.map((e) => e.dataset.glossTerm));
  expect(terms.join(" ")).toMatch(/First Reading/);
  expect(terms.join(" ")).toMatch(/Second Reading/);
  await box.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await box.screenshot({ path: "test-results/bill-timeline.png" });
});
