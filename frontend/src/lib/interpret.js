// Turns a number into a sentence a lay reader can use: where it sits among
// everyone else ("higher than most MPs") or against a yardstick ("about the
// same as the UK average"). Descriptive only: a high or low marker says where
// a figure sits, never whether it is good or bad. Pure and tested.

// Where a value falls in a sorted list, 0 to 100: the share of values below it
// plus half the share equal to it, so a run of identical values (all the MPs
// with nothing declared) sits in the middle of its run.
export function percentileOf(sorted, value) {
  const n = sorted.length;
  if (!n || !Number.isFinite(value)) return null;
  let below = 0;
  let equal = 0;
  for (const v of sorted) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  return ((below + equal / 2) / n) * 100;
}

const share = (sorted, test) => (sorted.length ? Math.round((sorted.filter(test).length / sorted.length) * 100) : 0);

export const BANDS = [
  { min: 90, key: "veryHigh", label: "Unusually high", tone: "high" },
  { min: 75, key: "high", label: "Higher than most", tone: "high" },
  { min: 25, key: "typical", label: "About typical", tone: "mid" },
  { min: 10, key: "low", label: "Lower than most", tone: "low" },
  { min: 0, key: "veryLow", label: "Unusually low", tone: "low" },
];

export const bandFor = (percentile) => BANDS.find((b) => percentile >= b.min) ?? BANDS[BANDS.length - 1];

const median = (sorted) => {
  if (!sorted.length) return null;
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

// Where one MP's figure sits among all MPs', in plain sentences about that MP.
//   sorted    the distribution of every MP's figure
//   format    how to write a figure ("£1,500", "12%")
//   noun      what is being counted ("MPs"), plural
//   lead      says what the figure is, about this MP: (v) => `This MP has declared ${v}`
//   typical   says it for the typical MP:             (v) => `The typical MP has declared ${v}`
//   zero      what half of MPs have done when the middle MP is at zero ("have declared nothing")
//   zeroSelf  the same, said of this MP when they are at zero ("This MP has declared nothing")
export function describeAmongMps({
  value, sorted, format, noun = "MPs", zero = "are at zero",
  lead = (v) => `This MP's figure is ${v}`,
  typical = (v) => `The typical MP is at ${v}`,
  zeroSelf = lead(format(0)),
}) {
  const p = percentileOf(sorted, value);
  if (p == null) return null;
  const band = bandFor(p);
  const lower = share(sorted, (v) => v < value);
  const higher = share(sorted, (v) => v > value);
  const mid = median(sorted);
  const parts = [];
  if (value === 0 && mid === 0) {
    parts.push(`${zeroSelf}, like about half of ${noun}.`);
  } else {
    const me = lead(format(value));
    if (band.tone === "high") parts.push(`${me}, which is higher than ${lower}% of ${noun}.`);
    else if (band.tone === "low") parts.push(`${me}, which is lower than ${higher}% of ${noun}.`);
    else parts.push(`${me}, which is typical: about as many ${noun} are above this as below it.`);
    if (mid === 0) parts.push(`Half of ${noun} ${zero}.`);
    else if (mid != null) parts.push(`${typical(format(mid))}.`);
  }
  return { marker: band.label, tone: band.tone, text: parts.join(" "), percentile: p };
}

const RATIO_BANDS = [
  { min: 1.5, label: "well above", marker: "Well above average", tone: "high" },
  { min: 1.15, label: "above", marker: "Above average", tone: "high" },
  { min: 1.05, label: "slightly above", marker: "Slightly above average", tone: "mid" },
  { min: 0.95, label: "about the same as", marker: "About average", tone: "mid" },
  { min: 0.87, label: "slightly below", marker: "Slightly below average", tone: "mid" },
  { min: 0.67, label: "below", marker: "Below average", tone: "low" },
  { min: 0, label: "well below", marker: "Well below average", tone: "low" },
];

// A figure against one yardstick (a UK average, a population share).
//   what       "the winner's lead"
//   yardstick  "the UK average"
export function describeAgainst({ value, reference, format, what, yardstick }) {
  if (!Number.isFinite(value) || !Number.isFinite(reference) || reference <= 0) return null;
  const ratio = value / reference;
  const band = RATIO_BANDS.find((b) => ratio >= b.min);
  return { marker: band.marker, tone: band.tone, text: `${what} of ${format(value)} is ${band.label} ${yardstick} (${format(reference)}).`, ratio };
}

// The spread of everyone's figures in one line, for a ranking with no single
// subject: "The middle MP is £1,500; one in ten is above £39,806."
export function describeSpread({ sorted, format, noun = "MP", zero = "have none" }) {
  if (!sorted.length) return null;
  const mid = median(sorted);
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  const first = mid === 0 ? `More than half of ${noun}s ${zero}` : `The middle ${noun} is at ${format(mid)}`;
  return `${first}; one in ten is above ${format(p90)}.`;
}
