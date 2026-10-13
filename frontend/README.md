# Simple Politics

A simple breakdown of UK politics: who your MP is, who funds them, how they vote and what the numbers say about the country, from official sources and in plain English. Independent and unofficial.

Designed and built by Alfred Reynolds.

## Running it

```bash
cd frontend
npm install
npm run dev
```

The data pipeline lives in the `fetch-*.js` scripts at the top of the repository. Run them by hand, or on the schedule in `.github/workflows`, to refresh what the site shows.

## Voice

Plain, calm and specific. Short sentences, everyday words, no jargon without an explanation and no spin. Where there are two sides, state both fairly.

## Identity

- **Name:** Simple Politics
- **Line:** UK politics, made simple.
- **Mark:** the Houses of Parliament as a flat white silhouette on indigo (`public/favicon.svg`, and `src/components/LogoMark.jsx`).

## Embeddable cards

Any answer, and any chart on a Britain in numbers page, has an **Embed** button that gives out an iframe for another website. The card is a second Vite page (`embed.html`, `src/embed.jsx`, `src/components/EmbedApp.jsx`) with no menu or search, at `/embed.html#/answer/<id>` or `/embed.html#/chart/<page>/<measure>`, with `?theme=dark` for a dark card. The address helpers are in `src/lib/embed.js`. `vercel.json` lets these two paths be framed by any site (`frame-ancestors *`) while the rest of the site still refuses to be framed.

## Speed and stability

- **Fonts** are served from this site (`public/fonts`, wired up in `src/fonts.css`, licences in `public/fonts/LICENSES.txt`), so no request goes to a font provider and the four fonts used above the fold are preloaded in `index.html`.
- **Caching:** `vercel.json` marks everything under `/assets` and `/fonts` as immutable for a year, since the file names change when the contents do. Pages and data are still checked fresh.
- **Page changes** run as React transitions (`App.jsx`): the current page stays until the next is ready, a thin line shows only if that takes more than a moment, and the new page opens at its top in the same frame. `lib/preserveScroll.js` keeps tabs and filters from moving the page, and `components/Loading.jsx` holds a page's height while its figures load.
- **After a new deploy,** a tab left open reloads once if a page file has gone (`lib/chunkReload.js`).
- **Size budget.** `bundle-budget.json` caps the gzipped size of the JavaScript and CSS loaded on first visit and of the largest single file. `npm run check:size` (run in CI after the build) fails if a limit is passed; raise a limit on purpose, in the same change, when a feature is worth it.

## Checking party positions

What each party promised (`src/data/answerPartyPositions.js`) and the headline lists on the party cards (`src/data/partyManifestos.js`) are written in our own words from the 2024 general election manifestos. Full text of every manifesto is available from Lancaster University's UK Manifestos project (`https://ucrel.lancs.ac.uk/wmatrix/ukmanifestos2024/text/<Party>.txt`, with `Labour`, `Conservatives`, `LiberalDemocrats`, `ReformUK`, `Green`, `SNP` and `PlaidCymru`), which is the quickest way to check a claim: search the text for the figure or phrase. A party is left out of a question unless the manifesto makes a clear commitment on it. The manifesto links point at the 2024 documents; party sites tend to replace them with newer manifestos, so recheck them when reviewing.

## Working offline

`public/sw.js` is a small service worker (registered by `src/lib/offline.js`, production only). After a first visit the site opens without a connection: pages are network first with a saved copy as the fallback, built files under `/assets` and `/fonts` are cache first, and reads from the data service are network first with a five second wait before the saved copy is used. `src/components/OfflineBanner.jsx` shows a notice while the connection is down. `src/lib/serviceWorker.test.js` runs the worker against a fake environment. Change `VERSION` in `sw.js` to throw away everything saved so far.

## General elections

The General elections page (`src/components/GeneralElection.jsx`) has three tabs: the 2024 result, past elections since 1945, and the governments since 1945.

