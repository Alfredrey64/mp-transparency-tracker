// How much the class is shown. "Younger" gives the first sentence of each caption and leaves out the "Did you know?" boxes; "Older" adds a line to
// go further on the last step of a slide. The choice is kept in this browser, for the teacher's own convenience, and is never sent anywhere.
export const LEVELS = [
  { key: "younger", label: "Younger", hint: "Shorter: the first sentence of each caption, and no extra facts. Ages 7 to 9." },
  { key: "standard", label: "Standard", hint: "The lesson as written. Ages 9 to 12." },
  { key: "older", label: "Older", hint: "Adds a line on each slide to go further. Ages 12 to 14." },
];
const KEY = "sp.teacherLevel";

export const readLevel = () => {
  try { const v = localStorage.getItem(KEY); return LEVELS.some((l) => l.key === v) ? v : "standard"; } catch { return "standard"; }
};
export const writeLevel = (v) => { try { localStorage.setItem(KEY, v); } catch { /* storage blocked: the choice lasts until the page closes */ } };

const SHORT = /\b(e\.g|i\.e|No|Mr|Mrs|Dr|St)\.$/;

// The first sentence of some text: up to the first full stop, question mark or exclamation mark followed by a space or the end. A full stop that
// belongs to a number ("2.5") or a short form ("No. 10") does not end it.
export function firstSentence(text) {
  const s = String(text ?? "").trim();
  let from = 0;
  for (;;) {
    const m = /[.!?](?=\s|$)/.exec(s.slice(from));
    if (!m) return s;
    const end = from + m.index + 1;
    const head = s.slice(0, end);
    const rest = s.slice(end).trimStart();
    if (SHORT.test(head) && rest) { from = end; continue; }
    return head;
  }
}

export function shape(step, level, further) {
  if (level === "younger") return { ...step, text: step.text ? firstSentence(step.text) : step.text, fact: undefined };
  if (level === "older" && further) return { ...step, further };
  return step;
}
