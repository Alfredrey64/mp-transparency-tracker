// statutoryInstruments.js
//
// Turns the statutory instruments Parliament's Statutory Instruments API lists into what the Laws made by ministers page uses: how many were laid in the last 12 months,
// how many of each kind, how many a month, and the most recent ones with the department that laid each. Pure functions, no network, so they can be tested.

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const day = (iso) => String(iso ?? "").slice(0, 10);

// How each kind of instrument gets through Parliament. "Approve" means Parliament has to agree to it; "object" means it goes ahead unless a House objects.
export const PROCEDURES = {
  "Draft affirmative": { key: "draft-affirmative", route: "approve", label: "Draft, needs approval", say: "It cannot become law until Parliament approves it." },
  "Made affirmative": { key: "made-affirmative", route: "approve", label: "Already law, needs approval", say: "It is already law, but it stops being law unless Parliament approves it within a set time." },
  "Draft negative": { key: "draft-negative", route: "object", label: "Draft, goes ahead unless a House objects", say: "It becomes law unless either House objects within 40 days." },
  "Made negative": { key: "made-negative", route: "object", label: "Already law, unless a House objects", say: "It is already law, and stays law unless either House objects within 40 days." },
};

export const procedureOf = (name) => PROCEDURES[clean(name)] ?? null;

// The day the instrument was laid before Parliament: the Commons date, or the Lords date when only that House was given it.
const laidOn = (v) => day(v?.commonsLayingDate) || day(v?.lordsLayingDate);

export function tidyInstrument(value) {
  const procedure = procedureOf(value?.procedure?.name);
  const laid = laidOn(value);
  const name = clean(value?.name);
  if (!value?.id || !name || !procedure || !laid) return null;
  return {
    id: value.id,
    name,
    procedure: clean(value.procedure.name),
    route: procedure.route,
    laid,
    made: day(value.paperMadeDate) || null,
    // "SI 2026/1154" once it has a number; a draft has none yet.
    ref: value.paperNumber && value.paperYear ? `SI ${value.paperYear}/${value.paperNumber}` : null,
  };
}

const monthOf = (iso) => iso.slice(0, 7);

// The twelve calendar months up to and including the month of `generated`, oldest first.
export function monthsBack(generated, count = 12) {
  const [y, m] = generated.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

// The Explanatory Note is the Government's own short account of what an instrument does, printed at the end of the instrument (legislation.gov.uk keeps it in the
// instrument's XML). The summary is its opening sentences, tidied: the note's own heading, citations such as "( S.I. 2012/632 )" and "(c. 38)", and the shorthand it
// defines in brackets are taken out so a sentence reads on its own. The sentences that only list what each regulation or article does are left behind.
const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#8217;": "\u2019", "&#8216;": "\u2018" };
const ABBREVIATIONS = /\b(No|Nos|St|Mr|Mrs|Ms|Dr|Ltd|plc|c|s|ss|Art|reg|para|Sch|Pt|etc)\./g;
const LISTING = /^(Part|Parts|Regulation|Regulations|Article|Articles|Rule|Rules|Section|Sections|Schedule|Schedules|Paragraph|Paragraphs|Chapter|Annex)\s+\d|^(A|An) (full |de minimis )?impact assessment|^A copy of|^(This|These) (Regulations|Order|Rules|Instrument)(?: ?\(.*?\))? come[s]? into force/i;
const MAX_CHARS = 460;
const MAX_SENTENCES = 3;

export function tidyNote(text) {
  return String(text ?? "")
    .replace(/\(\s*This note is not (?:a )?part of [^)]*\)/gi, " ")
    .replace(/^\s*Explanatory Notes?\s*/i, "")
    .replace(/\(\s*S\.?S?\.?R?\.?I\.?\s*[\dX/]+\s*\)/g, "")
    .replace(/\(\s*c\.\s*[\d\w]+\s*\)/g, "")
    .replace(/\(\s*(?:EUR|OJ)\b[^)]*\)/g, "")
    .replace(/\(\s*\u201C[^\u201D]{1,70}\u201D\s*\)/g, "")
    .replace(/\u201C\s+/g, "\u201C").replace(/\s+\u201D/g, "\u201D")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// The opening sentences of an Explanatory Note, as an array, or null when the note has nothing usable.
