import fs from "node:fs";
import { test, expect } from "@playwright/test";

// Checks that text can be read against whatever it sits on, in the light and the dark page, using axe's colour-contrast rule (4.5 to 1 for
// normal text, 3 to 1 for large). Animation is switched off and the page scrolled and left to settle first, so a box that is part-way through
// fading in is not measured. Colours come from the helpers in src/theme.js (readable, solid, chip, onFill); a failure here usually means a
// bare accent or party colour was used as text, or text was put on a fill without checking it.

const axeSource = fs.readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const PAGES = [
  "/", "/mymp", "/rankings", "/howitworks", "/cabinet", "/lords", "/committees", "/byelections", "/lobbying", "/medialiteracy",
  "/inequality", "/inequality/income", "/inequality/wealth", "/inequality/poverty", "/inequality/place", "/inequality/abroad", "/inequality/groups", "/inequality/debate",
  "/brexit", "/brexit/economy", "/brexit/trade", "/brexit/society", "/brexit/politics", "/brexit/arguments",
  "/defence", "/defence/spending", "/defence/people", "/education", "/education/gaps", "/education/send", "/education/university",
  "/ageing", "/ageing/pension", "/ageing/cost", "/ageing/people", "/nhs", "/nhs/waiting", "/nhs/emergency", "/nhs/money", "/nhs/arguments",
  "/energy", "/energy/emissions", "/energy/power", "/energy/bills", "/energy/arguments",
  "/taxRates", "/glossary", "/settings", "/generalElection/history/1997",
];

for (const theme of ["light", "dark"]) {
  for (const path of PAGES) {
    test(`${path} is readable in the ${theme} page`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.route("**/127.0.0.1:54321/**", (route) => route.abort());
      await page.goto(path, { waitUntil: "load" });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.waitForTimeout(1200);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(2200);
      await page.evaluate(axeSource);
      const found = await page.evaluate(async () => {
        const res = await window.axe.run(document, { runOnly: ["color-contrast"] });
        return res.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(" ")}: ${n.any[0]?.data?.fgColor} on ${n.any[0]?.data?.bgColor} is ${n.any[0]?.data?.contrastRatio} to 1`));
      });
      await context.close();
      expect(found).toEqual([]);
    });
  }
}
