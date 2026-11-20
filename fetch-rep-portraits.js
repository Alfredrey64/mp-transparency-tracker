// fetch-rep-portraits.js
//
// What this does, in plain terms:
// 1. Reads the list of regional office-holders the site shows (frontend/src/data/representatives.json): police and crime commissioners, regional mayors, members of the Senedd,
//    Scottish Parliament and Northern Ireland Assembly.
// 2. Finds a photo for each from a source that publishes one:
//      - MSPs: the Scottish Parliament's open data (its own official photo),
//      - MLAs: the Northern Ireland Assembly's open data (its own official photo),
//      - commissioners, mayors and Senedd members: the lead photo of their Wikipedia article, taken ONLY when Wikimedia Commons says it is freely licensed (Creative Commons,
//        public domain or the Open Government Licence). The photographer and licence are saved with it so the page can credit them.
//    A person whose photo is not freely licensed, or who has none, simply keeps the initials circle. Nothing is guessed.
// 3. Shrinks each photo to a small WebP (144 pixels tall) in frontend/public/portraits/reps/ and writes frontend/src/data/repPortraits.json (who each photo is, where it came from, the credit).
//    Photos already saved are kept, so a re-run only fetches newcomers. A photo is dropped from the list when the person no longer appears in representatives.json.
//
// Needs the `cwebp` tool (macOS: brew install webp). Run it with: node fetch-rep-portraits.js   (add --refresh to download everything again)

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fetchRetry, mapLimit } from "./httpFetch.js";
import { wikiTitleFor, freeLicence, creditFrom } from "./repPortraits.js";
import { repKey } from "./frontend/src/lib/repPortrait.js";

const REPS = "frontend/src/data/representatives.json";
const OUT_DIR = "frontend/public/portraits/reps";
const OUT_JSON = "frontend/src/data/repPortraits.json";
const HEADERS = { "User-Agent": "domesday-live/1.0 (civic information site; contact via GitHub)" };
const refresh = process.argv.includes("--refresh");

