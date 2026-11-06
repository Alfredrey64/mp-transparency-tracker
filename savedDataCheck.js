// savedDataCheck.js
//
// What a rebuilt data file has to look like before the daily refresh is allowed to commit it. The fetch scripts write straight over the files the site reads, and a source that
// is down, changed or answering with an empty list can make a script write a file that is valid and yet nearly empty. With nothing to stop it, that file would be committed
// and deployed, and a page that showed a hundred rows yesterday would show none today. judge() compares a rebuilt file with the committed one and says whether to keep it.
//
// It has no dependencies, so it can be tested without a repository.

// How much a file is allowed to shrink: below this share of the old file's size, it is taken to be broken, not a real change.
export const MIN_SHARE = 0.4;
// Files smaller than this are too small for a size comparison to mean anything.
const MIN_BYTES = 2000;

// The number of values in a JSON document, counted all the way down. Unlike the length of the text, it does not move when the order of keys or the spacing changes.
export function weigh(value) {
  if (Array.isArray(value)) return 1 + value.reduce((n, v) => n + weigh(v), 0);
  if (value && typeof value === "object") return 1 + Object.values(value).reduce((n, v) => n + weigh(v), 0);
  return 1;
}

// { ok: true } to keep the rebuilt file, or { ok: false, reason } to put the committed one back (oldText is null for a file that is new).
export function judge(oldText, newText) {
  let next;
  try {
    next = JSON.parse(newText);
  } catch (e) {
    return { ok: false, reason: `it is not valid JSON (${e.message.slice(0, 80)})` };
  }
  if (oldText == null) return { ok: true };
  let prev;
  try {
    prev = JSON.parse(oldText);
  } catch {
    return { ok: true };
  }
  const emptied = (v) => (Array.isArray(v) ? v.length === 0 : v && typeof v === "object" ? Object.keys(v).length === 0 : v == null);
  if (emptied(next) && !emptied(prev)) return { ok: false, reason: "it is empty and the committed file is not" };
  if (oldText.length >= MIN_BYTES) {
    const before = weigh(prev);
    const after = weigh(next);
    if (after < before * MIN_SHARE) return { ok: false, reason: `it holds ${after} values where the committed file holds ${before}` };
  }
  return { ok: true };
}