- **Past elections.** `src/data/electionsHistory.json` is built from Parliament's constituency results (UK Parliament, "UK General Elections Results 1832 - 2019", under the Open Parliament Licence; turnout and the 1945 and 1950 totals are the House of Commons Library's published figures, taken from UK Political Info and Wikipedia because the Library's own tables could not be fetched). Rebuild it with `node scripts/fetch-election-history.mjs <raw.json>` (about 13,000 page requests, a few minutes) and then `node scripts/build-election-history.mjs <raw.json> <hex2019.json>`. The hexagon layout for the 2010 to 2019 boundaries is `uk-constituencies-2019-BBC.hexjson` from Open Innovations (MIT). Seats are matched to hexagons by name, so maps before 2010 only colour seats that kept their name; the page says so. The Speaker is counted separately, and the 1950 national totals use the published ones because the constituency data differs by a seat or two. `src/lib/electionHistory.test.js` checks the totals against the published figures.
- **Governments.** `src/data/governments.js` is written by hand from events that can be checked (Acts, treaties, referendums, dated events) and does not rank anyone. The figures shown under each government come from the same ONS series as the Britain in numbers pages (`src/lib/governmentMetrics.js` chooses which, and how a spell in office is measured; a series that covers less than 90% of a spell is left blank).
- **Manifestos.** `src/data/manifestoPledges.js` only goes back to 1997. Each pledge was checked against the text of the manifesto (Lancaster University's UK manifestos copies for 2005 and 2015 to 2024; the 1997 text against two copies; the 2001 text against one unofficial archive copy, with Channel 4's record of that year's pledge card as a second check; the coalition's own programme from gov.uk for 2010) and each outcome against an official statistic, an Act of Parliament or a named independent check, with the source beside it. When adding a manifesto, keep to pledges that are specific enough to check, give the outcome with a figure or a date, and name the source.
- **Seat lookup and compare.** `src/data/electionSeatNames.json` (every seat name that appears in any election 1950 to 2019, with its winner and lead at each) and `src/data/electionMargins.json` (Labour's share minus the Conservatives', per seat on the 2010 map) are built by the same script as `electionsHistory.json`. The seat lookup (`SeatLookup.jsx`, postcode through postcodes.io or a seat name) and the compare tool (`CompareElections.jsx`, which matches seats by name and uses the usual two-party swing) both load them on demand. A seat renamed or created later only appears from when it got its present name.
- **Devolved elections.** `src/data/devolvedElections.js` holds seats, turnout and who led the government for every Scottish Parliament, Senedd and Northern Ireland Assembly election, taken from each election's results page; a test checks that every election adds up to the size of its chamber. Add the next election as a new entry (and update `led`).
- **Share cards.** `src/lib/electionSpecs.js` works out the card for whatever the page is showing (an election, a government or a devolved election); the Share button in the page header and in each result card use it.
- **How it works.** `ElectionsExplained.jsx` has a small invented example (clearly labelled) that switches between first past the post and D'Hondt, so the numbers there are not from a real election; the real examples beside it come from the election data.
- **Motion.** Blocks ease up into view once (`components/Motion.jsx`), numbers count up when they scroll into view, the seat chart's dots arrive in a sweep, and pages cross-fade. Only opacity and a short rise are animated, never a width or a length, and everything stops under `prefers-reduced-motion`. Keep it that way: nothing that grows from full or from zero to its value.
- **Map gestures.** `src/lib/useMapGestures.js` gives the seat maps (`ElectionMap.jsx`, `HexMap.jsx`) pinch-to-zoom on touch screens, Ctrl or Cmd plus scroll on desktop, zoom buttons, and press-and-hold to pin a seat's card without leaving the map.
- **Search.** The site search (`GlobalSearch.jsx`) also finds elections, governments, devolved elections and seat histories (`src/lib/electionSearch.js`), which open the matching General elections tab.
- **Prime Ministers.** When a new Prime Minister takes office, add a government to `governments.js` and end the previous one, and add them to `src/lib/governments.js`, which shades the Britain in numbers charts. `src/data/governments.test.js` checks the two lists agree.

