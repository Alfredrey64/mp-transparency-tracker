import { test, expect } from "@playwright/test";
import { SPIN_ROUNDS, TRICKS, TRACE, TOOLKIT } from "../src/lib/teacherGamesSpin.js";

// Spot the spin: the media-literacy game. It uses nothing from the network.
test.beforeEach(async ({ page }) => { await page.route("**/127.0.0.1:54321/**", (route) => route.abort()); });

const open = (page) => page.goto("/teacher/activities/SPIN");
const stars = (page) => page.locator(".gm-stars svg[data-on='1']").count();

async function playClaim(page, claim, { slip = false } = {}) {
  await expect(page.getByRole("heading", { level: 3, name: claim.headline })).toBeVisible();
  if (slip) {
    const wrongKey = claim.options.find((k) => k !== claim.trick);
    await page.getByRole("button", { name: TRICKS[wrongKey] }).click();
    await expect(page.getByRole("button", { name: TRICKS[wrongKey] })).toBeDisabled();
    await expect(page.locator(".gm-coach")).toContainText("Not that one");
  }
  await page.getByRole("button", { name: TRICKS[claim.trick] }).click();
  await expect(page.getByText("What would you ask?")).toBeVisible();
  await page.getByRole("button", { name: claim.ask[0] }).click();
  await expect(page.locator(".sp-fair")).toContainText("What was hidden");
  await expect(page.locator(".gm-coach")).toContainText(claim.reveal.slice(0, 40));
}

test("every claim can be played to the end, round by round, and the last layer and the four questions follow", async ({ page }) => {
  await open(page);
  for (const [ri, round] of SPIN_ROUNDS.entries()) {
    await expect(page.locator(".gm-score")).toContainText(`Round ${ri + 1} of 3: ${round.title}`);
    for (const [ci, claim] of round.claims.entries()) {
      await playClaim(page, claim);
      await page.getByRole("button", { name: ci === 2 ? "Finish the round" : "Next claim" }).click();
    }
    await expect(page.getByText(`Round ${ri + 1} done: ${round.title}`)).toBeVisible();
    expect(await stars(page)).toBe(3);
    await page.getByRole("button", { name: ri === 2 ? "Trace the source" : `Start round ${ri + 2}` }).click();
  }
  for (const [i, t] of TRACE.entries()) {
    await expect(page.getByText(t.q)).toBeVisible();
    await page.getByRole("button", { name: t.options[t.answer] }).click();
    await expect(page.locator(".gm-coach")).toContainText(t.why.slice(0, 40));
    await page.getByRole("button", { name: i === TRACE.length - 1 ? "See how you did" : "Next puzzle" }).click();
  }
  await expect(page.getByText("You are a spin spotter.")).toBeVisible();
  await expect(page.getByText(/12 of 12 stars/)).toBeVisible();
  for (const [q] of TOOLKIT) await expect(page.locator(".sp-kit")).toContainText(q);

  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByRole("heading", { level: 3, name: SPIN_ROUNDS[0].claims[0].headline })).toBeVisible();
  await expect(page.locator(".gm-score")).toContainText("0 stars so far");
});

test("a wrong answer is explained and costs a star, but never blocks the way on", async ({ page }) => {
  await open(page);
  const [first, ...rest] = SPIN_ROUNDS[0].claims;
  await playClaim(page, first, { slip: true });
  await page.getByRole("button", { name: "Next claim" }).click();
  for (const [i, c] of rest.entries()) {
    await playClaim(page, c);
    await page.getByRole("button", { name: i === 1 ? "Finish the round" : "Next claim" }).click();
  }
  await expect(page.getByText("Round 1 done: Look closely")).toBeVisible();
  expect(await stars(page)).toBe(2);
});

test("a wrong question is turned away kindly, and the right one still works afterwards", async ({ page }) => {
  await open(page);
  const claim = SPIN_ROUNDS[0].claims[0];
  await page.getByRole("button", { name: TRICKS[claim.trick] }).click();
  await page.getByRole("button", { name: claim.ask[1] }).click();
  await expect(page.locator(".gm-coach")).toContainText("it will not help you check the claim");
  await expect(page.locator(".sp-fair")).toHaveAttribute("data-on", "0");
  await page.getByRole("button", { name: claim.ask[0] }).click();
  await expect(page.locator(".sp-fair")).toContainText("What was hidden");
});

test("nothing is given away before the pupil has answered", async ({ page }) => {
  await open(page);
  for (const [, claim] of SPIN_ROUNDS[0].claims.entries()) {
    await expect(page.locator(".sp-fair")).toHaveAttribute("data-on", "0");
    // The words of the fair version are not on the page, hidden or not, until they are earned.
    const before = await page.locator(".sp-card").innerText();
    expect(before).not.toContain("What was hidden");
    await expect(page.locator(".sp-fair")).toHaveAttribute("aria-hidden", "true");
    await page.getByRole("button", { name: TRICKS[claim.trick] }).click();
    await expect(page.locator(".sp-fair")).toHaveAttribute("data-on", "0");
    await page.getByRole("button", { name: claim.ask[0] }).click();
    await page.getByRole("button", { name: /Next claim|Finish the round/ }).click();
  }
});

test("the picture is made up and says so, and names no real paper", async ({ page }) => {
  await open(page);
  await expect(page.locator(".sp-ribbon")).toHaveText("Made-up example");
  await expect(page.locator(".sp-paper")).toHaveText("The Brookvale Bugle");
});

test("the card never changes height when the picture flips, on a laptop or a phone", async ({ page }) => {
  for (const size of [{ width: 1280, height: 800 }, { width: 360, height: 780 }]) {
    await page.setViewportSize(size);
    await open(page);
    for (const round of SPIN_ROUNDS) {
      for (const [ci, claim] of round.claims.entries()) {
        const card = page.locator(".sp-card");
        await expect(card).toBeVisible();
        const before = (await card.boundingBox()).height;
        await page.getByRole("button", { name: TRICKS[claim.trick] }).click();
        await page.getByRole("button", { name: claim.ask[0] }).click();
        await expect(page.locator(".sp-fair")).toContainText("What was hidden");
        await page.waitForTimeout(700);
        const after = (await card.boundingBox()).height;
        expect(Math.abs(after - before), `${size.width}px, ${claim.id}`).toBeLessThanOrEqual(2);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over, `${size.width}px, ${claim.id}`).toBeLessThanOrEqual(0);
        await page.getByRole("button", { name: ci === 2 ? "Finish the round" : "Next claim" }).click();
      }
      await page.getByRole("button", { name: /Start round|Trace the source/ }).click();
    }
  }
});
