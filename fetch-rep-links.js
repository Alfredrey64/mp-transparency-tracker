// fetch-rep-links.js
//
// What this does, in plain terms:
// 1. Reads the list of police and crime commissioners and regional mayors the site shows (frontend/src/data/representatives.json).
// 2. For each, finds the website of the OFFICE they hold (for example the Devon and Cornwall Police and Crime Commissioner's own site), not a personal or campaign site:
//    the person's Wikipedia article -> the matching Wikidata item -> its "position held" items -> the one whose name is this seat's office -> that office's official website,
//    which Wikidata records. A position is only used when its name matches the same place and the same kind of office.
// 3. Opens each address to check it is still there. A site that answers "not found" or cannot be reached is not linked; one that refuses automated visitors (403 or 429) still is,
//    because it exists. Nothing is guessed: no match, no link.
// 4. Writes frontend/src/data/repLinks.json (key -> { url, office }) with the date it was checked. If Wikidata cannot be read at all, the old file is left alone.
//
// Run it with: node fetch-rep-links.js

import fs from "node:fs";
import { fetchRetry, mapLimit } from "./httpFetch.js";
import { wikiTitleFor } from "./repPortraits.js";
import { officeSite, cleanUrl } from "./repLinks.js";
import { repKey } from "./frontend/src/lib/repPortrait.js";

const REPS = "frontend/src/data/representatives.json";
const OUT_JSON = "frontend/src/data/repLinks.json";
const HEADERS = { "User-Agent": "domesday-live/1.0 (civic information site; contact via GitHub)" };

