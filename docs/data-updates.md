# Keeping Domesday Live up to date

What updates itself, what is watched, and what a person has to do, with the steps for the two days that matter most (a Budget and an election).

## 1. What updates itself

| What | How often | Where |
| --- | --- | --- |
| MPs, parties, interests, votes, bills, news, donors, Lords, petitions, committees, constituencies, councils, statistics, office-holders | daily, 03:23 UTC (catch-up 15:17 if the morning run did not commit) | `.github/workflows/fetch-data.yml` |
| Issue-page data: inequality, defence, education, ageing, Brexit, energy, devolution, transport, care, trust, NHS | weekly, Monday | `.github/workflows/refresh-issue-data.yml` -> `frontend/scripts/refresh-issue-data.mjs` |
| Tax rates against the newest Budget | daily | `.github/workflows/tax-data.yml` |
| Who is Prime Minister, Chancellor, and the First Ministers | daily | `.github/workflows/office-holders.yml` |
| Small copies of member portraits (128 px WebP, `frontend/public/portraits/<member id>.webp`; Parliament's own thumbnails are 230 KB each). Only new members are added; until a copy exists the host passes the request to Parliament (`frontend/vercel.json`) | daily, in the refresh | `fetch-portraits.js` (needs the `cwebp` tool: `brew install webp` / `apt-get install webp`) |
| Small photos of regional office-holders (144 px tall WebP in `frontend/public/portraits/reps/`, list and credits in `frontend/src/data/repPortraits.json`). Official photos for MSPs and MLAs; Wikimedia Commons photos only when licensed freely (credit shown on Your area). Only newcomers are fetched; people with no free photo (about 29 commissioners) keep initials. | Automatic, daily (`node fetch-rep-portraits.js`, needs `cwebp`) | If it fails, the initials circle is shown |
| Links from each commissioner's, regional mayor's, MSP's, MLA's and Senedd member's name to an official page (`frontend/src/data/repLinks.json`). Members of the three parliaments link to their own page on that parliament's site; the address is built from the site's pattern and kept only if the page shows the member's name (311 of 315; four have no matching page), checked once when a member is added (`--refresh` rechecks all). For commissioners and mayors the office's site is found through Wikidata (the office the person holds, matched by place and kind of office; for mayors with no site recorded, the combined authority's own site), then each address is opened to check it still answers. 45 of 51 linked; six commissioners (Durham, Merseyside, Sussex, West Mercia, Northamptonshire, Staffordshire) have no site recorded, so stay unlinked. | Automatic, daily (`node fetch-rep-links.js`) | If it fails the old links stay; a site that says "not found" is dropped |
| Open GOV.UK consultations, NHS waiting lists by trust, bathing water ratings, and constituency jobs and pay (the Have your say page and Your area in numbers) | daily, in the refresh | `fetch-consultations.js`, `fetch-rtt-waits.js`, `fetch-bathing-water.js`, `fetch-local-economy.js` |
| House prices by council (average price, 12-month change, price by kind of home, ten years of history) and road casualties by council (people killed, seriously and slightly injured, five years, plus who was hurt) for Your area in numbers | daily, in the refresh. House prices: the newest monthly UK House Price Index file is looked for each day and only downloaded when it is a new month. Road casualties: the Department for Transport's two five-year files are checked by size, and re-read when the size changes (a new year of figures, in the autumn) or every 35 days | `fetch-house-prices.js` (`housePrices.js`), `fetch-road-casualties.js` (`roadCasualties.js`) |
| Whether the site, its data and its sources are healthy | daily | `.github/workflows/site-health.yml` |

The heavier numbers for Your area in numbers are rebuilt by `.github/workflows/refresh-area-data.yml` every Wednesday (`frontend/scripts/refresh-area-data.mjs`), which asks each source whether a newer edition is out and rebuilds only what has one: Ofsted school inspections (monthly; also re-read at least every 35 days for the schools register), CQC care ratings (monthly), the Department for Education's school results tables (a new version of any of the four data sets), council road condition and fly-tipping (yearly), Ombudsman complaints (yearly) and council tax (the Ministry's March release, and its April revision; `frontend/scripts/build-council-tax.mjs`). Four further datasets arrived with it: asylum support by council (Home Office, quarterly), homelessness (Ministry of Housing, quarterly), children in low-income families (DWP, each March) and local health (OHID Fingertips: life expectancy, healthy life expectancy, smoking, overweight and inactivity; its newest period is compared with the saved one each week). When the rebuild works and the tests pass the new figures are pushed to main; if a source cannot be reached, a rebuild fails or a test breaks, an issue labelled `area-data-refresh-failed` says which and why. Each dataset also keeps its row in `frontend/scripts/hand-kept.mjs`, which now acts as the second alarm if the weekly job stops. To rebuild one by hand: `node frontend/scripts/refresh-area-data.mjs --only school-results --force` (or run the builder itself, for example `node scripts/build-health-services.mjs`).

