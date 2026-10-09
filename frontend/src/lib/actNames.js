// Finds the names of Acts and Bills in a sentence ("the Great Reform Act 1832", "Representation of the People (Equal Franchise)
// Act 1928") so they can be set in bold. Returns pieces: { text, bold }.

const LEAD_WORDS = new Set(["passed", "repealed", "ratified", "introduced", "abolished", "the", "his", "her", "its", "their", "it", "a", "an", "and", "of", "to", "in", "on", "for"]);
// A capitalised word, a bracket, or a short joining word, in a run that ends in Act or Bill (and perhaps a year).
const RUN = /(?:[A-Z][\w'’-]*|\([^)]+\))(?:\s+(?:(?:of|the|and|for|to|in|on)\s+)*(?:[A-Z][\w'’-]*|\([^)]+\)))*\s+(?:Act|Bill)(?:\s+\d{4})?(?:\b|(?=[,.;:)]))/g;

export function splitActNames(text) {
  const out = [];
  let last = 0;
  for (const m of String(text ?? "").matchAll(RUN)) {
    let name = m[0];
    let start = m.index;
    // Drop leading words that are not part of the name ("Passed the Stamp Act" -> "Stamp Act").
    for (;;) {
      const first = name.split(/\s+/)[0];
      if (!LEAD_WORDS.has(first.toLowerCase()) || name.split(/\s+/).length <= 2) break;
      start += first.length + (name.slice(first.length).match(/^\s+/)?.[0].length ?? 0);
      name = name.slice(name.indexOf(first) + first.length).replace(/^\s+/, "");
    }
    // A bracket that opens before the name and closes after it is not part of it.
    while (name.startsWith("(") && (name.match(/\(/g) ?? []).length > (name.match(/\)/g) ?? []).length) { name = name.slice(1); start += 1; }
    const words = name.split(/\s+/);
    // "Act" or "the Act" on its own is not a name.
    if (words.length < 2 || (words.length === 2 && /^\d{4}$/.test(words[1]))) continue;
    if (start > last) out.push({ text: text.slice(last, start), bold: false });
    out.push({ text: name, bold: true });
    last = start + name.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out.length ? out : [{ text: String(text ?? ""), bold: false }];
}
