# Keeping Domesday Live up to date

What updates itself, what is watched, and what a person has to do, with the steps for the two days that matter most (a Budget and an election).

## 1. What updates itself

| What | How often | Where |
| --- | --- | --- |
| MPs, parties, interests, votes, bills, news, donors, Lords, petitions, committees, constituencies, councils, statistics, office-holders | daily, 03:23 UTC (catch-up 15:17 if the morning run did not commit) | `.github/workflows/fetch-data.yml` |
| Issue-page data: inequality, defence, education, ageing, Brexit, energy, devolution, transport, care, trust, NHS | weekly, Monday | `.github/workflows/refresh-issue-data.yml` -> `frontend/scripts/refresh-issue-data.mjs` |
| Tax rates against the newest Budget | daily | `.github/workflows/tax-data.yml` |
| Who is Prime Minister, Chancellor, and the First Ministers | daily | `.github/workflows/office-holders.yml` |
| Whether the site, its data and its sources are healthy | daily | `.github/workflows/site-health.yml` |

Sources that publish a new edition under a new address (GOV.UK, NHS England, ONS time series, the OECD) are looked up each run, so a new release is picked up without anyone changing a file.

## 2. What is watched (a weekly issue says when it needs a person)

`.github/workflows/content-check.yml` runs `frontend/scripts/audit-content.mjs` every Monday and opens or closes an issue labelled `content-review`. It lists:

- explainer pages and `CHECKED` dates in `frontend/src/data/*.js` that are due a re-read;
- saved data files that have stopped refreshing;
- dated facts in `frontend/scripts/content-ledger.mjs` (`DUE` rows: a fact that stops being true on a known date);
- **hand-typed data on a cadence** (`frontend/scripts/hand-kept.mjs`): each file a person types (inequality gaps, the foreign influence register, inquiries, spending plans, ministerial meetings, party positions, tax wording, pledges and so on) has a row with how often it is re-read (30 to 180 days), the source to read and the files to change; an overdue row appears in the weekly issue. A new file in `src/data` has to be a row, or marked as rewritten by a scheduled job or as fixed, or `hand-kept.test.js` fails;
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

## 7. Checks that run on every push (look-and-feel guards)

These open every page in a browser and fail the build, so a wrong picture cannot ship quietly:

- `frontend/e2e/numbers-fit.audit.mjs`: every page at 320, 390, 768 and 1280 px. Fails on text cut off by the box around it (a headline figure losing its last letters) and on a chart axis that repeats a label ("£25bn" twice). Axis labels take their decimals from the gap between gridlines (`stepDigits` in `src/lib/onsFormat.js`); a new chart formatter should accept `(value, step)` rather than rounding to a fixed number of digits.
- `frontend/e2e/motion-a11y.audit.mjs`: reduced-motion behaviour and screen-reader names for diagrams.
- `frontend/e2e/phone-layout.spec.js`, `flash.audit`, and the WebKit touch checks.

Run any of them locally with `npx vite preview --port 4178 --strictPort` and `node scripts/mock-data-service.mjs 54321` running (see the head of each file).