Still typed by a person, because no source publishes them in a form that can be read automatically: the deprivation indices (rebuilt with `fetch-deprivation.js`, a new edition comes every few years), crime by background, and the courts, police and prison headline figures; each has a row with a cadence and is listed in the weekly issue when due.

The Your pay calculator's income tax and National Insurance rules (`frontend/src/data/taxBands.json`) have no builder: a new tax year needs a row added by hand each April (the 1 April 2027 row in `content-ledger.mjs` says so). `frontend/src/lib/taxBandsConsistency.test.js` fails the build if any year from 2008 disagrees with `taxSeries.json`, which the daily tax check keeps against HMRC, so a Budget that changes a rate cannot reach one file and miss the other.

Sources that publish a new edition under a new address (GOV.UK, NHS England, ONS time series, the OECD) are looked up each run, so a new release is picked up without anyone changing a file.

## 2. What is watched (a weekly issue says when it needs a person)

`.github/workflows/content-check.yml` runs `frontend/scripts/audit-content.mjs` every Monday and opens or closes an issue labelled `content-review`. It lists:

- explainer pages and `CHECKED` dates in `frontend/src/data/*.js` that are due a re-read;
- saved data files that have stopped refreshing;
- dated facts in `frontend/scripts/content-ledger.mjs` (`DUE` rows: a fact that stops being true on a known date);
- **hand-typed data on a cadence** (`frontend/scripts/hand-kept.mjs`): each file a person types (inequality gaps, the foreign influence register, inquiries, spending plans, ministerial meetings, party positions, tax wording, pledges, the courts, police, prisons and crime-outcome figures in `justiceFigures.js`, and so on) has a row with how often it is re-read (30 to 180 days), the source to read and the files to change; an overdue row appears in the weekly issue. A new file in `src/data` has to be a row, or marked as rewritten by a scheduled job or as fixed, or `hand-kept.test.js` fails;
- **newer editions** of sources the site reads from a fixed address: ONS dataset files, DWP Households Below Average Income, SIPRI, and every yearly ONS page the site quotes (`.../bulletins/<name>/2026`, `1997to2024`, `financialyearending2025`, `mid2025`, `2024based`). For the yearly pages it asks whether the next year's address exists;
- the hand-typed Brexit headline (`TRADE_LATEST`) when the held series moves a quarter ahead;
- source links that have gone.

A data source that has failed on two daily runs in a row opens a `Data sources are failing` issue (`failingSources.js` at the repository root).

A page whose data file has not refreshed for more than three days says so itself (`frontend/src/lib/staleNotice.js`; used on the statutory instruments page). Add `notice={staleNotice(data.generated, now, { source: "..." })}` to an explainer page to give it the same.

## 3. What a person does

When the weekly issue lists an item:

1. Read the new release (ONS: use the browser; the bulletin `/data` address was withdrawn in February 2026, but dataset and time-series `/data` still work).
2. Change the figures and the wording that quotes them. Search for the old number and the old year. Prefer computing text from the data object (see `frontend/src/data/inequality.js` and `InequalityDebate.jsx`) so that next time only the data changes.
3. If a test names the old number, rewrite the test to a believable range or a multiple of the data, not a new fixed number.
4. Only then bump the file's `CHECKED` date (or, for a `hand-kept.mjs` row, its `checked` date; the foreign influence and crime files carry their own date inside the file). Bumping it without re-reading defeats the alarm.
5. If a page heading or description changed, redraw its share image: `node scripts/build-page-og.mjs` in `frontend`, and commit `public/og`. CI fails (`build-page-og.mjs --check`) if one is out of date.

## 4. Budget or fiscal event day