const json = async (url) => {
  const res = await fetchRetry(url, { headers: HEADERS }, { gapMs: 0, timeoutMs: 45_000 });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
};
const wikitext = async (title) => (await json(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`)).parse.wikitext;

function toWebp(bytes, dest) {
  const tmp = path.join(os.tmpdir(), `rep-${process.pid}-${Math.random().toString(36).slice(2)}.img`);
  fs.writeFileSync(tmp, bytes);
  try {
    const r = spawnSync("cwebp", ["-quiet", "-q", "78", "-m", "6", "-resize", "0", "144", tmp, "-o", dest]);
    if (r.status !== 0) throw new Error(`cwebp failed: ${String(r.stderr || r.error).trim()}`);
  } finally { fs.rmSync(tmp, { force: true }); }
}

async function download(url) {
  const res = await fetchRetry(url, { headers: HEADERS }, { gapMs: 0, timeoutMs: 60_000 });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const reps = JSON.parse(fs.readFileSync(REPS, "utf8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const old = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")).people ?? {} : {};

  // ---- who is wanted: key -> { kind, name }
  const wanted = new Map();
  const want = (kind, name) => { if (name) wanted.set(repKey(kind, name), { kind, name }); };
  Object.values(reps.pcc).forEach((p) => want("pcc", p.name));
  reps.mayors.forEach((m) => want("mayor", m.name));
  Object.values(reps.senedd).flat().forEach((m) => want("senedd", m.name));
  Object.values(reps.scotland.constituencies).forEach((c) => want("msp", c.msp?.name));
  Object.values(reps.scotland.regions).flat().forEach((m) => want("msp", m.name));
  Object.values(reps.ni).flat().forEach((m) => want("mla", m.name));
  console.log(`${wanted.size} office-holders listed.`);

  const people = {};
  for (const [key, o] of Object.entries(old)) if (wanted.has(key) && !refresh && fs.existsSync(path.join(OUT_DIR, o.file))) people[key] = o;

  // ---- Scottish Parliament: official photo by member id, matched on the same name the list uses
  const members = await json("https://data.parliament.scot/api/members");
  const mspName = (m) => `${m.PreferredName ?? ""} ${String(m.ParliamentaryName ?? "").split(",")[0]}`.trim();
  const mspPhoto = new Map(members.filter((m) => m.IsCurrent && m.PhotoURL).map((m) => [repKey("msp", mspName(m)), m.PhotoURL]));

  // ---- Northern Ireland Assembly: official photo by member
  const niRes = await fetchRetry("http://data.niassembly.gov.uk/members_json.asmx/GetAllCurrentMembers_JSON", { headers: HEADERS }, { gapMs: 0 });
  const niText = await niRes.text();
  const niMembers = JSON.parse(niText.slice(niText.indexOf("{"), niText.lastIndexOf("}") + 1)).AllMembersList.Member ?? [];
  const tidyNi = (s) => String(s).replace(/^(Dr|Mr|Mrs|Ms|Miss|Rt Hon|Sir|Lord|Lady)\s+/i, "").replace(/\s+(OBE|MBE|CBE|MP|MLA|KC|QC|DL)\b/gi, "").trim();
  const niPhoto = new Map(niMembers.filter((m) => m.MemberImgUrl).map((m) => [repKey("mla", tidyNi(m.MemberFullDisplayName)), String(m.MemberImgUrl).replace(/^http:/, "https:")]));

  // ---- Wikipedia: the article each name links to in the same lists the names came from
  const [pccText, mayorText, seneddText] = await Promise.all(["Police and crime commissioner", "Strategic authority mayor", "List of members of the Senedd"].map(wikitext));
  const texts = { pcc: pccText, mayor: mayorText, senedd: seneddText };

  const todo = [...wanted.entries()].filter(([key]) => !people[key]);
  const wikiWanted = todo.filter(([, o]) => ["pcc", "mayor", "senedd"].includes(o.kind));
  const titles = new Map(wikiWanted.map(([key, o]) => [key, wikiTitleFor(texts[o.kind], o.name)]));

  // Lead image of each article (file name and a small copy), 20 articles at a time.
  const pages = new Map();
  const uniq = [...new Set(titles.values())];
  for (let i = 0; i < uniq.length; i += 20) {
    const chunk = uniq.slice(i, i + 20);
    const r = await json(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=name|thumbnail&pithumbsize=320&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(chunk.join("|"))}`);
    const redirect = new Map((r.query.redirects ?? []).map((x) => [x.from, x.to]));
    const norm = new Map((r.query.normalized ?? []).map((x) => [x.from, x.to]));
    const byTitle = new Map(r.query.pages.map((p) => [p.title, p]));
    for (const t of chunk) { const n = norm.get(t) ?? t; pages.set(t, byTitle.get(redirect.get(n) ?? n)); }
  }
  // Licence and photographer of each lead image.
  const files = [...new Set([...pages.values()].map((p) => p?.pageimage).filter(Boolean))];
  const meta = new Map();
  for (let i = 0; i < files.length; i += 20) {
    const chunk = files.slice(i, i + 20);
    const r = await json(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&formatversion=2&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join("|"))}`);
    for (const p of r.query.pages ?? []) meta.set(String(p.title).replace(/^File:/, "").replace(/ /g, "_"), p.imageinfo?.[0]?.extmetadata);
  }

  // When an article's lead image is missing or not freely licensed, the photo Wikidata lists for the same person (property P18, "image") is tried instead: it is often a different, freely
  // licensed picture of the same article's subject. It is held to exactly the same licence test, and only the article already matched to the person is used.
  const alt = new Map();
  const needAlt = wikiWanted.filter(([key]) => {
    const p = pages.get(titles.get(key));
    if (!p || p.missing || p.pageprops?.disambiguation !== undefined || !p.pageprops?.wikibase_item) return false;
    return !(p.thumbnail?.source && freeLicence(meta.get(String(p.pageimage).replace(/ /g, "_"))));
  });
  const items = [...new Set(needAlt.map(([key]) => pages.get(titles.get(key)).pageprops.wikibase_item))];
  const claimFiles = new Map();
  for (let i = 0; i < items.length; i += 40) {
    const chunk = items.slice(i, i + 40);
    try {
      const r = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims&format=json`);
      for (const q of chunk) claimFiles.set(q, (r.entities?.[q]?.claims?.P18 ?? []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean));
    } catch (e) { console.warn(`  Wikidata images not read for ${chunk.length} people: ${e.message}`); }
  }
  const altFiles = [...new Set([...claimFiles.values()].flat())];
  const altInfo = new Map();
  for (let i = 0; i < altFiles.length; i += 20) {
    const chunk = altFiles.slice(i, i + 20);
    try {
      const r = await json(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=320&format=json&formatversion=2&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join("|"))}`);
      for (const p of r.query.pages ?? []) altInfo.set(String(p.title).replace(/^File:/, "").replace(/ /g, "_"), p.imageinfo?.[0]);
    } catch (e) { console.warn(`  Commons licences not read for ${chunk.length} files: ${e.message}`); }
  }
  for (const [key] of needAlt) {
    for (const f of claimFiles.get(pages.get(titles.get(key)).pageprops.wikibase_item) ?? []) {
      const info = altInfo.get(String(f).replace(/ /g, "_"));
      const lic = freeLicence(info?.extmetadata);
      if (lic && info?.thumburl) { alt.set(key, { url: info.thumburl, lic, credit: creditFrom(info.extmetadata) }); break; }
    }
  }

  // Checked by eye: the free image Wikipedia lists for these people is not a picture of the person (for example an election sign), so they stay on initials.
  const NOT_A_PORTRAIT = new Set(["pcc:dafydd-llywelyn"]);
  let skipped = 0;
  const failures = [];
  await mapLimit(todo, 4, async ([key, o]) => {
    const file = `${key.replace(/[^a-z0-9]+/g, "-")}.webp`;
    if (NOT_A_PORTRAIT.has(key)) { skipped++; return; }
    try {
      let url; let credit; let licence; let source; let page;
      if (o.kind === "msp") { url = mspPhoto.get(key); credit = "Scottish Parliament"; source = "Scottish Parliament"; }
      else if (o.kind === "mla") { url = niPhoto.get(key); credit = "Northern Ireland Assembly"; source = "Northern Ireland Assembly"; }
      else {
        const p = pages.get(titles.get(key));
        if (!p || p.missing || p.pageprops?.disambiguation !== undefined) { skipped++; return; }
        const m = p.thumbnail?.source ? meta.get(String(p.pageimage).replace(/ /g, "_")) : null;
        const lic = freeLicence(m);
        if (lic) { url = p.thumbnail.source; licence = lic; credit = creditFrom(m); }
        else if (alt.has(key)) { ({ url, lic: licence, credit } = alt.get(key)); }
        else { skipped++; return; }
        source = "Wikimedia Commons";
        page = `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`;
      }
      if (!url) { skipped++; return; }
      toWebp(await download(url), path.join(OUT_DIR, file));
      people[key] = { file, source, credit, ...(licence ? { licence } : {}), ...(page ? { page } : {}) };
    } catch (e) { failures.push(`${key}: ${e.message}`); }
  });

  const sorted = Object.fromEntries(Object.entries(people).sort(([a], [b]) => a.localeCompare(b)));
  // Remove photos of people no longer listed.
  for (const f of fs.readdirSync(OUT_DIR)) if (!Object.values(sorted).some((o) => o.file === f)) fs.rmSync(path.join(OUT_DIR, f));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ checked: new Date().toISOString().slice(0, 10), people: sorted }) + "\n");
  const by = {};
  for (const k of Object.keys(sorted)) by[k.split(":")[0]] = (by[k.split(":")[0]] ?? 0) + 1;
  console.log(`Saved ${Object.keys(sorted).length} of ${wanted.size} photos`, JSON.stringify(by), `; ${skipped} left on initials (no photo or not freely licensed).`);
  if (failures.length) console.warn(`${failures.length} failed:\n  ${failures.slice(0, 12).join("\n  ")}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
