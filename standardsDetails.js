// standardsDetails.js
//
// Turns the text of a Committee on Standards conduct report into the two short boxes the Standards page shows: "What happened" and "The outcome". Pure, so it is tested without the
// network. Both boxes are Parliament's own sentences, picked by where they sit in the report, never summarised in other words:
//  - What happened: the Parliamentary Commissioner's summary at the head of the memorandum in the report's appendix, which says what the inquiry looked at and what the Commissioner
//    concluded, with the first person turned into "the Commissioner".
//  - The outcome: the Committee's own recommendation or conclusion on what should follow, from the body of the report.
// When the report does not follow that pattern, nothing is returned and the page links to the report instead.

const MAX_WHAT = 560;
const MAX_OUTCOME = 420;

const flatten = (lines) => lines.map((l) => l.trim()).filter((l) => l && l !== "\f" && !/^\d{1,3}$/.test(l)).join(" ").replace(/\s+/g, " ");

// The side headings the report prints beside a paragraph ("recommendation", "conclusion") are not part of the sentence.
const sentences = (text) => text.match(/[^.!?]+(?:[.!?]+["”’)]*|$)/g)?.map((s) => s.trim().replace(/^(?:recommendations?|conclusions?)\s+(?=[A-Z])/, "")).filter(Boolean) ?? [];

// The Commissioner writes in the first person; the page says "the Commissioner".
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function thirdPerson(s) {
  return cap(s
    .replace(/^Having [^,]+,\s*(?=I )/, "")
    .replace(/\bI am of the view that\b/g, "the Commissioner found that")
    .replace(/\bI have (?:found|concluded) that\b/g, "the Commissioner found that")
    .replace(/\bI am (?:therefore )?referring\b/g, "the Commissioner referred")
    .replace(/\bI (?:am therefore|am now|therefore)\b/g, "the Commissioner")
    .replace(/\b(to|with|by|from) me\b/g, "$1 the Commissioner")
    .replace(/\b[Mm]y (inquiry|investigation|memorandum)\b/g, (_, w) => `the ${w}`)
    .replace(/\bI (commenced|opened|began|started|investigated|received|considered|interviewed|took|obtained|narrowed|reviewed|examined|established|decided|sought)\b/g, "the Commissioner $1"));
}
const stillFirstPerson = (s) => /\b(I|my|me|myself)\b/.test(s);

function memorandumSummary(lines) {
  const at = lines.map((l, i) => [l.trim(), i]).filter(([l]) => l === "Summary").map(([, i]) => i);
  if (!at.length) return null;
  const start = at[at.length - 1];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /Parliamentary Commissioner for Standards|^Report$/.test(l.trim()));
  return flatten(end < 0 ? rest.slice(0, 40) : rest.slice(0, end));
}

function committeeBody(lines) {
  const at = lines.map((l, i) => [l.trim(), i]).filter(([l]) => l === "Summary").map(([, i]) => i);
  const start = lines.findIndex((l) => l.trim() === "Introduction");
  const end = at.length ? at[at.length - 1] : lines.length;
  return start < 0 || start >= end ? "" : flatten(lines.slice(start + 1, end));
}

export function whatHappened(lines) {
  const summary = memorandumSummary(lines);
  if (!summary) return "";
  const parts = sentences(summary).filter((s) => !/^This memorandum reports/i.test(s) && !/^(Daniel Greenberg|Parliamentary Commissioner)/i.test(s));
  // The question the inquiry asked, then what the Commissioner concluded.
  const asked = parts.find((s) => /\b(focused on|sought to establish|investigated whether|investigated a complaint)\b/i.test(s) && !/^Having/i.test(s));
  const concluded = parts.find((s) => /\b(I am of the view|I have found|I have concluded)\b/.test(s));
  if (!concluded) return "";
  const picked = [asked && asked.length <= 300 ? asked : null, concluded].filter((s, i, a) => s && a.indexOf(s) === i);
  const chosen = picked.map(thirdPerson);
  if (chosen.some((c) => stillFirstPerson(c) || c.length > 320)) return "";
  const text = chosen.join(" ");
  return text.length > MAX_WHAT ? "" : text;
}

const HYPOTHETICAL = /\b(had (?:he|she|they|the committee|the member)|would have|should have been|minded to|if (?:he|she|they)|medical|adjustment|may consider|do not propose|obliged)\b/i;

export function outcome(lines) {
  const body = committeeBody(lines);
  if (!body) return "";
  const all = sentences(body).filter((s) => s.length < 380 && !HYPOTHETICAL.test(s));
  const direct = all.filter((s) => /^We recommend\b/.test(s));
  const reported = all.filter((s) => /\brecommended no further action\b|\bwe recommend\b/i.test(s));
  const chosen = (direct.length ? direct : reported).slice(0, 2);
  const text = chosen.join(" ");
  return text && text.length <= MAX_OUTCOME ? text : "";
}

// { offence, sanction } in the shape of data/standardsReportDetails.json, or null when either part cannot be taken from the report.
export function standardsDetail(lines) {
  const offence = whatHappened(lines);
  const sanction = outcome(lines);
  return offence && sanction ? { offence, sanction } : null;
}
