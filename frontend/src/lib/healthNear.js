import { miles } from "./nearYou";

// What to say about the health services near a postcode: the Care Quality Commission's rating for each GP surgery, care home, hospital and so on in the map tiles, and the
// waiting-time figures for the nearest hospital trust. Pure and tested.

export const TYPE_NAME = { GP: "GP surgery", CH: "Care home", HO: "Hospital", MH: "Mental health service", HS: "Hospice", CO: "Community health service", UC: "Urgent care or out-of-hours" };

// The kinds a visitor can pick between, and the type codes each covers.
export const GROUPS = [
  { key: "GP", label: "GP surgeries", types: ["GP"] },
  { key: "HO", label: "Hospitals", types: ["HO"] },
  { key: "CH", label: "Care homes", types: ["CH"] },
  { key: "other", label: "Other services", types: ["MH", "HS", "CO", "UC"] },
];

export const RATING_NAME = { O: "Outstanding", G: "Good", R: "Requires improvement", I: "Inadequate" };
export const RATING_TONE = { O: "#1B5E8C", G: "#2F8F6B", R: "#C88A1E", I: "#B3262E" };
export const RATING_TEXT = {
  O: "The service is performing exceptionally well.",
  G: "The service is performing well and meeting the CQC's expectations.",
  R: "The service is not performing as well as it should, and the CQC has told it how to improve.",
  I: "The service is performing badly, and the CQC has taken action to protect people.",
};

// The CQC's five key questions, in the order a record stores them.
export const QUESTIONS = [
  { name: "Safe", text: "Are people protected from abuse and avoidable harm?" },
  { name: "Effective", text: "Does care, treatment and support achieve good outcomes, based on the best evidence?" },
  { name: "Caring", text: "Do staff treat people with compassion, kindness, dignity and respect?" },
  { name: "Responsive", text: "Are services organised to meet people's needs?" },
  { name: "Well-led", text: "Do leadership, management and governance deliver high-quality, person-centred care?" },
];

// The places within `radius` miles of a point, nearest first. Each gets a `miles` figure.
export function placesWithin(records, point, radius, types) {
  return (records ?? [])
    .filter((r) => !types || types.includes(r.t))
    .map((r) => ({ ...r, miles: miles(point, { lat: r.la, lon: r.lo }) }))
    .filter((r) => r.miles <= radius)
    .sort((a, b) => a.miles - b.miles);
}

// A place's own figures ready to show: the overall rating, the five questions, and how old the report is.
export function placeView(r, now = new Date()) {
  const [y, m] = String(r.d ?? "").split("-").map(Number);
  const months = y && m ? (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m) : null;
  return {
    type: TYPE_NAME[r.t] ?? "Health service",
    overall: { letter: r.o, name: RATING_NAME[r.o], tone: RATING_TONE[r.o] },
    questions: QUESTIONS.map((q, n) => { const l = r.q?.[n]; return { question: q.name, text: q.text, letter: l, rating: RATING_NAME[l] ?? "Not rated", tone: RATING_TONE[l] ?? "#8DA2C0" }; }),
    months,
    old: months != null && months >= 36,
    age: months == null ? "" : months < 1 ? "this month" : months < 24 ? `${months} month${months === 1 ? "" : "s"} ago` : `${Math.floor(months / 12)} years ago`,
    url: `https://www.cqc.org.uk/location/${r.i}`,
  };
}

// How the ratings split among a set of places: counts for each of the four ratings.
export function ratingCounts(places) {
  const out = { O: 0, G: 0, R: 0, I: 0 };
  for (const p of places) if (out[p.o] != null) out[p.o]++;
  return out;
}

// A trust's waiting list figures set against England's, in words a reader can use. `rtt` is one trust's entry from rttWaits.json; `nat` its national block.
export function waitView(rtt, nat) {
  if (!rtt) return null;
  return {
    waiting: rtt.total,
    pct18: rtt.pct18,
    natPct18: nat?.pct18 ?? null,
    median: rtt.median,
    p92: rtt.p92,
    w52: rtt.w52,
    w65: rtt.w65,
    tone: rtt.pct18 >= 92 ? "#2F8F6B" : nat?.pct18 != null && rtt.pct18 >= nat.pct18 ? "#2C7DA0" : "#B3262E",
  };
}
