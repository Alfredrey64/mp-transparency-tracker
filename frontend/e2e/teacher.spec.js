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
  await expect(page.locator(".gm-feedback")).not.toBeEmpty();
  await page.getByRole("button", { name: /All activities and games/ }).click();
  await page.getByRole("button", { name: /Role detective/ }).click();
  await expect(page.locator(".gm-clue[data-open='1']")).toHaveCount(1);
  await page.locator(".gm-choice").first().click();
  await page.getByRole("button", { name: /All activities and games/ }).click();
  await page.getByRole("button", { name: /Make a law/ }).click();
  await page.locator(".gm-card").first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("the new games run: follow the £10, election day, spot the layer and the team quiz", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher/activities");
  const back = () => page.getByRole("button", { name: /All activities and games/ }).click();

  await page.getByRole("button", { name: /Follow the £10/ }).click();
  const plus = page.getByRole("button", { name: /Put a pound on/ });
  for (let i = 0; i < 10; i++) await plus.nth(i % 3).click();
  await expect(page.locator(".gm-purse-n")).toHaveText("All placed");
  await page.getByRole("button", { name: /Show where it really goes/ }).click();
  await expect(page.locator(".gm-real").first()).toContainText("Really £");
  await expect(page.locator(".gm-feedback")).toContainText("different place");
  await back();

  await page.getByRole("button", { name: /Election day/ }).click();
  const slots = ["Before the day", "Polling day", "10pm", "Overnight", "The days after"];
  const slot = (s) => page.locator(".gm-choice").filter({ has: page.locator("b", { hasText: new RegExp(`^${s}$`) }) });
  for (const s of slots) await expect(slot(s)).toBeVisible();
  let guard = 0;
  while (await page.locator(".gm-prompt").count() && guard++ < 40) {
    for (const s of slots) {
      await slot(s).click();
      if (await page.locator(".gm-feedback[data-right='1']").count()) break;
    }
    const nextBtn = page.getByRole("button", { name: /Next event|See how you did/ });
    await nextBtn.click();
  }
  await expect(page.locator(".gm-end")).toContainText("right first time");
  await back();

  await page.getByRole("button", { name: /Spot the layer/ }).click();
  await page.locator(".gm-thing-btn", { hasText: "The hospital" }).click();
  await page.locator(".gm-choice").nth(2).click();
  await expect(page.locator(".gm-feedback")).toContainText("run by the UK government");
  await page.getByRole("tab", { name: "Scotland" }).click();
  await expect(page.locator(".gm-thing-btn", { hasText: "The hospital" })).toContainText("Tap to sort");
  await page.locator(".gm-thing-btn", { hasText: "The hospital" }).click();
  await page.locator(".gm-choice").nth(1).click();
  await expect(page.locator(".gm-feedback")).toContainText("NHS Scotland");
  await back();

  await page.getByRole("button", { name: /Team quiz/ }).click();
  await page.getByRole("button", { name: "Start the quiz" }).click();
  await page.keyboard.press("2");
  await expect(page.locator(".gm-board li[data-on='1']")).toContainText("Team 2");
  for (const t of [1, 0, 2]) {
    if (await page.locator(".gm-feedback[data-right='1']").count()) break;
    if (await page.locator(".gm-buzzbtn:not(:disabled)").count()) { const b = page.locator(".gm-buzzbtn").nth(t); if (await b.isEnabled()) await b.click(); }
    await page.locator(".gm-choices-q .gm-choice:not(:disabled)").first().click();
  }
  await expect(page.locator(".gm-feedback")).toContainText("2 points");
  await page.getByRole("button", { name: "Next question" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("the deeper rounds: stars after a round, bill in trouble, test your government, bonus building, higher or lower, count the votes, passport", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher/activities");
  const back = () => page.getByRole("button", { name: /All activities and games/ }).click();

  // Who decides?: finish round one and get stars.
  await page.getByRole("button", { name: /Who decides\?/ }).click();
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < 3; k++) {
      await page.locator(".gm-choice:not(:disabled)").nth(k).click();
      if (await page.locator(".gm-feedback[data-right='1']").count()) break;
    }
    await page.getByRole("button", { name: /Next decision|Finish the round/ }).click();
  }
  await expect(page.locator(".gm-end")).toContainText("Round 1 done");
  await expect(page.locator(".gm-stars")).toBeVisible();
  await page.getByRole("button", { name: /Start round 2/ }).click();
  await expect(page.locator(".gm-score")).toContainText("Round 2 of 3");
  await back();

  // Make a law: put the bill in order, then take the challenge.
  await page.getByRole("button", { name: /Make a law/ }).click();
  for (let i = 0; i < 8; i++) {
    const cards = page.locator(".gm-card");
    const n = await cards.count();
    for (let k = 0; k < n; k++) {
      await cards.nth(k).click();
      if ((await page.locator(".gm-dots li[data-state='done']").count()) > i) break;
    }
  }
  await page.getByRole("button", { name: /Bill in trouble/ }).click();
  for (let q = 0; q < 3; q++) {
    for (let k = 0; k < 3; k++) {
      await page.locator(".gm-choice:not(:disabled)").nth(k).click();
      if (await page.locator(".gm-feedback[data-right='1']").count()) break;
    }
    await page.getByRole("button", { name: /Next challenge|Finish/ }).click();
  }
  await back();

  // Build a majority: build the smallest government and test it.
  await page.getByRole("button", { name: /Build a majority/ }).click();
  await page.locator(".gm-party").first().click();
  await page.getByRole("button", { name: "Test your government" }).click();
  for (let e = 0; e < 3; e++) {
    await page.getByRole("button", { name: /Yes, it wins/ }).click();
    await page.getByRole("button", { name: /Next vote|Finish/ }).click();
  }
  await expect(page.locator(".gm-end")).toContainText("votes won");
  await back();

  // Role detective: guess, then pick a building for the bonus point.
  await page.getByRole("button", { name: /Role detective/ }).click();
  for (let k = 0; k < 4; k++) {
    const b = page.locator(".gm-choices .gm-choice:not(:disabled)").first();
    if (!(await b.count())) break;
    await b.click();
    if (await page.locator(".gm-places").count()) break;
  }
  await expect(page.locator(".gm-places")).toBeVisible();
  await back();

  // Follow the £10: place the coins, reveal, then higher or lower.
  await page.getByRole("button", { name: /Follow the £10/ }).click();
  const plus = page.getByRole("button", { name: /Put a pound on/ });
  for (let i = 0; i < 10; i++) await plus.nth(i % 3).click();
  await page.getByRole("button", { name: /Show where it really goes/ }).click();
  await page.getByRole("button", { name: /Next: higher or lower/ }).click();
  for (let i = 0; i < 5; i++) {
    await page.locator(".gm-vs-card").first().click();
    await page.getByRole("button", { name: /Next pair|Finish/ }).click();
  }
  await expect(page.locator(".gm-end")).toContainText("right");
  await back();

  // Election day: skip through the events, then count the twelve papers.
  await page.getByRole("button", { name: /Election day/ }).click();
  const slots = ["Before the day", "Polling day", "10pm", "Overnight", "The days after"];
  const slot = (s) => page.locator(".gm-choice").filter({ has: page.locator("b", { hasText: new RegExp(`^${s}$`) }) });
  for (let g = 0; g < 10; g++) {
    for (const s of slots) { await slot(s).click(); if (await page.locator(".gm-feedback[data-right='1']").count()) break; }
    await page.getByRole("button", { name: /Next event|See how you did/ }).click();
  }
  await page.getByRole("button", { name: "Count the votes" }).click();
  const papers = ["a", "b", "a", "x", "c", "b", "a", "b", "a", "c", "b", "a"];
  const pile = { a: 0, b: 1, c: 2, x: 3 };
  for (const p of papers) await page.locator(".gm-pile").nth(pile[p]).click();
  await expect(page.locator(".gm-end")).toContainText("The Sunshine Party wins");
  await back();

  // Spot the layer: sort a whole town to earn a passport stamp.
  await page.getByRole("button", { name: /Spot the layer/ }).click();
  const answers = { "The hospital": 2, "The school": 2, "The police station": 2, "The tax office": 2, "The bin lorry": 0, "The park": 0, "The new flats": 0, "The warship": 2 };
  for (const [name, k] of Object.entries(answers)) {
    await page.locator(".gm-thing-btn", { hasText: name }).click();
    await page.locator(".gm-choice").nth(k).click();
  }
  await expect(page.locator(".gm-visa[data-on='1']")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("the new games: ping-pong, coalition, letter to your MP, bingo and jargon matcher", async ({ page }) => {
  await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
  await page.goto("/teacher/activities");
  const back = () => page.getByRole("button", { name: /All activities and games/ }).click();

  await page.getByRole("button", { name: /Lords and Commons ping-pong/ }).click();
  for (let a = 0; a < 3; a++) {
    await page.getByRole("button", { name: /Accept the change/ }).click();
    await page.getByRole("button", { name: /Next change|Send the bill to the King/ }).click();
  }
  await expect(page.locator(".gm-end")).toContainText("Royal Assent");
  await back();

  await page.getByRole("button", { name: /Coalition negotiator/ }).click();
  await page.locator(".gm-seat-card", { hasText: "Red" }).click();
  await page.locator(".gm-seat-card", { hasText: "Green" }).click();
  for (const p of ["Cheaper bus fares", "Free swimming for under-16s", "Plant a million trees", "More bike lanes"]) await page.locator(".gm-policy", { hasText: p }).click();
  await page.getByRole("button", { name: "Propose the deal" }).click();
  await expect(page.locator(".gm-feedback")).toContainText("A government!", { timeout: 8000 });
  await back();

  await page.getByRole("button", { name: /Letter to your MP/ }).click();
  await page.locator(".gm-issue", { hasText: "Too much plastic wrapping" }).click();
  await page.locator(".gm-choice", { hasText: "Your MP" }).click();
  await expect(page.locator(".gm-paper")).toBeVisible({ timeout: 5000 });
  for (let i = 0; i < 5; i++) {
    const cards = page.locator(".gm-write .gm-card");
    const n = await cards.count();
    for (let k = 0; k < n; k++) { await cards.nth(k).click(); if ((await page.locator(".gm-line:not(.gm-line-ghost)").count()) > i) break; }
  }
  await page.getByRole("button", { name: /Seal it and send it/ }).click();
  await expect(page.locator(".gm-next")).toBeVisible({ timeout: 8000 });
  await back();

  await page.getByRole("button", { name: /Parliament bingo/ }).click();
  for (let i = 0; i < 16; i++) {
    const clue = await page.locator(".gm-ball b").textContent();
    const squares = page.locator(".gm-sq:not([data-state='on'])");
    const n = await squares.count();
    for (let k = 0; k < n; k++) {
      await squares.nth(k).click();
      if (!(await page.locator(".gm-ball b").textContent()).includes(clue.slice(0, 20)) || (await page.locator(".gm-sq[data-state='on']").count()) > i) break;
    }
  }
  await expect(page.locator(".gm-end")).toContainText("sixteen words");
  await back();

  await page.getByRole("button", { name: /Jargon matcher/ }).click();
  for (let r = 0; r < 3; r++) {
    for (let w = 0; w < 6; w++) {
      const word = page.locator(".gm-word:not(:disabled)").first();
      await word.click();
      const means = page.locator(".gm-mean:not(:disabled)");
      const n = await means.count();
      for (let k = 0; k < n; k++) { await means.nth(k).click(); if ((await page.locator(".gm-word[data-state='done']").count()) > w) break; if (!(await page.locator(".gm-word[data-state='picked']").count())) break; }
    }
    await page.getByRole("button", { name: /Next round|See how you did/ }).click();
  }
  await expect(page.locator(".gm-end")).toContainText("eighteen words");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
