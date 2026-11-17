// The everyday-English safety net for the pages that explain Parliament's paperwork (laws made by ministers, committee reports, bills). The best wording is an AI rewrite of the official text
// (saved as `plain` on each record). When there is none, or a rewrite was refused, the official wording is used only if it passes the plain-English check in lay.js; otherwise a short
// summary is built here from the title, the committee or department and the dates, using only what the record itself says. So a reader is never left with "section 58 of the Planning and
// Infrastructure Act 2025 inserted Part 1A" and nothing else. Pure, so it is tested against every saved record (see plainFallback.test.js).

import { isLay } from "./lay";

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const longDate = (iso) => {
  const d = new Date(`${String(iso ?? "").slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

// ---------- laws made by ministers (statutory instruments) ----------

const SUFFIX = /\s+(Regulations|Order|Rules|Scheme|Directions?|Code of Practice|Byelaws|Instrument)$/i;
const ADMIN = /\s*\((?:amendment|consequential|transitional|miscellaneous|commencement|supplementary|saving|revocation|etc|no\.?)[^)]*\)/gi;

// "The Road Vehicles (Registration and Licensing) (Amendment No. 2) Regulations 2026" -> "Road Vehicles (Registration and Licensing)"
export function instrumentTopic(name) {
  let t = clean(name).replace(/^the\s+/i, "").replace(/\s*\(?\b(?:19|20)\d{2}\)?$/, "").replace(SUFFIX, "");
  t = t.replace(ADMIN, "").replace(/\s*\bNo\.?\s*\d+\b/gi, "").replace(/\s+/g, " ").trim();
  return t || clean(name);
}

function whatItDoes(name, topic) {
  if (/\(commencement/i.test(name)) return `Sets the date on which parts of ${clean(name).replace(/\s*\(commencement.*$/i, "").replace(/^the\s+/i, "the ") || "an earlier law"} start to apply.`;
  const place = /^(?:the\s+)?(.+?)\s*\(electoral changes\)/i.exec(clean(name));
  if (place) return `Changes the council wards and the number of councillors for ${place[1]}.`;
  if (/\(revocation/i.test(name) || /revocation/i.test(name)) return `Cancels earlier rules on “${topic}”.`;
  if (/\(amendment/i.test(name)) return `Changes the existing rules on “${topic}”.`;
  if (/consequential/i.test(name)) return `Makes small changes to other laws so they fit with “${topic}”.`;
  if (/\bfees?\b/i.test(name)) return `Sets fees connected with “${topic}”.`;
  if (/\border$|\border \d{4}$/i.test(clean(name).replace(/\s*\d{4}$/, ""))) return `A formal order about “${topic}”.`;
  if (/code of practice/i.test(name)) return `Brings into force a code of practice on “${topic}”.`;
  return `Sets out the detailed rules on “${topic}”.`;
}

// r: { name, department, route, inForce, summary: [...], plain }. today: "YYYY-MM-DD" (to say "comes into force" or "came into force").
export function instrumentInShort(r, today = "") {
  const topic = instrumentTopic(r?.name);
  const out = [whatItDoes(clean(r?.name), topic)];
  if (r?.department) out.push(`It was laid before Parliament by ${clean(r.department)}.`);
  out.push("Ministers can make rules like this without a new Act because an earlier Act of Parliament gave them the power.");
  const when = longDate(r?.inForce);
  if (when) out.push(`${today && String(r.inForce).slice(0, 10) > today ? "It comes into force on" : "It came into force on"} ${when}.`);
  return out.join(" ");
}

// What to show for one instrument: { text, source } where source is "ai" (a saved rewrite), "official" (the Government's note read well enough as it is) or "title" (built here).
export function instrumentPlain(r, today = "") {
  if (clean(r?.plain) && isLay(clean(r.plain), { maxSentence: 60 })) return { text: clean(r.plain), source: "ai" };
  const first = clean(r?.summary?.[0]);
  if (first && isLay(first)) return { text: first, source: "official" };
  return { text: instrumentInShort(r, today), source: "title" };
}

// ---------- select committee reports ----------

export function reportTitle(title) {
  return clean(title).replace(/^(?:(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+)?report(?:\s+of\s+session\s+[\d–-]+)?\s*[-:–]\s*/i, "").replace(/^government response\s*[-:–]\s*/i, "") || clean(title);
}

export function reportInShort(r, today = "") {
  const group = /lords/i.test(r?.house ?? "") ? "peers" : "MPs";
  const committee = clean(r?.committee) || "A committee";
  let tail = /was appointed to (.+?)\.?$/i.exec(clean(r?.role))?.[1]?.replace(/\bin respect of\b/gi, "for");
  if (tail && !isLay(tail, { maxSentence: 60 })) tail = undefined;
  const out = [`${committee} is a group of ${group} ${tail ? `set up to ${tail.replace(/^consider\b/i, "look at")}` : "who look closely at one area of the government's work"}.`];
  out.push(`This report is called “${reportTitle(r?.title)}”.`);
  if (r?.replies?.length) out.push("The government has replied.");
  else if (r?.due) out.push(`${today && r.due < today ? "The government's reply was due by" : "The government is expected to reply by"} ${longDate(r.due) ?? r.due}.`);
  return out.join(" ");
}

export function reportPlain(r, today = "") {
  if (clean(r?.plain) && isLay(clean(r.plain), { maxSentence: 60 })) return { text: clean(r.plain), source: "ai" };
  const first = clean(r?.about?.[0]);
  if (first && isLay(first)) return { text: first, source: "official" };
  return { text: reportInShort(r, today), source: "title" };
}

// ---------- bills ----------

// A last resort for a bill whose title could not be put into everyday words: say what it is and point to the full text.
export function billInShort(bill) {
  const name = clean(bill?.short_title);
  return name ? `A proposed law called the ${name.replace(/\s+Bill$/i, "")} Bill. Its official title is written in legal language, so the full wording is on Parliament's own page.` : "A proposed law. Its official title is written in legal language, so the full wording is on Parliament's own page.";
}