## Tax rates through time

The Tax rates through time page (`src/components/TaxRates.jsx`, under Britain in numbers) follows 24 UK taxes since 1945 wherever a record exists, with a government band behind each chart and a list of every change showing which government (and, where it can be named with confidence, which Chancellor) decided it. It has five tabs, and the address carries the tab and what is picked:

- **By tax** (`#/taxRates/<tax id>`): today's main rates, a "Coming up" panel (scheduled changes across every tax and a countdown to the next Budget), then for the chosen tax its charts, a time-range choice, the list of changes, notes and sources. Charts with money in them have an **As set / In today's money** switch (`lib/priceIndex.js`: the Retail Prices Index before 1988 and the Consumer Prices Index after, both from the ONS, chained at 1988). Taxes with a matching ONS series also show **what they raise as a share of GDP** (`lib/taxTake.js`, `TaxTake.jsx`). There is an Embed button (`kind: "tax"` in `lib/embed.js`, drawn by `TaxCard` in `EmbedApp.jsx`) and a Share button (`lib/taxShare.js`).
- **Who set it** (`#/taxRates/government/<id>`, `#/taxRates/chancellor/<name>`, `#/taxRates/budget`): changes grouped by government, by Chancellor (only where the Chancellor can be named with confidence) or Budget by Budget (only changes with a known decision date).
- **Compare** (`#/taxRates/compare/<line key>/<measure id>`, `TaxCompare.jsx`): any tax line above one of the national figures in `lib/governmentMetrics.js`, one shared crosshair, and a table by government. To add a measure, add it to `METRICS` there. The Compare over time page also lists the percentage tax rates (as a topic called Tax rates, `lib/taxRateSeries.js`) and the tax take.
- **Your pay** (`TaxPay.jsx`, `lib/payCalc.js`): what an employee on a chosen salary would have paid in income tax and employee National Insurance in each tax year since 1990, with the pay held at the same buying power or the same pounds. The rates and bands for every year are in `src/data/taxBands.json`, built from HMRC's rates, allowances and National Insurance tables. It is a simplified picture (one job, no pension, no other income, contracted in, England, Wales and Northern Ireland).
- **About the figures**: sources, how a change is credited, and what is left out.

Other places the tax data shows up: the site search finds taxes and rates (`lib/taxSearch.js`); the Jargon buster has the tax terms; tax pledges in the manifesto data (`rates: [...]` in `src/data/manifestoPledges.js` and `src/data/promises.js`) show what happened to the rates they named between that election and the next (`PledgeRates.jsx`, windows in `lib/pledgeWindow.js`).

