// The "one real instrument" picture on the Laws made by ministers page: picks a recent instrument that was already law when it was laid (a made negative one) and has all
// three dates, and works out the days between them and how they sit against the 40 days in which a House may object.

const DAY = 86400000;
const WINDOW = 40;
const dayNo = (iso) => Math.round(Date.parse(`${iso}T12:00:00Z`) / DAY);

// "2026-11-05" -> "5 Nov".
export const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// The gap between two day numbers, in words that follow "it was".
export function dayGap(from, to) {
  const n = to - from;
  if (n <= 0) return "The same day as the one before";
  return `${n === 1 ? "1 day" : `${n} days`} after the one before`;
}

export function caseStudy(data) {
  const r = data.recent.find((x) => x.procedure === "Made negative" && x.made && x.laid && x.inForce && x.made <= x.laid && x.laid <= x.inForce);
  if (!r) return null;
  const start = dayNo(r.made);
  const rel = (iso) => dayNo(iso) - start;
  const forceWord = r.inForce > data.generated ? "Comes into force" : "Came into force";
  const steps = [
    { key: "made", label: "Made", date: r.made, day: 0, colour: "#7B5BD6" },
    { key: "laid", label: "Laid before Parliament", date: r.laid, day: rel(r.laid), colour: "#2C7DA0" },
    { key: "force", label: forceWord, date: r.inForce, day: rel(r.inForce), colour: "#3F7D5C" },
  ];
  const windowFrom = steps[1].day;
  const windowTo = windowFrom + WINDOW;
  const gap = steps[2].day - steps[1].day;
  const tense = r.inForce > data.generated ? "comes" : "came";
  const inside = steps[2].day <= windowTo;
  return {
    name: r.name,
    department: r.department,
    link: r.link,
    steps,
    windowFrom,
    windowTo,
    span: Math.max(windowTo, steps[2].day, 1),
    say: `It was already law when Parliament saw it. It ${tense} into force ${gap === 0 ? "the day it was laid" : gap === 1 ? "a day after it was laid" : `${gap} days after it was laid`}${inside ? ", while a House could still object to it." : "."}`,
    alt: `${r.name}: made ${r.made}, laid before Parliament ${r.laid}, ${forceWord.toLowerCase()} ${r.inForce}. A House can object for 40 days after it is laid.`,
  };
}
