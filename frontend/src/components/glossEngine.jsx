/** @jsxImportSource react */
import { GlossaryTerm } from "./GlossaryTerm";
import { findGlossaryEntry, keysFor, normaliseKey, PROCEDURE_TERMS, POLITICS_TERMS, STATISTICS_TERMS } from "../data/glossaryTerms";

// The glossary half of the automatic underlining, loaded on demand by
// glossJsx/glossText.js. The pragma above opts this file out of the custom
// JSX runtime, so nothing rendered from here (the popovers' own definition
// text, in particular) is ever itself scanned for glossary terms.
//
// Everyday words ("bill", "speaker", "division") are flagged auto:false in
// the data and never match here. All-caps acronyms (IPSA, OBR) only match
// in capitals, so "pac" or "nao" inside other text can't trigger them.

let matcher = null;
function getMatcher() {
  if (matcher) return matcher;
  const keys = [];
  for (const entry of [...PROCEDURE_TERMS, ...POLITICS_TERMS, ...STATISTICS_TERMS]) {
    if (entry.auto === false) continue;
    for (const key of keysFor(entry)) if (key.length >= 3) keys.push(key);
  }
  keys.sort((a, b) => b.length - a.length);
  const source = keys
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/['’]/g, "['’]").replace(/\s+/g, "\\s+"))
    .join("|");
  matcher = new RegExp(`(?<![\\w-])(${source})(?:s|es)?(?![\\w-])`, "gi");
  return matcher;
}

const ACRONYM = /^[A-Z0-9]{2,6}$/;

const cache = new Map();

// Every mention of every term in a piece of text, as a mix of plain strings
// and GlossaryTerm elements — or the original string, untouched, if there's
// nothing to underline. Cached per string: the same text is rendered many
// times over a session (every re-render, every revisit of a page).
export function renderGlossed(text) {
  if (cache.has(text)) return cache.get(text);
  const re = getMatcher();
  re.lastIndex = 0;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    const entry = findGlossaryEntry(m[1]);
    if (!entry) continue;
    const defined = keysFor(entry).find((k) => normaliseKey(k) === normaliseKey(m[1]));
    if (defined && ACRONYM.test(defined) && m[1] !== defined) continue;
    parts.push(text.slice(last, m.index), <GlossaryTerm key={m.index} term={entry.term}>{m[0]}</GlossaryTerm>);
    last = m.index + m[0].length;
  }
  let result = text;
  if (parts.length) {
    parts.push(text.slice(last));
    result = parts;
  }
  cache.set(text, result);
  return result;
}

// Every glossary entry mentioned in a piece of text — used only to audit
// which rendered text is still missing an underline.
export function findMentions(text) {
  const re = getMatcher();
  re.lastIndex = 0;
  const found = [];
  let m;
  while ((m = re.exec(text))) {
    const entry = findGlossaryEntry(m[1]);
    if (entry) found.push(entry.term);
  }
  return found;
}
