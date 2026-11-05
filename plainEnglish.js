// plainEnglish.js
//
// The parts of the plain-English rewriting step that need no network, so they can be tested: what text each record is rewritten from, the instruction given to the model, the
// checks a rewrite must pass before the site shows it, and the cache that stops the same text being sent twice. The step itself is write-plain-english.js.
//
// The model only ever sees the official wording Parliament or the Government published (the committee's description of an inquiry, the Explanatory Note of an instrument), and it is
// told to use nothing else. A rewrite that adds a figure the source does not contain, includes a link, or is the wrong length is thrown away and the page keeps the official wording.

import { createHash } from "crypto";

export const MODEL = "claude-haiku-5-5";
export const GEMINI_MODEL = "gemini-2.5-flash-lite";
export const NOT_ENOUGH = "NOT_ENOUGH";

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// What a report is rewritten from: the committee's description of the inquiry it came out of. A report with no description has nothing to rewrite, so it is left alone.
export function reportSource(r) {
  const about = clean((r.about ?? []).join(" "));
  if (!about) return null;
  return { key: `report:${r.id}`, kind: "report", title: clean(r.title), by: clean(r.committee), text: about };
}

// What an instrument is rewritten from: the sentences of its Explanatory Note already picked out for the page.
export function instrumentSource(r) {
  const text = clean((r.summary ?? []).join(" "));
  if (!text) return null;
  return { key: `si:${r.id}`, kind: "instrument", title: clean(r.name), by: clean(r.department), text };
}

export const hash = (source) => createHash("sha1").update(`${source.kind}|${source.title}|${source.by}|${source.text}`).digest("hex").slice(0, 16);

const RULES = [
  "Write in plain British English that a 12-year-old could follow. Use short, common words. Spell out or explain any jargon, abbreviation or legal term the first time it appears.",
  "Use only facts that are in the text you are given. Do not add background, causes, opinions, dates, figures or names that it does not contain, and do not guess what the result was.",
  "Keep every number, date and name exactly as given.",
  "Write one short paragraph of two or three sentences, no more than 70 words, with no heading, list, quotation marks or links.",
  `If the text does not say enough to explain it plainly, reply with exactly ${NOT_ENOUGH} and nothing else.`,
];

export const SYSTEM = {
  report: [
    "You rewrite a UK parliamentary select committee's own description of an inquiry so that anyone can understand what the report is about.",
    "Say what the committee looked into and why it matters, in the past tense. Do not say what the committee concluded or recommended, and do not say whether the government agreed: the text does not tell you.",
    ...RULES,
  ].join("\n"),
  instrument: [
    "You rewrite the Explanatory Note of a UK statutory instrument (a law made by a minister under powers Parliament gave them) so that anyone can understand what it does.",
    "Say what changes, who or what it affects and, if the text says, when. Describe the effect in everyday terms. Do not say whether it is good or bad.",
    ...RULES,
  ].join("\n"),
};

export function userMessage(source) {
  return [
    `${source.kind === "report" ? "Report" : "Instrument"}: ${source.title}`,
    source.by && `${source.kind === "report" ? "Committee" : "Laid by"}: ${source.by}`,
    "",
    "Official text:",
    source.text,
  ].filter((l) => l !== false && l !== undefined && l !== null).join("\n");
}

const numbersIn = (s) => String(s).match(/\d[\d,.]*/g)?.map((n) => n.replace(/[,.]+$/, "").replace(/,/g, "")) ?? [];

// Returns the tidied rewrite if it is fit to show, otherwise null.
export function checkRewrite(output, source) {
  const text = clean(output).replace(/^["“]+|["”]+$/g, "");
  if (!text || text.includes(NOT_ENOUGH)) return null;
  if (text.length < 40 || text.length > 520 || text.split(/\s+/).length > 85) return null;
  if (/https?:|www\.|@|\n|[#*_`]/.test(text)) return null;
  const known = new Set(numbersIn(`${source.title} ${source.by} ${source.text}`));
  if (numbersIn(text).some((n) => !known.has(n))) return null;
  if (/\b(as an ai|i cannot|i can't|i'm unable|here is|here's)\b/i.test(text)) return null;
  return text;
}

// The cache is { [key]: { h: hash of the source, t: the rewrite } }. A rewrite is reused while the source text it came from is unchanged.
export function fromCache(cache, source) {
  const hit = cache?.[source.key];
  return hit && hit.h === hash(source) ? hit.t : undefined;
}

export function toCache(cache, source, text) {
  return { ...cache, [source.key]: { h: hash(source), t: text } };
}