1. `node frontend/scripts/read-budget-rates.mjs` reads the rates annex. Check each figure by eye (the parser can mislabel a column).
2. Apply rate changes with `node frontend/scripts/add-tax-change.mjs --file <file>`.
3. Set `NEXT_BUDGET` in `frontend/src/data/taxEvents.js` (to the next event or `null`), update `CAP_NOW` in `frontend/src/data/energy.js` if Ofgem announced a cap.
4. Walk the `DUE` rows in `content-ledger.mjs`; delete rows that have passed, add rows for any new dated promise.
5. Read the Taxes, Ageing, Care, Defence, Transport and Energy pages for anything the Budget changed; bump `CHECKED` on each page you re-read.
6. Check the OBR forecast figures on the public-finances and spending pages.

## 5. Election or by-election

1. The daily refresh updates MPs and parties within a day. Check the Commons seat counts on the home page and the parties page.
2. `office-holders.yml` raises an `office-holder-changed` issue if the Prime Minister or Chancellor changed; the story text in `governments.js` and `chancellors.js` is written by hand.
3. New by-election results: `node fetch-by-elections.js`; election history: `node fetch-election-history.js`.
4. Seat map: `node build-region-map.js` only if boundaries changed.

## 6. When a source is down

A publisher being down is not a bug here. The scripts keep the last good file (they never overwrite it with a short or empty answer), the page shows the date of the data it has, and the next daily run tries again. Two failed runs in a row open an issue. The OECD answers `500` or `429` when asked too fast; `httpFetch.js` now leaves 12 seconds between OECD requests. If an OECD file is more than 60 days old the weekly run fails on purpose.

The Office of Rail and Road's data portal (the rail punctuality and cancellations tables on the Transport page) now draws its tables in the browser from its own report service, so `orrTable` in `build-transport-data.mjs` reads the page's `contentId` and fetches the rows as JSON from `/umbraco/api/databricksreport/getallreportdata`; the old table markup is the fallback. If that page changes again, the weekly issue shows the Transport step failing.

## 7. Checks that run on every push (look-and-feel guards)

These open every page in a browser and fail the build, so a wrong picture cannot ship quietly:

- `frontend/e2e/numbers-fit.audit.mjs`: every page at 320, 390, 768 and 1280 px. Fails on text cut off by the box around it (a headline figure losing its last letters) and on a chart axis that repeats a label ("£25bn" twice). Axis labels take their decimals from the gap between gridlines (`stepDigits` in `src/lib/onsFormat.js`); a new chart formatter should accept `(value, step)` rather than rounding to a fixed number of digits.
- `frontend/e2e/motion-a11y.audit.mjs`: reduced-motion behaviour and screen-reader names for diagrams.
- `frontend/e2e/phone-layout.spec.js`, `flash.audit`, and the WebKit touch checks.

Run any of them locally with `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321` running (see the head of each file).

Four cards on Your area in numbers ask their source live (crime near you from data.police.uk, food hygiene, flood warnings and sewage overflows), which means every host they call must be named in `connect-src` in `frontend/vercel.json`: the browser blocks anything else without a word, and the test server has no such header. `frontend/src/lib/csp.test.js` fails if a library fetches a host that is not listed. Asking live means nothing needs rebuilding for them: food hygiene ratings (the Food Standards Agency's ratings service, `frontend/src/lib/foodHygiene.js`) and flood warnings (the Environment Agency's real-time flood-monitoring service, `frontend/src/lib/floodLive.js`; England only). Both are open to any website and need no key. If either service changes its address or answer, the card says it did not load and offers the official site. Road casualties use council codes from the Department's files; the councils reorganised in April 2023 are mapped to their new codes in `CODE_NOW` in `roadCasualties.js`, and the next reorganisation needs a line added there.

## Failure messages in the workflow runs

GitHub no longer lets a workflow set `NODE_OPTIONS` through `$GITHUB_ENV`, so `ci-notes.js` (which turns a failing script's last error lines into a `::error title=<script> failed::` annotation) is loaded per command: `node --import "$GITHUB_WORKSPACE/ci-notes.js" script.js`. Any new node step in a workflow should be written that way, or its failure will show only as "exit code 1".

## Smooth page changes

- `Unfold` (components/Unfold.jsx) grows and shrinks content under a button; `Batches` uses it for "Show ten more" lists so a new page of rows grows under the old ones instead of popping in. Use `settle` where cards have shadows at the edges.
- `swapView(fn)` (lib/preserveScroll.js) swaps a whole view (for example the Lords list and a peer's page) and returns to the top in the same frame.
- Hero scenes (`Scene` in story/EconArt.jsx) start their animation only once the page is idle (`data-run`), so they do not compete with first paint.