const json = async (url) => {
  const res = await fetchRetry(url, { headers: HEADERS }, { gapMs: 0, timeoutMs: 45_000 });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
};
const wikitext = async (title) => (await json(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`)).parse.wikitext;
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

// A redirect is only followed into the link when it stays on the same site (a bot-protection or login page elsewhere must never become the link).
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
const sameSite = (a, b) => host(a) !== null && host(a) === host(b);

// Does the address answer? -> { ok, url } (the address after any redirects) or { ok: false, gone } where gone means the site said not found.
async function alive(url) {
  try {
    const res = await fetch(url, { headers: { ...HEADERS, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(25_000) });
    if (res.status < 400) return { ok: true, url: sameSite(url, res.url) ? cleanUrl(res.url) : cleanUrl(url) };
    if (res.status === 403 || res.status === 429) return { ok: true, url: cleanUrl(url) };
    return { ok: false, gone: res.status === 404 || res.status === 410 };
  } catch { return { ok: false, gone: false }; }
}

async function main() {
  const reps = JSON.parse(fs.readFileSync(REPS, "utf8"));
  const old = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")).links ?? {} : {};

  const wanted = new Map(); // key -> { kind, name, place }
  for (const [force, p] of Object.entries(reps.pcc)) if (p?.name) wanted.set(repKey("pcc", p.name), { kind: "pcc", name: p.name, place: force });
  for (const m of reps.mayors) if (m?.name) wanted.set(repKey("mayor", m.name), { kind: "mayor", name: m.name, place: m.post || m.authority });
  console.log(`${wanted.size} commissioners and mayors listed.`);

  const texts = { pcc: await wikitext("Police and crime commissioner"), mayor: await wikitext("Strategic authority mayor") };
  const titles = new Map([...wanted].map(([key, o]) => [key, wikiTitleFor(texts[o.kind], o.name)]));

  // Wikipedia article -> Wikidata item
  const itemOf = new Map();
  for (const chunk of chunks([...new Set(titles.values())], 20)) {
    const r = await json(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(chunk.join("|"))}`);
    const redirect = new Map((r.query.redirects ?? []).map((x) => [x.from, x.to]));
    const norm = new Map((r.query.normalized ?? []).map((x) => [x.from, x.to]));
    const byTitle = new Map(r.query.pages.map((p) => [p.title, p]));
    for (const t of chunk) { const n = norm.get(t) ?? t; itemOf.set(t, byTitle.get(redirect.get(n) ?? n)?.pageprops?.wikibase_item); }
  }

  // person item -> position-held items
  const personItems = [...new Set([...titles.values()].map((t) => itemOf.get(t)).filter(Boolean))];
  const positionsOf = new Map();
  for (const chunk of chunks(personItems, 40)) {
    const r = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims&format=json`);
    for (const q of chunk) positionsOf.set(q, (r.entities?.[q]?.claims?.P39 ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean));
  }
  // position item -> label and official website
  const posItems = [...new Set([...positionsOf.values()].flat())];
  const position = new Map();
  for (const chunk of chunks(posItems, 40)) {
    const r = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims|labels&languages=en&format=json`);
    for (const q of chunk) {
      const e = r.entities?.[q];
      const sites = (e?.claims?.P856 ?? []).filter((c) => c.rank !== "deprecated").sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred"));
      position.set(q, { label: e?.labels?.en?.value ?? "", url: sites[0]?.mainsnak?.datavalue?.value ?? null });
    }
  }

  // A mayor's office often has no website recorded, but the combined authority that runs it does: the authority's own Wikipedia article -> Wikidata item -> website. Used only when the
  // article is not a disambiguation page and the item's name names the same place as the authority in the list.
  const authorityOf = new Map(reps.mayors.filter((m) => m?.name && m.authority).map((m) => [repKey("mayor", m.name), m.authority]));
  const authSite = new Map();
  {
    const auths = [...new Set(authorityOf.values())];
    const qOf = new Map();
    for (const chunk of chunks(auths, 20)) {
      const r = await json(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(chunk.join("|"))}`);
      const redirect = new Map((r.query.redirects ?? []).map((x) => [x.from, x.to]));
      const norm = new Map((r.query.normalized ?? []).map((x) => [x.from, x.to]));
      const byTitle = new Map(r.query.pages.map((p) => [p.title, p]));
      for (const t of chunk) { const pg = byTitle.get(redirect.get(norm.get(t) ?? t) ?? norm.get(t) ?? t); if (pg && !pg.missing && pg.pageprops?.disambiguation === undefined && pg.pageprops?.wikibase_item) qOf.set(t, pg.pageprops.wikibase_item); }
    }
    for (const chunk of chunks([...new Set(qOf.values())], 40)) {
      const r = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims|labels&languages=en&format=json`);
      for (const [auth, q] of qOf) {
        const e = r.entities?.[q];
        if (!e) continue;
        const site = (e.claims?.P856 ?? []).filter((c) => c.rank !== "deprecated").sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred"))[0]?.mainsnak?.datavalue?.value;
        const label = e.labels?.en?.value ?? "";
        if (site && officeSite([{ label: `Mayor of ${label}`, url: site }], { kind: "mayor", place: auth })) authSite.set(auth, { url: site, office: label });
      }
    }
  }

  const links = {};
  const noMatch = [];
  const dead = [];
  await mapLimit([...wanted], 6, async ([key, o]) => {
    const q = itemOf.get(titles.get(key));
    const found = officeSite((positionsOf.get(q) ?? []).map((id) => position.get(id)).filter(Boolean), { kind: o.kind, place: o.place });
    const viaAuthority = !found && o.kind === "mayor" ? authSite.get(authorityOf.get(key)) : null;
    const raw = found ? cleanUrl(found) : viaAuthority ? cleanUrl(viaAuthority.url) : null;
    if (!raw) { noMatch.push(o.name); if (process.env.DEBUG) console.log(`  ${o.name} [${o.place}]: ${(positionsOf.get(q) ?? []).map((id) => position.get(id)).filter(Boolean).map((p) => `${p.label} => ${p.url ?? "no site"}`).join(" ; ") || "no positions on Wikidata"}`); return; }
    const a = await alive(raw);
    if (a.ok) { links[key] = { url: a.url, office: viaAuthority ? viaAuthority.office : (positionsOf.get(q) ?? []).map((id) => position.get(id)).find((p) => p?.url === found)?.label }; return; }
    // A site that could not be reached just now (not one that said "not found") keeps the address found last time.
    if (!a.gone && old[key]) links[key] = old[key]; else dead.push(`${o.name} (${raw})`);
  });

  const sorted = Object.fromEntries(Object.entries(links).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ checked: new Date().toISOString().slice(0, 10), links: sorted }) + "\n");
  console.log(`Linked ${Object.keys(sorted).length} of ${wanted.size}. No office website found for ${noMatch.length}: ${noMatch.join(", ")}`);
  if (dead.length) console.log(`Not linked because the address did not answer: ${dead.join("; ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