export function summariseNote(xml) {
  const m = String(xml ?? "").match(/<ExplanatoryNotes[\s\S]*?<\/ExplanatoryNotes>/i);
  if (!m) return null;
  let raw = m[0].replace(/<[^>]+>/g, " ");
  raw = raw.replace(/&(?:amp|lt|gt|quot|apos|#8217|#8216);/g, (e) => ENTITIES[e]);
  const text = tidyNote(raw).replace(ABBREVIATIONS, (x) => x.replace(".", "\u0001"));
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z\u201C])/).map((x) => x.replace(/\u0001/g, ".").trim()).filter(Boolean);
  const out = [];
  let chars = 0;
  for (const sentence of sentences) {
    if (out.length > 0 && LISTING.test(sentence)) break;
    if (out.length > 0 && (out.length >= MAX_SENTENCES || chars + sentence.length > MAX_CHARS)) break;
    out.push(sentence);
    chars += sentence.length;
  }
  const result = out.join(" ").length >= 40 ? out : [];
  return result.length ? result : null;
}

// A short plain-words label for what kind of change an instrument is, taken from its title, or null when the title does not say.
export function kindOf(name) {
  const t = clean(name);
  if (/Commencement/i.test(t)) return "Brings part of an Act into force";
  if (/Electoral Changes/i.test(t)) return "Redraws a council\u2019s wards";
  if (/\bFees?\b/.test(t) && !/Amendment/i.test(t)) return "Sets fees";
  if (/\(EU Exit\)/i.test(t)) return "Part of the post-Brexit tidy-up of the law";
  if (/Amendment|Amendments/i.test(t)) return "Changes existing rules";
  return null;
}

// `items` are the API's list entries ({ value }); `details` maps an instrument id to the fuller record ({ value }) for the most recent ones; `notes` maps an id to the
// sentences summariseNote took from its Explanatory Note.
export function summariseInstruments(items, details, { from, generated, recent = 60, notes = {} }) {
  const seen = new Set();
  const list = [];
  for (const entry of items) {
    const t = tidyInstrument(entry?.value);
    if (!t || seen.has(t.id) || t.laid < from || t.laid > generated) continue;
    seen.add(t.id);
    list.push(t);
  }
  list.sort((a, b) => b.laid.localeCompare(a.laid) || b.name.localeCompare(a.name));

  const procedures = Object.fromEntries(Object.keys(PROCEDURES).map((p) => [p, list.filter((t) => t.procedure === p).length]));
  const months = monthsBack(generated).map((month) => ({
    month,
    approve: list.filter((t) => monthOf(t.laid) === month && t.route === "approve").length,
    object: list.filter((t) => monthOf(t.laid) === month && t.route === "object").length,
  }));

  const latest = list.slice(0, recent).map((t) => {
    const v = details?.[t.id]?.value;
    const link = /^https:\/\/www\.legislation\.gov\.uk\//.test(v?.link ?? "") ? v.link : null;
    return {
      ...t,
      kind: kindOf(t.name),
      summary: notes?.[t.id] ?? null,
      department: clean(v?.layingBody?.name) || null,
      inForce: day(v?.paperComingIntoForceDate) || null,
      link,
    };
  });

  // The plain-words account of each kind travels with the data, so the page needs nothing else.
  const kinds = Object.fromEntries(Object.entries(PROCEDURES).map(([name, p]) => [name, { route: p.route, label: p.label, say: p.say }]));

  return { from, generated, total: list.length, procedures, kinds, months, recent: latest };
}
