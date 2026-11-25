// specialAdvisers.js
//
// Turns the Cabinet Office's annual report on special advisers (published on GOV.UK each summer, as the Constitutional Reform and Governance Act 2010 section 16 requires) into the short
// file the Special advisers page uses: how many there are, what they cost, the four pay bands, and the list of who is employed by which minister at what pay band.
// Pure functions, no network, so they can be tested. Nothing here is estimated: every figure is read from the report's own text and tables, and if the report's layout changes so
// that a figure cannot be found, `parseReport` throws and the existing file is kept.

const LIGATURES = { "ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl" };
const ENTITIES = { "&amp;": "&", "&nbsp;": " ", "&quot;": "\"", "&#39;": "'", "&rsquo;": "’", "&lsquo;": "‘", "&ndash;": "–", "&mdash;": "—", "&pound;": "£" };

export const plain = (html) => String(html ?? "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&[#a-z0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
  .replace(/[ﬀ-ﬄ]/g, (c) => LIGATURES[c])
  .replace(/\s+/g, " ")
  .trim();

const num = (s) => Number(String(s).replace(/,/g, ""));

// The footnotes at the end of the report: "fn:4" -> "Salary temporarily uplifted".
export function footnotes(html) {
  const out = {};
  for (const m of String(html).matchAll(/<li\b[^>]*id="fn:(\d+)"[^>]*>([\s\S]*?)<\/li>/gi)) out[m[1]] = plain(m[2].replace(/<a\b[^>]*class="reversefootnote"[\s\S]*?<\/a>/gi, "").replace(/↩/g, ""));
  return out;
}

const SHORT_NOTE = [
  [/temporar(il)?y uplifted/i, "Salary temporarily uplifted"],
  [/temporary appointment/i, "Temporary appointment"],
  [/full time equivalent/i, "Part time (salary band shown is full-time equivalent)"],
  [/works part time|works part-time|temporarily works part time/i, "Part time"],
  [/works 50% time/i, "Splits time between two ministers"],
  [/council of economic advisers/i, "Council of Economic Advisers"],
];
const shortNote = (text) => SHORT_NOTE.find(([re]) => re.test(text))?.[1] ?? text;

// A cell may carry footnote markers: <sup id="fnref:4"> ... </sup>, and sometimes the number is also glued to the name ("Sophie Nazemi4").
function cell(html, notes) {
  const used = [...String(html).matchAll(/<sup\b[^>]*id="fnref:(\d+)/gi)].map((m) => m[1]);
  const text = plain(String(html).replace(/<sup\b[\s\S]*?<\/sup>/gi, ""));
  return { text, notes: used.map((id) => notes[id]).filter(Boolean).map(shortNote) };
}

export function tableRows(html) {
  return [...String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => [...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => c[1])).filter((r) => r.length);
}

// "The Rt Hon Sir Keir Starmer KCB KC MP" stays as the report has it; the job is what comes before the dash.
// The report separates the two with a dash, written as "–", "-" or "–" with or without spaces, so the split is at the last dash that is followed by a title or honorific.
const DASH = /\s*[–—-]\s*(?=(?:The )?(?:Rt\b|Right Hon)|Baroness\b|Lord\b|Sir\b|Dame\b|Dr\b|Mr\b|Ms\b|Mrs\b)/g;
const honorific = (p) => p.replace(/^(?:The )?(?:Rt\.? (?:Hon\.? )?|Right Hon(?:ourable)? )/i, "").trim();
export function splitMinister(text) {
  const t = plain(text);
  const at = [...t.matchAll(DASH)].at(-1);
  if (!at) return { role: t, person: null };
  return { role: t.slice(0, at.index).trim(), person: honorific(t.slice(at.index + at[0].length)) };
}

// "The Prime Minister, First Lord of the Treasury, ..." -> "The Prime Minister". Everyone else's title has no commas of its own that matter.
export const shortRole = (role) => (role.includes(",") && role.length > 70 ? role.split(",")[0].trim() : role);

export function parseAdvisers(html) {
  const notes = footnotes(html);
  const rows = tableRows(html).filter((r) => r.length === 4 && !/<th/i.test(r.join("")));
  const out = [];
  for (const r of rows) {
    const minister = splitMinister(cell(r[0], notes).text);
    const name = cell(r[1], notes);
    const band = Number(plain(r[2]));
    if (!name.text || !(band >= 1 && band <= 4)) continue;
    const salary = plain(r[3]);
    out.push({
      role: shortRole(minister.role),
      minister: minister.person,
      name: name.text.replace(/\d+$/, "").trim(),
      band,
      salary: /^£/.test(salary) ? salary.replace(/\s*-\s*/, " to ").replace(/(\d)-£/, "$1 to £") : null,
      notes: [...new Set(name.notes)],
    });
  }
  return out;
}

export function parseCosts(html) {
  const t = tableRows(html).filter((r) => r.length === 3);
  const head = t.find((r) => /april/i.test(plain(r[1])));
  const periods = head ? [plain(head[1]), plain(head[2])] : null;
  const money = (s) => { const m = /£([\d.]+)\s*m/i.exec(plain(s)); return m ? Number(m[1]) : null; };
  const rows = t.filter((r) => !/april/i.test(plain(r[1]))).map((r) => ({ label: plain(r[0]), current: money(r[1]), previous: money(r[2]) })).filter((r) => r.current !== null && r.previous !== null);
  return { periods, rows };
}

export function parseBands(text) {
  return [...String(text).matchAll(/Pay Band (\d)\s+([A-Za-z ]+?)\s*-\s*£([\d,]+) to £([\d,]+)/g)].map((m) => ({ band: Number(m[1]), title: m[2].trim(), from: num(m[3]), to: num(m[4]) }));
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function isoDay(text) {
  const m = /(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})/.exec(text);
  return m ? `${m[3]}-${String(MONTHS.indexOf(m[2]) + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}` : null;
}

// The whole report page (the HTML body GOV.UK serves for it) -> the data the page needs.
export function parseReport(html) {
  const text = plain(html);
  const count = /there were (\d+) \((\d+) full[- ]time equivalent\) special advisers/i.exec(text);
  const asAt = /special advisers in post as (?:at|of) (\d{1,2} \w+ \d{4})/i.exec(text);
  const paybill = /paybill for the financial year ([^.]*?) was £([\d.]+) million/i.exec(text);
  const severance = /includes £([\d.]+) million paid in severance/i.exec(text);
  const share = /represent (\d[\d.]*) per cent of the Civil Service/i.exec(text);
  const csTotal = /had ([\d,]+) \(([\d,]+) full[- ]time equivalent\) civil servants/i.exec(text);
  const costs = parseCosts(html);
  const bands = parseBands(text);
  const advisers = parseAdvisers(html);
  const problems = [];
  if (!count) problems.push("number of special advisers");
  if (!asAt || !isoDay(asAt[1])) problems.push("date of the list");
  if (!paybill) problems.push("pay bill");
  if (!costs.periods || costs.rows.length < 3) problems.push("cost table");
  if (bands.length !== 4) problems.push("four pay bands");
  if (advisers.length < 50) problems.push("list of advisers");
  if (count && advisers.length < Number(count[1])) problems.push("every adviser on the list");
  if (problems.length) throw new Error(`The report's layout has changed: could not read ${problems.join(", ")}.`);
  return {
    asAt: isoDay(asAt[1]),
    count: Number(count[1]),
    fte: Number(count[2]),
    paybill: { period: paybill[1].trim(), millions: Number(paybill[2]), severanceMillions: severance ? Number(severance[1]) : null },
    civilService: csTotal ? { total: num(csTotal[1]), fte: num(csTotal[2]), sharePercent: share ? Number(share[1]) : null } : null,
    costs,
    bands,
    advisers,
  };
}

// Counts for the page: advisers per appointing minister (the person, with their job), and per pay band.
export function perMinister(advisers) {
  const m = new Map();
  for (const a of advisers) {
    const key = `${a.role}|${a.minister ?? ""}`;
    const cur = m.get(key) ?? { role: a.role, minister: a.minister, count: 0 };
    cur.count += 1;
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));
}

export const perBand = (advisers) => [1, 2, 3, 4].map((band) => ({ band, count: advisers.filter((a) => a.band === band).length }));

// The latest edition of the report on the collection page's list: the first whose title says "numbers and costs".
export function latestEdition(collection) {
  const docs = (collection?.links?.documents ?? []).filter((d) => /numbers and costs/i.test(d.title ?? ""));
  docs.sort((a, b) => String(b.public_updated_at).localeCompare(String(a.public_updated_at)));
  return docs[0] ? { path: docs[0].base_path, title: docs[0].title, updated: String(docs[0].public_updated_at).slice(0, 10) } : null;
}

// The publication's own page lists its HTML version as an attachment whose address ends in "-html".
export function htmlAttachment(publication) {
  const a = (publication?.details?.attachments ?? []).find((x) => /\/[^/]+-html$/.test(x.url ?? "") && !/\.pdf$/i.test(x.url));
  return a?.url ?? null;
}
