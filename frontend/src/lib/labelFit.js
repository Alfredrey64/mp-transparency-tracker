// Decides how a name and a figure are written inside a box of a known size (the blocks of the budget map): which text size, whether the figure fits under the name, or
// whether the box is too small to carry any words at all. A word is never split across lines, and nothing is allowed to run outside the box.
//
// `measure(text, px, weight)` returns how wide the text is in pixels at that size, so this can be tested without a browser.

const SIZES = [14, 13, 12, 11, 10.5, 10];
const LINE = 1.2;

// Breaks the words into lines no wider than `width`. Null when a single word is wider than that.
export function wrapWords(text, px, width, measure, weight = 700) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (measure(word, px, weight) > width) return null;
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, px, weight) > width) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// The padding inside a box, smaller for smaller boxes.
export const padFor = (w, h) => Math.min(10, Math.max(4, Math.round(Math.min(w, h) * 0.09)));

// { mode: "full" (name and figure) | "name" | "none", size: px for the name, valueSize: px for the figure, pad }.
export function fitLabel({ name, value, w, h, measure, edge = 4 }) {
  const pad = padFor(w, h);
  const availW = (w - edge - 2 * pad) * 0.97;
  const availH = h - edge - 2 * pad;
  const none = { mode: "none", size: 0, valueSize: 0, pad };
  if (!(availW > 14 && availH > 10)) return none;
  for (const withValue of [true, false]) {
    if (withValue && !value) continue;
    for (const size of SIZES) {
      const lines = wrapWords(name, size, availW, measure);
      if (!lines) continue;
      const valueSize = Math.max(10, size - 1);
      if (withValue && measure(value, valueSize, 600) > availW) continue;
      const need = lines.length * size * LINE + (withValue ? 3 + valueSize * LINE : 0);
      if (need <= availH) return { mode: withValue ? "full" : "name", size, valueSize, pad };
    }
  }
  return none;
}
