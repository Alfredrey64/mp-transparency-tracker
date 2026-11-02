// Small helpers for the News regulation page's pictures.

// "BBC", "ITV" and "GB" as they are, and the first letters of longer names ("C4", "SN").
export const monogram = (name) => { const words = name.trim().split(/\s+/); return /^[A-Z0-9]{1,3}$/.test(words[0]) ? words[0] : words.map((w) => w[0]).join("").slice(0, 3).toUpperCase(); };

// "July 2023 (ruled December 2023)" as the month the programme went out and the month Ofcom ruled, counted in months, or null when the words are not in that shape.
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export function caseSpan(text) {
  const m = /^([A-Za-z]+)(?: and [A-Za-z]+)? (\d{4}) \(ruled ([A-Za-z]+) (\d{4})\)$/.exec(String(text).trim());
  if (!m) return null;
  const from = MONTHS.indexOf(m[1].toLowerCase());
  const to = MONTHS.indexOf(m[3].toLowerCase());
  if (from < 0 || to < 0) return null;
  const start = Number(m[2]) * 12 + from;
  const end = Number(m[4]) * 12 + to;
  return end >= start ? { start, end, months: end - start } : null;
}
