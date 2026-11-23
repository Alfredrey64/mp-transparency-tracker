// actsFeed.js
//
// Reading legislation.gov.uk's Atom feed of Public General Acts (https://www.legislation.gov.uk/ukpga/<year>/data.feed) into the small list the "How a law is made" page shows.
// Each entry is one Act: its number in the year, its title, the date it was made law (the site's CreationDate, which for an Act is the day of Royal Assent) and its long title. The feed
// also carries, in its facets, how many Public General Acts there are for every year back to 1801, which is where the page's yearly bars come from. Pure functions; nothing fetches here.

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#39;": "'" };
export const decode = (s) => String(s ?? "")
  .replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m])
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/\s+/g, " ")
  .trim();

const pick = (block, re) => block.match(re)?.[1];

// { entries: [{ year, number, title, date, summary, url }], perYear: { "2026": 28, ... }, morePages } for one page of the feed.
export function parseFeed(xml) {
  const entries = [];
  for (const m of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const year = Number(pick(e, /<ukm:Year Value="(\d{4})"/));
    const number = Number(pick(e, /<ukm:Number Value="(\d+)"/));
    const title = decode(pick(e, /<title>([\s\S]*?)<\/title>/));
    const date = pick(e, /<ukm:CreationDate Date="(\d{4}-\d{2}-\d{2})"/);
    const summary = decode(pick(e, /<summary>([\s\S]*?)<\/summary>/));
    if (!year || !number || !title || !date) continue;
    entries.push({ year, number, title, date, summary, url: `https://www.legislation.gov.uk/ukpga/${year}/${number}` });
  }
  const perYear = {};
  for (const m of String(xml).matchAll(/<leg:facetYear year="(\d{4})"[^>]*?total="(\d+)"/g)) perYear[m[1]] = Number(m[2]);
  const morePages = Number(pick(String(xml), /<leg:morePages>(\d+)</) ?? 0);
  return { entries, perYear, morePages };
}

// The Acts of one year in order of number, each once, from pages gathered in any order.
export function inOrder(entries) {
  const seen = new Map();
  for (const e of entries) seen.set(`${e.year}/${e.number}`, e);
  return [...seen.values()].sort((a, b) => a.year - b.year || a.number - b.number);
}

// A year's Acts are numbered 1..n as they are made, so the dates never go backwards and there are no gaps. Anything else means a page was missed or the feed changed shape.
export function looksComplete(entries, expected) {
  if (!entries.length) return false;
  if (expected != null && entries.length !== expected) return false;
  return entries.every((e, i) => e.number === i + 1 && (i === 0 || e.date >= entries[i - 1].date));
}
