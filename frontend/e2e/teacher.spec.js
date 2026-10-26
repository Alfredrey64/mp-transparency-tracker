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
