// A check for wording a person outside politics and law could not follow, used so that anything shown as "plain English" really is, and so that official wording (a legal explanatory note,
// a drafting-style title) is never put in front of a reader as the only explanation. It looks for the tell-tale signs of statute-speak: section and schedule numbers, "inserted by", "makes
// provision", unexplained capital-letter abbreviations, long sentences. It is deliberately strict: when in doubt the page shows the everyday summary built from the title instead.

const TELLS = [
  /\b(?:sections?|ss?\.|schedules?|paragraphs?|sub-?paragraphs?|articles?|regulations?|rules?|parts?|chapters?|subsections?)\s+\d{1,3}(?!\d)[A-Za-z]?(?:\(\w+\))*/i, // "section 58", "Part 1A" (not "Regulations 2012", which is the name of a law)
  /\b(?:part|schedule)\s+\d+[A-Z]\b/i,
  /\bmakes?\s+(?:further\s+|new\s+|consequential\s+|transitional\s+|supplementary\s+|incidental\s+)?provisions?\b/i,
  /\bin respect of\b|\bpursuant to\b|\bhereby\b|\binter alia\b|\bnotwithstanding\b|\bhereinafter\b|\bthereof\b|\bthereto\b|\bwherein\b/i,
  /\b(?:inserted|substituted|omitted|amended|repealed|prescribed|enacted|made) by\b/i,
  /\bwith effect from\b|\bcome(?:s)? into force in accordance\b|\bconsequential amendments?\b|\btransitional (?:and|or) saving\b/i,
  /\bSI\s+\d{4}\/\d+|\bS\.I\.\b/i,
  /\bsecondary legislation\b|\bsubordinate legislation\b|\bstatutory instrument\b|\border in council\b|\bvires\b/i,
  /\b(?:the\s+)?(?:said|aforesaid)\b/i,
];

// Capital-letter abbreviations of three or more letters, apart from the ones everyone knows.
const KNOWN_ACRONYMS = new Set(["UK", "NHS", "MP", "MPS", "EU", "GOV", "BBC", "VAT", "PM", "DNA", "CCTV", "GP", "USA", "UN", "US", "AI", "TV", "ID", "PIN", "MOT", "HMRC", "DVLA", "NATO"]);

// Words that are fine but hard: not a failure on their own, only counted.
const HARD = /\b(?:legislat\w+|jurisdiction|statutory|enactment|designat\w+|prescrib\w+|commence\w*|remuneration|offenc\w+|authoris\w+|apportion\w+|thereby|accordingly|require[ds]? by)\b/gi;

const words = (t) => String(t).split(/\s+/).filter(Boolean);
const sentences = (t) => String(t).split(/(?<=[.!?])\s+/).filter(Boolean);

// Returns the reasons a text is not plain enough ([] means it reads as everyday English). Pure.
export function layProblems(text, { maxSentence = 40, maxHard = 2 } = {}) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return ["empty"];
  const out = [];
  for (const re of TELLS) { const m = t.match(re); if (m) out.push(`legal wording: "${m[0].trim()}"`); }
  // A name such as HIV or AUKUS is fine; a text that leans on several abbreviations is not.
  const acr = [...new Set((t.match(/\b[A-Z]{3,6}\b/g) ?? []).filter((a) => !KNOWN_ACRONYMS.has(a)))];
  if (acr.length > 2) out.push(`abbreviations: ${acr.slice(0, 4).join(", ")}`);
  const longest = Math.max(...sentences(t).map((s) => words(s).length));
  if (longest > maxSentence) out.push(`a sentence of ${longest} words`);
  const hard = t.match(HARD) ?? [];
  if (hard.length > maxHard) out.push(`hard words: ${[...new Set(hard.map((h) => h.toLowerCase()))].slice(0, 4).join(", ")}`);
  return out;
}

export const isLay = (text, opts) => layProblems(text, opts).length === 0;