- **Data.** `src/data/taxSeries.json` holds one entry per rate as `[date, value, options]` steps (a rate holds until the next step; `null` means not charged). `options.ann` is the date the change was decided when that differs from the date it began (it picks the government and Chancellor credited), `options.note` is a short note and `options.p: "m"` means only the month is known. `src/data/taxCatalogue.js` says what each tax is, which lines go on which chart, the notes and the sources. A line with `kind: "allowance"` is a threshold or allowance, where a rise means less tax. A line with `intro: true` begins with the tax being brought in, otherwise its first step is only where our record starts (`introEffect` says whether bringing it in meant more or less tax). A panel with `real: true` gets the today's-money switch. A tax with `setBy: "scottish"` is credited to the Scottish Government, not a UK government. `src/data/taxEvents.js` holds the next Budget (shown with a countdown until the day) and the names of past Budgets.
- **Sources.** Wherever HMRC publishes a historic table it is the source: Rates of Income Tax (1990 on), Income Tax personal allowances, Rates of Surtax, National Insurance (1975 on), Rates of Corporation Tax (1971 to 2017), Inheritance Tax and Capital Transfer Tax tables, the Alcohol, Tobacco, Hydrocarbon Oils, Insurance Premium Tax, Air Passenger Duty and Environmental Taxes bulletins, the Capital Gains Tax statistics, the stamp duty table and the SDLT rate pages. Council tax is the MHCLG live table. The standard rate of income tax before 1990 is from a Hansard written answer of 18 November 1977 and the Finance Act 1972. VAT, business rates and the top rate of income tax from 1973 to 1988 are from Wikipedia, checked against other sources, Scottish income tax is from GOV.UK and the Scottish Government, and the recent measures (2025 and 2026) are from gov.uk policy papers and Budget summaries. Each tax lists its sources on the page.
- **Who set it.** `src/lib/taxRates.js` credits a change to the government in power on `ann` (or on the day it began if there is none). A Chancellor is named only when `ann` is given, or the series is set on Budget day (tobacco), or the Chancellor had been in the job for at least 330 days, so a Budget set up by the previous Chancellor is not credited to the new one. Add `ann` whenever a rate was decided under a different government from the one in power when it began. `src/data/chancellors.js` lists the Chancellors.
- **Adding a change, for example after a Budget.** Append a step to the series in `taxSeries.json` (the test checks the dates are in order, no value repeats, and any `ann` is not after the start date), and add a new tax or line in `taxCatalogue.js` if needed. When a Budget schedules future steps, add them with the future date and the Budget date as `ann`; they appear under "Already decided, not yet in force" until the day arrives. Add the Budget to `EVENT_NAMES` in `taxEvents.js`, and set `NEXT_BUDGET` to the next one (or null).
- **Keeping it right.** `npm run check:tax` (also run every Monday by `.github/workflows/tax-data.yml`) reads HMRC's and GOV.UK's published tables and compares the newest figure in each with `taxSeries.json`. It prints each difference and fails, but changes nothing.
- **Left out.** Vehicle excise duty (the rate depends on engine size or emissions and registration date, and we could not verify a year-by-year record), fuel, alcohol and tobacco before the official tables begin, estate duty rates before 1975, Scottish and Welsh property and landfill taxes, tax reliefs, customs duties and the TV licence. The About tab says so too.

## Phone layout test

`e2e/phone-layout.spec.js` opens every page (the list comes from `src/pageLoaders.js`, so a new page is picked up automatically, plus the tabs listed in the spec) in Chromium at 320 and 375 px wide and fails if the page scrolls sideways, does not open at the top, has no single `h1`, or throws an uncaught error. It runs on every push and pull request as the "Phone layout" job in `.github/workflows/ci.yml`. Data requests are refused during the run, so the result does not depend on the network or on live data.

Run it locally with `npm run test:phone` (the first time, `npx playwright install chromium`). It builds the site and serves it on port 4175. If it fails in CI, the failure details are attached to the run as `playwright-report`.

## Accessibility

The site aims for WCAG 2.2 AA. What is in place, and how to check it:

- **Checker:** `axe-core` is a dev dependency. `src/a11y.test.jsx` runs it over pieces that can be drawn without a network. For a whole page (colour contrast, landmarks), run the dev server, open the browser console and load `/node_modules/axe-core/axe.min.js`, then `await axe.run()`. The pages were last checked in light, dark and phone layouts with no violations.
- **Landmarks:** one `main`, a named `aside` for the menu and one `nav` inside it. Every page has one `h1`.
- **Keyboard:** a skip link, a visible focus ring in both themes (`--focus-ring`), scrollable boxes and tables have a tab stop (`lib/a11y.js`, `scrollRegion`), and clickable cards that are not buttons use `keyboardActivate`. Pop-ups and the phone menu use `lib/useDialog.js`: focus moves in, Tab stays inside, Escape closes, and focus goes back to what opened it.
- **Screen readers:** loading and offline states announce themselves, search results announce how many there are, links that open a new tab say so, and charts have a table or text alternative.
- **Seating plan:** the Commons chamber has a list to choose an MP from as well as the clickable dots.
