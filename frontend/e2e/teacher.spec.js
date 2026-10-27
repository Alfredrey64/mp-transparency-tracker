import { test, expect } from "@playwright/test";

// Teacher mode's presenter must never move anything when you click Next, Back or answer a question: the picture, the words and the buttons
// stay exactly where they were from the first slide to the last, on a phone and on a large screen.
for (const [name, viewport, touch] of [["phone", { width: 390, height: 844 }, true], ["laptop", { width: 1366, height: 768 }, false], ["desktop", { width: 1920, height: 1080 }, false]]) {
  test.describe(name, () => {
    test.use({ viewport, hasTouch: touch, isMobile: touch });

    test(`the presenter keeps everything in place from start to finish (${name})`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
      await page.goto("/teacher");
      await page.getByRole("button", { name: "Start the lesson" }).click();
      const root = page.locator(".t-root");
      await expect(root).toBeVisible();

      const boxes = () => page.evaluate(() => {
        const r = (s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b ? [b.x, b.y, b.width, b.height].map(Math.round).join(",") : "none"; };
        return { stage: r(".t-stage"), caption: r(".t-caption"), back: r(".t-bottom .btn-secondary"), top: r(".t-top"), wide: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      const first = await boxes();
      expect(first.wide, "the page scrolls sideways").toBe(false);

      let steps = 0;
      let voted = false;
      for (; steps < 140; steps++) {
        const now = await boxes();
        expect({ ...now, wide: false }, `nothing may move (step ${steps})`).toEqual({ ...first, wide: false });
        if (await page.locator(".t-votebox").count() && !voted) {
          // The class vote: tapping the buttons grows the columns, and nothing else moves.
          voted = true;
          for (const n of [0, 1, 0, 0, 1]) { await page.locator(".t-vote").nth(n).click(); expect({ ...(await boxes()), wide: false }, "voting moves nothing").toEqual({ ...first, wide: false }); }
          await page.getByRole("button", { name: "Start again" }).click();
        }
        if (await page.locator(".t-quiz").count()) break;
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(60);
      }
      expect(voted, "the class vote is in the lesson").toBe(true);
      expect(steps, "the lesson has plenty to go through").toBeGreaterThan(40);

      // The quiz: answer every question, and nothing moves while doing it.
      for (let q = 0; q < 5; q++) {
        await page.locator(".t-option").first().click();
        expect({ ...(await boxes()), wide: false }).toEqual({ ...first, wide: false });
        await page.locator(".t-quiz .btn-primary").click();
      }
      await expect(page.locator(".t-title")).toContainText("out of 5");

      await page.keyboard.press("Escape");
      await expect(root).toBeHidden();
      expect(errors, "no uncaught errors").toEqual([]);
    });
  });
}

test("the notes button shows a question for the class", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher");
  await page.getByRole("button", { name: "Start this chapter" }).first().click();
  await page.getByRole("button", { name: "Notes" }).click();
  await expect(page.getByRole("complementary", { name: "Notes for the teacher" })).toContainText("Can you think of something in your own life");
});

test("the teacher can rename the children in the middle of a lesson without the slides moving on", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher");
  await page.getByRole("button", { name: "Start the lesson" }).click();
  // Go to the first story, where the names are used.
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  const title = () => page.locator(".t-kicker").textContent();
  const before = await title();
  await page.getByRole("button", { name: "Names" }).click();
  const box = page.locator(".t-names").getByLabel(/The weekly shop/);
  await box.fill("Priya");
  // Arrow keys inside the box move the cursor and do not change slide.
  await box.press("ArrowLeft");
  await box.press("ArrowRight");
  expect(await title()).toBe(before);
  await expect(page.locator(".t-svg")).toContainText("Priya");
  await page.getByRole("button", { name: "Names" }).click();
  await expect(page.locator(".t-captionbody")).toContainText("Priya");
});

