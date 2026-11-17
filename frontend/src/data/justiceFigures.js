// The figures on the Courts, police and prisons page and the Crime outcomes picture, typed in from the official releases named in `source` below.
// They live here, not inside the components, so the weekly content check (scripts/hand-kept.mjs, rows "justice-statistics", "prison-projection" and "crime-outcomes") can say when
// a newer edition is due. Change a number here and every place that shows it follows; update the matching `asAt` wording too.

const n = (x) => x.toLocaleString("en-GB");

export const JUSTICE = {
  // Criminal court statistics quarterly (Ministry of Justice), open cases at the end of the quarter. Published late March, June, September and December.
  courts: { asAt: "end of June 2026", beforeAsAt: "End of June 2025", crownBefore: 78226, crown: 80829, crownLong: 23706, magsBefore: 347365, mags: 380230, source: "Criminal court statistics quarterly, April to June 2026 (published 24 September 2026)" },
  // Offender management statistics quarterly (Ministry of Justice). Published late January, April, July and October.
  prisons: { asAt: "30 June 2026", population: 85858, change: "2% fewer than a year earlier", firstReceptions: 17945, receptionsChange: "A 5% fall on the same period in 2025.", source: "Offender management statistics quarterly, January to March 2026" },
  // Police workforce, England and Wales (Home Office). Published twice a year, in January (for September) and July (for March).
  police: { asAt: "31 March 2026", officers: 145886, peak: 147745, neighbourhoodBefore: 17175, neighbourhood: 20989, workforce: 234441, source: "Police workforce, England and Wales: 31 March 2026" },
};

// Prison population projections (Ministry of Justice), published each December. Central projection for each September, and the places there are.
export const PRISON_PROJECTION = {
  published: "4 December 2025",
  next: "December 2026",
  series: [
    { label: "Sep 2025", sub: "counted", v: 87465, actual: true },
    { label: "Sep 2026", sub: "projected", v: 91400 },
    { label: "Sep 2027", sub: "projected", v: 94700 },
    { label: "Sep 2028", sub: "projected", v: 97400 },
    { label: "Sep 2029", sub: "projected", v: 99600 },
  ],
  capacity: 89334, capacityDate: "24 November 2025", top: 105000,
  march2030: { central: 100600, low: 98000, high: 103600 }, populationThen: { value: 87332, date: "24 November 2025" },
};

// Crime outcomes in England and Wales (Home Office), year to March 2026, published 23 July 2026; victim-based offences. Published each July.
export const CRIME_OUTCOMES = {
  year: "year to March 2026", published: "23 July 2026", recordedMillions: 4.4, recordedChange: "2% fewer than the year before",
  groups: [
    { key: "charged", pct: 7.3, label: "Charged or summonsed", note: "Sent forward to be prosecuted." },
    { key: "evidence", pct: 39.0, label: "Evidential difficulties", note: "Closed because the evidence was not enough to take it further." },
    { key: "nosuspect", pct: 40.9, label: "No suspect identified", note: "The investigation finished without finding who did it." },
    { key: "open", pct: 6.9, label: "Still being investigated", note: "Still open at the end of March 2026." },
  ],
  chips: [
    ["Robbery", "10.5%", "charged, up from 7.5%"],
    ["Theft", "9.1%", "charged, up from 7.3%"],
    ["Knife-enabled offences", "13.0%", "charged, up from 11.5%"],
    ["Firearm offences", "12.9%", "charged, up from 12.0%"],
    ["Rape", "3.4%", "charged so far; this rises as cases finish"],
    ["Time to a charge", "40 days", "the middle case, down from 41"],
  ],
};

export const fmtN = n;
export const pctChange = (a, b) => Math.round(((b - a) / a) * 100);
