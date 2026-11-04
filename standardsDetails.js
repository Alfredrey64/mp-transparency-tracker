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

// The side headings the report prints beside a paragraph ("recommendation", "conclusion") are not part of the sentence. A full stop after an abbreviation ("the Rt Hon.") or a
// paragraph number ("22.") does not end one.
const ABBREVIATIONS = /\b(Hon|Rt|No|St|Mrs|Ms|Dr|Mr|Prof|Cllr|Col|Lt|Capt|Rev|para|paras|approx)\./g;
const sentences = (text) => text.replace(ABBREVIATIONS, "$1\u0001").match(/[^.!?]+(?:[.!?]+["”’)]*|$)/g)?.map((s) => s.trim().replace(/\u0001/g, ".").replace(/^(?:recommendations?|conclusions?)\s+(?=[A-Z])/i, "")).filter((s) => s && !/^\d{1,3}\.$/.test(s)) ?? [];

// A sentence that cannot stand on its own as a statement: it leans on the one before ("However, ..."), breaks off into a list, or is not finished.
const standsAlone = (s) => /[.!?]["”’)]*$/.test(s) && !/^(However|But|Although|Accordingly|Further|Also|Moreover|In respect|With respect)\b/.test(s) && !/[:;]\s*\(?[a-z]\)/.test(s) && (s.match(/\(/g) ?? []).length === (s.match(/\)/g) ?? []).length;

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

// The Committee's own report: from its "Introduction" heading in the newer layout, or from its "Report" heading in the older one (which has no Introduction), to the appendix.
function committeeBody(lines) {
  const at = lines.map((l, i) => [l.trim(), i]).filter(([l]) => l === "Summary").map(([, i]) => i);
  const contents = lines.findIndex((l) => l.trim() === "Contents");
  let start = lines.findIndex((l) => l.trim() === "Introduction");
  if (start < 0) start = lines.findIndex((l, i) => i > contents && l.trim() === "Report");
  const end = at.length ? at[at.length - 1] : lines.length;
  return start < 0 || start >= end ? "" : flatten(lines.slice(start + 1, end));
}

// The older layout opens "This report arises from an investigation by the Parliamentary Commissioner for Standards into whether Mr X had breached ...", and says later "The
// Commissioner has given his opinion that ...". Those two sentences, with the first turned into a statement of what the Commissioner looked at, are what happened.
function olderWhatHappened(body) {
  const ss = sentences(body);
  const arises = ss.findIndex((s) => /^This report arises from an investigation by the Parliamentary Commissioner for Standards\b/.test(s));
  if (arises < 0) return "";
  const first = ss[arises].replace(/\s*\(PCS\)/, "");
  let asked = /\binto whether\b/.test(first) ? first.replace(/^This report arises from an investigation by the Parliamentary Commissioner for Standards\s+into whether\b/, "The Parliamentary Commissioner for Standards investigated whether") : null;
  if (!asked) asked = ss.slice(arises + 1, arises + 3).find((s) => /^The Commissioner investigated whether\b/.test(s)) ?? null;
  const opinion = ss.find((s) => /^The Commissioner has (?:given his opinion|stated his opinion|concluded|found) that\b/.test(s) && standsAlone(s));
  if (!asked || !standsAlone(asked) || !opinion || asked.length > 320 || opinion.length > 330) return "";
  const text = `${asked} ${opinion}`;
  return stillFirstPerson(text) || text.length > MAX_WHAT ? "" : text;
}

export function whatHappened(lines) {
  // The Committee's own opening and the Commissioner's opinion, where the report has them, say it best; the Commissioner's summary is the other source.
  const own = olderWhatHappened(committeeBody(lines));
  if (own) return own;
  const summary = memorandumSummary(lines);
  if (!summary) return "";
  const parts = sentences(summary).filter((s) => !/^This memorandum reports/i.test(s) && !/^(Daniel Greenberg|Parliamentary Commissioner)/i.test(s));
  // The question the inquiry asked, then what the Commissioner concluded.
  const asked = parts.filter(standsAlone).find((s) => /\b(focused on|sought to establish|investigated whether|investigated a complaint)\b/i.test(s) && !/^Having/i.test(s));
  const concluded = parts.filter(standsAlone).find((s) => /\b(I am of the view|I have found|I have concluded)\b/.test(s));
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
  const direct = all.filter((s) => /^We (?:therefore |now |also )?recommend\b/.test(s) && standsAlone(s));
  const reported = all.filter((s) => /\brecommended no further action\b|\bwe recommend\b/i.test(s) && standsAlone(s));
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
