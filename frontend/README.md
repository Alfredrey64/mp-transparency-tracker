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
