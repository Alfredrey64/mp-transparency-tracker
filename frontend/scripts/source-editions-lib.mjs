// Finds out whether a publisher has put out a newer edition of a file the site reads from a fixed address. Most build scripts look up the newest release themselves (GOV.UK's
// search, ONS time series, OECD's open data), so they follow a new release on their own. A few name one edition's file (the ONS income, wealth and population tables, DWP's
// Households Below Average Income, SIPRI's military spending), and would read that same file forever and report "No change". This reads the addresses out of the build scripts
// themselves (so the check can never drift from what the script does) and asks each publisher what its newest edition is.
//
// The functions here only read text and JSON, so they are tested without a network (source-editions-lib.test.js); audit-content.mjs does the asking.

// Every ONS dataset file a script names, as { dataset: "/economy/.../datasets/name", edition: "1997to2024" }.
export function pinnedOnsFiles(scriptText) {
  const seen = new Map();
  for (const m of scriptText.matchAll(/(\/[a-z0-9/]+\/datasets\/[a-z0-9]+)\/([a-z0-9]+)\/[A-Za-z0-9_.-]+\.(?:xlsx|xls|csv|zip)/g)) seen.set(`${m[1]}/${m[2]}`, { dataset: m[1], edition: m[2] });
  return [...seen.values()];
}

// An ONS dataset's page as data (`<page>/data`) lists its editions, newest first.
export function newestOnsEdition(pageJson) {
  const first = pageJson?.datasets?.[0]?.uri;
  return typeof first === "string" ? first.split("/").filter(Boolean).at(-1) : null;
}

// DWP names each Households Below Average Income release by the years it covers: "...-for-financial-years-ending-1995-to-2025". The end year says how new it is.
export const hbaiEndYear = (slug) => Number(/financial-years-ending-\d{4}-to-(\d{4})/.exec(slug ?? "")?.[1]) || null;
export function pinnedHbaiSlug(scriptText) {
  return /government\/statistics\/(households-below-average-income-for-financial-years-ending-\d{4}-to-\d{4})/.exec(scriptText)?.[1] ?? null;
}
// The collection page lists its documents with the latest release first; the first one named "Households below average income: for financial years..." is it.
export function newestHbaiSlug(collectionJson) {
  const docs = collectionJson?.links?.documents ?? [];
  const hit = docs.find((d) => /^\/government\/statistics\/households-below-average-income-for-financial-years-ending-\d{4}-to-\d{4}$/.test(d.base_path ?? ""));
  return hit ? hit.base_path.split("/").at(-1) : null;
}

// SIPRI's file is named for the years it covers: "SIPRI-Milex-data-1949-2025.xlsx" (the page now offers "..._v1.2.xlsx" too).
export const pinnedSipriYear = (scriptText) => Number(/SIPRI-Milex-data-\d{4}-(\d{4})\.xlsx/.exec(scriptText)?.[1]) || null;
export function newestSipriYear(pageHtml) {
  const years = [...String(pageHtml).matchAll(/SIPRI-Milex-data-\d{4}-(\d{4})/g)].map((m) => Number(m[1]));
  return years.length ? Math.max(...years) : null;
}

// Pages the site links to that are one year's edition of a yearly ONS publication ("/bulletins/annualsurveyofhoursandearnings/2026", ".../1997to2024",
// ".../financialyearending2025", ".../mid2025", ".../2022based", ".../april2020tomarch2022"). Each gives { url, shown, next, nextUrl }: the address the next edition would
// have. A publication that has a newer edition shows as an address that answers; one that does not, as a 404. The wording of the edition is the part that moves, so this
// is how a yearly figure typed into the site (an ASHE salary, a pay gap, a wealth survey) is noticed the week after the ONS publishes the next one.
const NEXT = [
  [/^(.*\/)(20\d{2})$/, (m) => [m[2], `${Number(m[2]) + 1}`, `${m[1]}${Number(m[2]) + 1}`]],
  [/^(.*\/\d{4}to)(20\d{2})$/, (m) => [m[2], `${Number(m[2]) + 1}`, `${m[1]}${Number(m[2]) + 1}`]],
  [/^(.*\/financialyearending)(20\d{2})$/, (m) => [m[2], `${Number(m[2]) + 1}`, `${m[1]}${Number(m[2]) + 1}`]],
  [/^(.*\/mid)(20\d{2})$/, (m) => [m[2], `${Number(m[2]) + 1}`, `${m[1]}${Number(m[2]) + 1}`]],
  [/^(.*\/)(20\d{2})(based)$/, (m) => [m[2], `${Number(m[2]) + 2}`, `${m[1]}${Number(m[2]) + 2}${m[3]}`]],
  [/^(.*\/april)(20\d{2})(tomarch)(20\d{2})$/, (m) => [`${m[2]} to ${m[4]}`, `${Number(m[2]) + 2} to ${Number(m[4]) + 2}`, `${m[1]}${Number(m[2]) + 2}${m[3]}${Number(m[4]) + 2}`]],
];
export function yearlyOnsEditions(text) {
  const urls = new Set(String(text).match(/https:\/\/www\.ons\.gov\.uk\/[a-z0-9/]+\/(?:bulletins|articles)\/[a-z0-9]+\/[a-z0-9]+/g) ?? []);
  const out = [];
  for (const url of urls) {
    for (const [re, make] of NEXT) {
      const m = re.exec(url);
      if (m) { const [shown, next, nextUrl] = make(m); out.push({ url, shown, next, nextUrl }); break; }
    }
  }
  // A page cited at several years (a link to the old edition kept beside the new) is only behind if even the newest one cited has a successor.
  const base = (u) => u.replace(/[^/]+$/, "");
  const newest = new Map();
  for (const e of out) if (!newest.has(base(e.url)) || e.nextUrl > newest.get(base(e.url)).nextUrl) newest.set(base(e.url), e);
  return [...newest.values()];
}

// The findings, in the { name, problem } form audit-content.mjs prints.
export function editionFinding({ source, script, pinned, newest, how }) {
  return { name: source, problem: `has a newer edition (${newest}) than the one scripts/${script} reads (${pinned}). ${how}` };
}
