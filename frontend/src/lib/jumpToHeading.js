// A search result can point at a section inside a page. The page is opened first, then this finds the section by its heading and scrolls to it.
// `want` is held for a few seconds, because a page's headings can take a moment to appear (it may be fetching its figures).
let want = null;

export function wantHeading(text) { want = { text: String(text).trim().toLowerCase(), until: Date.now() + 9000 }; }

// Called by PageTools each time it has listed a page's headings. Returns the heading element to scroll to, once, or null.
export function takeHeading(headings) {
  if (!want) return null;
  if (Date.now() > want.until) { want = null; return null; }
  const hit = headings.find((h) => h.text.trim().toLowerCase() === want.text);
  if (!hit) return null;
  want = null;
  return document.getElementById(hit.id);
}
