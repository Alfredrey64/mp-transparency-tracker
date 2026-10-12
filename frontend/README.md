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

## Checking party positions

What each party promised (`src/data/answerPartyPositions.js`) and the headline lists on the party cards (`src/data/partyManifestos.js`) are written in our own words from the 2024 general election manifestos. Full text of every manifesto is available from Lancaster University's UK Manifestos project (`https://ucrel.lancs.ac.uk/wmatrix/ukmanifestos2024/text/<Party>.txt`, with `Labour`, `Conservatives`, `LiberalDemocrats`, `ReformUK`, `Green`, `SNP` and `PlaidCymru`), which is the quickest way to check a claim: search the text for the figure or phrase. A party is left out of a question unless the manifesto makes a clear commitment on it. The manifesto links point at the 2024 documents; party sites tend to replace them with newer manifestos, so recheck them when reviewing.

## Working offline

`public/sw.js` is a small service worker (registered by `src/lib/offline.js`, production only). After a first visit the site opens without a connection: pages are network first with a saved copy as the fallback, built files under `/assets` and `/fonts` are cache first, and reads from the data service are network first with a five second wait before the saved copy is used. `src/components/OfflineBanner.jsx` shows a notice while the connection is down. `src/lib/serviceWorker.test.js` runs the worker against a fake environment. Change `VERSION` in `sw.js` to throw away everything saved so far.

## General elections

The General elections page (`src/components/GeneralElection.jsx`) has three tabs: the 2024 result, past elections since 1945, and the governments since 1945.

- **Past elections.** `src/data/electionsHistory.json` is built from Parliament's constituency results (UK Parliament, "UK General Elections Results 1832 - 2019", under the Open Parliament Licence; the 1945 totals are from the House of Commons Library). Rebuild it with `node scripts/fetch-election-history.mjs <raw.json>` (about 13,000 page requests, a few minutes) and then `node scripts/build-election-history.mjs <raw.json> <hex2019.json>`. The hexagon layout for the 2010 to 2019 boundaries is `uk-constituencies-2019-BBC.hexjson` from Open Innovations (MIT). Seats are matched to hexagons by name, so maps before 2010 only colour seats that kept their name; the page says so. The Speaker is counted separately, and the 1950 national totals use the published ones because the constituency data differs by a seat or two. `src/lib/electionHistory.test.js` checks the totals against the published figures.
- **Governments.** `src/data/governments.js` is written by hand from events that can be checked (Acts, treaties, referendums, dated events) and does not rank anyone. The figures shown under each government come from the same ONS series as the Britain in numbers pages (`src/lib/governmentMetrics.js` chooses which, and how a spell in office is measured; a series that covers less than 90% of a spell is left blank).
- **Manifestos.** `src/data/manifestoPledges.js` only goes back to 1997. Each pledge was checked against the text of the manifesto (Lancaster University's UK manifestos copies for 2005 and 2015 to 2024) and each outcome against an official statistic, an Act of Parliament or a named independent check, with the source beside it. When adding a manifesto, keep to pledges that are specific enough to check, give the outcome with a figure or a date, and name the source.
- **Prime Ministers.** When a new Prime Minister takes office, add a government to `governments.js` and end the previous one, and add them to `src/lib/governments.js`, which shades the Britain in numbers charts. `src/data/governments.test.js` checks the two lists agree.

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
