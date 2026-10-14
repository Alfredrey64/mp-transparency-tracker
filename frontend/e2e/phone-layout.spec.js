import { test, expect } from "@playwright/test";
import { LOADERS } from "../src/pageLoaders.js";

// Every page the site can show, plus the home page and the two that are not lazy-loaded.
const PAGES = ["home", "list", "partymatch", ...Object.keys(LOADERS)].filter((p, i, all) => all.indexOf(p) === i);
// Pages that live inside another page's tabs.
const TABS = ["generalElection/history/1997", "generalElection/history/2024", "generalElection/governments/blair", "generalElection/governments/thatcher", "generalElection/devolved/scotland/2021", "generalElection/devolved/ni/2022", "generalElection/explained", "taxRates/overview", "taxRates/where", "inequality/income", "inequality/wealth", "inequality/poverty", "inequality/place", "inequality/groups", "inequality/debate", "inequality/about", "brexit/economy", "brexit/trade", "brexit/society", "brexit/politics", "brexit/arguments", "defence/spending", "defence/people", "defence/arguments", "education/gaps", "education/send", "education/university", "education/arguments", "ageing/pension", "ageing/cost", "ageing/people", "ageing/arguments", "brexit/about", "taxRates/vat", "taxRates/alcohol", "taxRates/stamp-duty", "taxRates/income-tax", "taxRates/government/thatcher", "taxRates/about", "taxRates/pay", "taxRates/budget", "taxRates/chancellor/nigel-lawson", "taxRates/scottish-income-tax", "taxRates/fuel", "taxRates/compare/incomeTax.basic/growth", "taxRates/compare/vat.standard/inflation"];
const WIDTHS = [320, 375];

for (const width of WIDTHS) {
  test.describe(`phone, ${width}px wide`, () => {
    test.use({ viewport: { width, height: 740 }, hasTouch: true, isMobile: true });

    for (const view of [...PAGES, ...TABS]) {
      test(`${view} fits the screen`, async ({ page }) => {
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        // Data requests are refused so the test never depends on the live database.
        await page.route("**/127.0.0.1:54321/**", (route) => route.abort());

        await page.goto(view === "home" ? "/" : `/${view}`);
        await expect(page.locator("main h1, h1").first()).toBeVisible({ timeout: 15000 });
        // Let late-sizing content (charts, images, lazy sections) settle before measuring.
        await page.waitForTimeout(600);

        const m = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollY: window.scrollY,
          h1s: document.querySelectorAll("h1").length,
        }));

        expect(m.scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(m.clientWidth);
        expect(m.scrollY, "page should open at the top").toBe(0);
        expect(m.h1s, "each page has one main heading").toBe(1);
        expect(errors, "no uncaught errors").toEqual([]);
      });
    }
  });
}
