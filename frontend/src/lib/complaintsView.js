// The sums behind the council complaints page, over data/councilComplaints.json (the Local Government and Social Care Ombudsman's figures for each council). Pure and tested.

const pct = (v) => (v === null || v === undefined ? null : `${Math.round(v)}%`);
const num = (v) => (v === null || v === undefined ? null : Number(v).toLocaleString("en-GB"));

// How many complaints the Ombudsman investigated in full: the ones it upheld or did not uphold. The rest were closed earlier (not for the Ombudsman, sent back to the council, or ended after first enquiries).
export const investigated = (c) => (c?.upheld ?? 0) + (c?.notUpheld ?? 0);

// What happened to the complaints it decided, in order, for a stacked bar.
export const OUTCOMES = [
  { key: "invalid", label: "Not valid or incomplete", seg: "#C4CDDA" },
  { key: "advice", label: "Given advice", seg: "#A9B6CC" },
  { key: "referredBack", label: "Sent back to the council to try again", seg: "#8DA2C0" },
  { key: "closedEarly", label: "Closed after first enquiries", seg: "#6F88AE" },
  { key: "notUpheld", label: "Investigated, not upheld", seg: "#2C7DA0" },
  { key: "upheld", label: "Investigated and upheld", seg: "#B3262E" },
];

// The figures to show for one council, each with the figure for similar councils beside it where the Ombudsman gives one.
export function figuresFor(c) {
  if (!c) return [];
  const inv = investigated(c);
  const rows = [
    { label: "Complaints and enquiries decided", value: num(c.decided), note: `${num(inv)} were investigated in full.` },
    { label: "Upheld, of those investigated", value: c.upholdRate === null ? "None investigated" : pct(c.upholdRate), note: c.similarUpholdRate === null ? "" : `Similar councils: ${pct(c.similarUpholdRate)}.` },
  ];
  if (c.upheldPer100k !== null) rows.push({ label: "Upheld per 100,000 residents", value: String(c.upheldPer100k), note: c.similarPer100k === null ? "" : `Similar councils: ${c.similarPer100k}.` });
  rows.push({ label: "Put right before the Ombudsman had to step in", value: c.remedyBefore === null ? "None upheld" : pct(c.remedyBefore), note: c.similarRemedyBefore === null ? "" : `Similar councils: ${pct(c.similarRemedyBefore)}. Of the complaints that were upheld, how many the council had already put right.` });
  rows.push({ label: "Recommendations carried out on time", value: c.timely === null ? "None recorded" : pct(c.timely), note: c.similarTimely === null ? "" : `Similar councils: ${pct(c.similarTimely)}. ${num(c.onTime)} of ${num(c.outcomes)} outcomes.` });
  return rows;
}

// Councils with the most upheld complaints for their size. Only councils the Ombudsman gives a rate per 100,000 residents for are counted.
export function mostUpheld(data, count = 10) {
  return Object.entries(data.councils)
    .filter(([, c]) => c.upheldPer100k !== null && c.upheld >= 3)
    .map(([id, c]) => ({ id, name: c.name, value: c.upheldPer100k, similar: c.similarPer100k, upheld: c.upheld }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, count);
}

// Councils slowest to carry out what the Ombudsman recommended, among those with at least five outcomes recorded, so a single late case does not decide a council's place.
export function slowestToComply(data, count = 10) {
  return Object.entries(data.councils)
    .filter(([, c]) => c.timely !== null && c.outcomes >= 5)
    .map(([id, c]) => ({ id, name: c.name, value: c.timely, similar: c.similarTimely, outcomes: c.outcomes }))
    .sort((a, b) => a.value - b.value || b.outcomes - a.outcomes).slice(0, count);
}

// Councils for a pick list, A to Z.
export const councilOptions = (data) => Object.entries(data.councils).map(([id, c]) => ({ id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));

// A word for how a council's uphold rate sits against similar councils, or "" when there is nothing to compare.
export function against(c) {
  if (!c || c.upholdRate === null || c.similarUpholdRate === null || investigated(c) < 5) return "";
  const d = c.upholdRate - c.similarUpholdRate;
  return Math.abs(d) < 5 ? "close to" : d > 0 ? "above" : "below";
}
