// repPortraits.js — the small rules fetch-rep-portraits.js uses, kept apart so they can be tested without a network.

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The Wikipedia article a name links to in the list the name came from: "[[Target|Name]]", "[[Name]]", or a mayor's "{{sortname|First|Last|Target}}". Falls back to the name itself.
export function wikiTitleFor(wikitext, name) {
  const n = esc(name);
  const piped = new RegExp(`\\[\\[([^\\]|#]+)\\|${n}\\]\\]`).exec(wikitext);
  if (piped) return piped[1].trim();
  if (new RegExp(`\\[\\[${n}\\]\\]`).test(wikitext)) return name;
  for (const m of wikitext.matchAll(/\{\{\s*sortname\s*\|\s*([^|}]+?)\s*\|\s*([^|}]+?)\s*(?:\|\s*([^|}]*?)\s*)?(?:\|[^}]*)?\}\}/gi)) {
    if (`${m[1]} ${m[2]}`.replace(/\s+/g, " ") === name) return m[3] && !/^(dab|nolink|\d)/i.test(m[3]) ? m[3] : name;
  }
  return name;
}

// Wikimedia Commons' licence name if it is one we may show (Creative Commons, public domain, the Open Government Licence), otherwise null.
export function freeLicence(meta) {
  if (!meta || String(meta.NonFree?.value ?? "").toLowerCase() === "true") return null;
  const name = String(meta.LicenseShortName?.value ?? "").trim();
  return /^(CC[ -]BY|CC0|Public domain|PD[ -]|OGL|Open Government|Open Parliament)/i.test(name) ? name : null;
}

const text = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// Who took the photo, as plain text of a sensible length.
export function creditFrom(meta) {
  const who = text(meta?.Artist?.value).replace(/^(Photograph|Photo|Image)(graph)? by\s+/i, "");
  return !who ? "Wikimedia Commons contributor" : who.length > 70 ? `${who.slice(0, 67).trim()}...` : who;
}