test("names for the stories can come from a pasted class list", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher");
  await page.getByText("Use names from my class").click();
  await page.locator("#tm-classlist").fill("Ava\nKofi\nPriya\nOllie\nZara");
  await page.getByRole("button", { name: "Pick four at random" }).click();
  const names = await page.locator(".tm-names-grid input").evaluateAll((els) => els.map((e) => e.value));
  expect(new Set(names).size).toBe(4);
  for (const n of names) expect(["Ava", "Kofi", "Priya", "Ollie", "Zara"]).toContain(n);
});

test("no glossary underlining or buttons are made inside the lesson, so no words break apart", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher");
  await page.getByRole("button", { name: "Start the lesson" }).click();
  for (let i = 0; i < 70; i++) {
    expect(await page.locator(".t-root .gloss-term").count()).toBe(0);
    await page.keyboard.press("ArrowRight");
  }
});

test("a chapter link opens that chapter straight away, and the notes carry questions and a level switch", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher/parliament");
  await expect(page.locator(".t-root")).toBeVisible();
  await expect(page.locator(".t-kicker").first()).toContainText("Chapter 3 of 5");
  await page.getByRole("button", { name: "Notes" }).click();
  await expect(page.getByRole("complementary", { name: "Notes for the teacher" })).toContainText("Can the Lords stop a law?");
  await page.getByRole("radio", { name: "Younger" }).click();
  await expect(page.locator(".t-level-chip")).toContainText("Younger");
  await page.getByRole("radio", { name: "Standard" }).click();
  await expect(page.locator(".t-level-chip")).toHaveCount(0);
});

test("the class can announce an election result area by area, and run a petition", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher/activities");
  await page.getByRole("button", { name: /Run a mock election/ }).click();
  await page.getByRole("button", { name: "Start voting" }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /Add a vote for The Sunshine Party in area 1/ }).click();
  await page.getByRole("button", { name: "Election night: announce the results" }).click();
  await expect(page.getByText("Nobody has won yet.")).toBeVisible();
  await page.getByRole("button", { name: "Declare the next area" }).click();
  await expect(page.getByText("The Sunshine Party wins").first()).toBeVisible();
  await page.getByRole("button", { name: /All activities and games/ }).click();
  await page.getByRole("button", { name: /Run a petition/ }).click();
  await page.getByRole("button", { name: /A class of 30 signs/ }).click();
  await expect(page.locator(".cp-count")).toHaveText("30");
  await page.getByRole("button", { name: /The whole town signs/ }).click();
  await expect(page.locator(".cp-count")).toHaveText("20,030");
  await expect(page.getByLabel(/How many people does each pupil stand for/)).toHaveCount(0);
});

test("Teacher mode has three tabs, and the address keeps the tab", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher");
  await expect(page.getByRole("heading", { name: "The five chapters" })).toBeVisible();
  await page.getByRole("tab", { name: "Activities and games" }).click();
  await expect(page).toHaveURL(/\/teacher\/activities$/);
  await expect(page.getByRole("heading", { name: "Activities and games" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The five chapters" })).toHaveCount(0);
  await page.getByRole("tab", { name: "For the teacher" }).click();
  await expect(page.getByRole("heading", { name: "Fair to every party" })).toBeVisible();
});

test("the games run: sort a decision, order a bill, build a majority and solve a clue", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher/activities");
  await page.getByRole("button", { name: /Who decides\?/ }).click();
  await page.locator(".gm-choice").first().click();
  await expect(page.locator(".gm-feedback")).not.toBeEmpty();
  await page.getByRole("button", { name: /All activities and games/ }).click();
  await page.getByRole("button", { name: /Build a majority/ }).click();
  await page.locator(".gm-party").first().click();
  await expect(page.locator(".gm-verdict")).not.toBeEmpty();
  await page.getByRole("button", { name: /All activities and games/ }).click();
  await page.getByRole("button", { name: /Role detective/ }).click();
  await expect(page.locator(".gm-clue[data-open='1']")).toHaveCount(1);
  await page.locator(".gm-choice").first().click();
  await page.getByRole("button", { name: /All activities and games/ }).click();
  await page.getByRole("button", { name: /Make a law/ }).click();
  await page.locator(".gm-card").first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
