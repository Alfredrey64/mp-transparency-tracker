// What the "Your area" page works out about one place beyond its MP and council: how the seat voted and has changed hands, where the neighbourhood
// sits on the deprivation index, what the council tax bill is, what the region's census says, and who does what locally. Every function is pure, so
// the figures can be tested; the files they read are loaded by the page and passed in.

import { seatSafety, majorityStanding, majorityBins, ordinal } from "./constituency";
import { electionList, changesOfParty } from "./seatElections";
import { normCouncil } from "./councils";
import { hexPosition } from "./seatMap";
import { seatKey } from "./constituency";

// How many neighbourhoods each nation's deprivation index ranks. The postcode lookup gives a neighbourhood's rank within its own nation, 1 being the most deprived.
export const IMD_TOTALS = { England: 32844, Wales: 1909, Scotland: 6976, "Northern Ireland": 890 };

export function neighbourhoodRank(result) {
  const of = IMD_TOTALS[result?.country];
  const rank = result?.index_of_multiple_deprivation;
  if (!of || !Number.isInteger(rank) || rank < 1 || rank > of) return null;
  const decile = Math.min(10, Math.ceil((rank / of) * 10));
  return { rank, of, decile, nation: result.country };
}

// "the most deprived tenth", "the third most deprived tenth", "the least deprived tenth".
export function tenthWords(decile) {
  if (decile === 1) return "the most deprived tenth";
  if (decile === 10) return "the least deprived tenth";
  return `the ${["", "", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"][decile]} most deprived tenth`;
}

// The seat's 2024 result and history, from the files saved with the site.
// `seats` is constituencies.json's list by seat key, `summary` is constituencySummary.json, `history` is constituencyHistory.json's bySeat, `elections` is electionHistory.json.
// When a seat's saved result was: "in 2024" for the general election, or "at the October 2026 by-election" for a seat that has voted again since.
export function electionWhen(result) {
  if (result?.isGeneralElection === false && /^\d{4}-\d{2}-\d{2}$/.test(result.date ?? "")) {
    const month = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${result.date}T00:00:00Z`));
    return { byElection: true, in: `at the ${month} by-election`, short: "the by-election", year: Number(result.date.slice(0, 4)) };
  }
  const year = Number(String(result?.date ?? "2024").slice(0, 4)) || 2024;
  return { byElection: false, in: `in ${year}`, short: String(year), year };
}

export function seatProfile({ key, seats, summary, history, elections }) {
  const record = seats?.[key];
  const result = record?.result;
  if (!record || !result?.candidates?.length) return null;
  const candidates = [...result.candidates].sort((a, b) => b.votes - a.votes);
  // The saved list holds the leading candidates only; whatever the rest won is the difference from the votes cast.
  const otherVotes = Math.max(0, (result.turnout ?? 0) - candidates.reduce((n, c) => n + c.votes, 0));
  const turnouts = Object.values(seats).map((s) => s.result?.turnoutPct).filter((v) => typeof v === "number");
  const turnout = typeof result.turnoutPct === "number"
    ? { pct: result.turnoutPct, average: summary?.turnout?.average ?? null, rank: turnouts.filter((v) => v > result.turnoutPct).length + 1, of: turnouts.length }
    : null;
  const list = electionList(elections?.bySeat?.[key], record);
  const former = [...(history?.[key] ?? [])].sort((a, b) => String(b.end ?? "").localeCompare(String(a.end ?? ""))).slice(0, 4);
  return {
    record, result, candidates, turnout, when: electionWhen(result),
    others: otherVotes > 0 && result.turnout ? { votes: otherVotes, share: otherVotes / result.turnout } : null,
    safety: seatSafety(result.majorityPct),
    standing: majorityStanding(seats, key),
    runs: list.map((e) => ({ year: e.year, party: e.parties[0]?.name ?? "", share: e.parties[0]?.share ?? null, lead: e.lead, colour: e.parties[0]?.colour ?? elections?.parties?.[e.parties[0]?.name] ?? null })),
    changes: changesOfParty(list),
    former,
    petitions: record.petitions ?? [],
    bins: majorityBins(seats, result.majorityPct),
    national: summary ? { changedHands: summary.changedHandsAtGeneralElection ?? null, underHalf: summary.wonWithUnderHalf ?? null, total: summary.total ?? null } : null,
  };
}

// A council's Band D bill: the whole bill for the area, each year since the file starts. Null where the council is not in England's list.
export function councilTaxProfile(tax, councilName, countyName = null) {
  if (!tax?.rows?.length) return null;
  const wanted = [councilName, countyName].filter(Boolean).map(normCouncil);
  let row = null;
  for (const w of wanted) { row = tax.rows.find((r) => normCouncil(r[0]) === w); if (row) break; }
  if (!row) return null;
  const series = row[2];
  // A council formed recently has no bills for the years before it existed, so its history starts at its first bill.
  const start = series.findIndex((v) => Number.isFinite(v));
  const last = series.at(-1);
  if (start < 0 || !Number.isFinite(last)) return null;
  const first = series[start];
  const earlier = series.at(-2);
  const lasts = tax.rows.map((r) => r[2].at(-1)).filter((v) => Number.isFinite(v));
  const average = lasts.reduce((a, b) => a + b, 0) / lasts.length;
  return {
    name: row[0], type: row[1], series, start, from: tax.from + start, to: tax.from + series.length - 1, last, first,
    sinceFirst: start < series.length - 1 ? ((last - first) / first) * 100 : null,
    sinceLast: Number.isFinite(earlier) ? ((last - earlier) / earlier) * 100 : null,
    average, rank: lasts.filter((v) => v > last).length + 1, of: lasts.length,
  };
}

// A year range as it is written on a council tax bill: 2026 is "2026 to 27".
export const taxYear = (y) => `${y} to ${String(y + 1).slice(2)}`;

// One of the census figures for a region against the UK's, for the groups worth showing. Groups the census does not cover for that nation are left out.
const CENSUS_PICKS = [["age", "65-plus"], ["homes", "private-rent"], ["homes", "own-outright"], ["education", "degree"], ["birth", "born-abroad"], ["ethnicity", "not-white"], ["health", "bad-health"], ["homes", "no-car"]];
export function censusFacts(profile, regionKey) {
  if (!profile?.categories || !regionKey) return [];
  const out = [];
  for (const [cat, id] of CENSUS_PICKS) {
    const c = profile.categories.find((x) => x.id === cat);
    const g = c?.groups?.find((x) => x.id === id);
    const value = g?.values?.[regionKey];
    if (!g || typeof value !== "number") continue;
    out.push({ id: `${cat}-${id}`, label: g.label, of: c.of ?? "of residents", value, uk: typeof g.uk === "number" ? g.uk : typeof g.all === "number" ? g.all : null, ukIsAll: typeof g.uk !== "number" });
  }
  return out.slice(0, 6);
}

// The facts postcodes.io gives about the place, as label and value rows. Nothing is shown for a field it leaves empty.
export function placeFacts(r) {
  const unparished = /unparished/i.test(r?.parish ?? "");
  const rows = [
    ["Ward", r?.admin_ward],
    ["Council area", [r?.admin_district, r?.admin_county].filter(Boolean).join(", ")],
    ["Parish or community", r?.parish && !unparished ? r.parish : null],
    ["Type of area", r?.ruc21 ?? r?.ruc11],
    ["Police force", r?.pfa],
    ["NHS body for your area", r?.icb ?? r?.ccg],
    ["National park", r?.national_park && !/non-national park|non-park/i.test(r.national_park) ? r.national_park : null],
    ["Travel to work area", r?.ttwa],
    ["Census neighbourhood", r?.lsoa],
    ["Wider census area", r?.msoa],
  ];
  return rows.filter(([, v]) => v).map(([label, value]) => ({ label, value: String(value).replace(/^England \(non-National Park\)$/, "") })).filter((x) => x.value);
}

// Who runs what where this postcode is. A two-tier area splits services between district and county; anywhere else one council does it all.
export function whoDoesWhat({ council, county, taxType }) {
  if (!council) return null;
  const district = county || taxType === "SD";
  if (district) {
    return {
      title: "Two councils share the work",
      rows: [
        { who: council.name, role: "District council", does: "Bins and recycling, planning applications, housing, council tax collection, parks, licensing and local elections." },
        { who: county?.name ?? "The county council", role: "County council", does: "Roads, schools, social care, libraries, trading standards and waste disposal." },
      ],
    };
  }
  return {
    title: "One council does it all",
    rows: [{ who: council.name, role: taxType === "ILB" || taxType === "OLB" ? "London borough" : "Single council", does: "Bins, roads, planning, schools, social care, housing, libraries, parks and council tax. In London, the Mayor and Greater London Authority run transport, policing and strategic planning." }]
      .map((r) => (taxType === "ILB" || taxType === "OLB" ? r : { ...r, does: r.does.replace(/ In London.*$/, "") })),
  };
}

// Who to go to for each kind of problem, by what this postcode's nation and council structure are.
export function responsibilities({ council, county, result }) {
  const country = result?.country;
  const lower = council?.name ?? "Your council";
  const upper = county?.name ?? lower;
  const police = result?.pfa || "Your local police force";
  const health = result?.icb || result?.ccg || "Your local NHS body";
  if (country === "Northern Ireland") {
    return [
      ["Bins, recycling, parks and leisure centres", lower], ["Planning applications", lower],
      ["Roads and street lights", "Department for Infrastructure"], ["School places and transport", "Education Authority"],
      ["Social care, GPs and hospitals", "Health and Social Care trusts"], ["Social housing", "Northern Ireland Housing Executive"],
      ["Crime and policing", "Police Service of Northern Ireland"], ["Benefits", "Department for Communities"], ["Passports and tax", "UK government"],
    ];
  }
  const devolved = country === "Scotland" ? "Scottish Government" : country === "Wales" ? "Welsh Government" : null;
  return [
    ["Bins and recycling", lower], ["Fly-tipping and street cleaning", lower], ["Planning applications", lower], ["Housing and homelessness", lower],
    ["Roads, potholes and street lights", upper], ["School places and transport", upper], ["Care for older and disabled adults", upper], ["Libraries", upper],
    ["Crime and policing", country === "Scotland" ? "Police Scotland" : police],
    ["GPs and hospitals", devolved ? `${health === "Your local NHS body" ? "Your local health board" : health}, run by the ${devolved}` : health],
    ["Benefits, pensions and passports", country === "Scotland" ? "UK government. Some benefits come from Social Security Scotland" : "UK government"],
  ];
}

// The hexagon map of all 650 seats, each in the colour of its 2024 winner, with the seat asked about marked and the seats touching it listed. The map is a cartogram:
// every seat is the same size, so "beside" means beside on the map, not on the ground.
export function seatMapProfile({ hexes, seats, key }) {
  if (!hexes?.length) return null;
  const cells = hexes.map(([, name, q, r]) => {
    const { x, y } = hexPosition(q, r, 1);
    const k = seatKey(name);
    const rec = seats?.[k];
    const colour = rec?.result?.candidates?.[0]?.colour;
    return { x, y, name, key: k, colour: colour ? `#${String(colour).replace(/^#/, "")}` : null, rec };
  });
  const mine = cells.findIndex((c) => c.key === key);
  if (mine < 0) return null;
  const me = cells[mine];
  const near = cells
    .map((c, i) => ({ c, i, d: Math.hypot(c.x - me.x, c.y - me.y) }))
    .filter((o) => o.i !== mine && o.d < 1.8)
    .sort((a, b) => a.d - b.d || a.c.x - b.c.x)
    .slice(0, 6);
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    cells: cells.map(({ x, y, colour, name }) => ({ x, y, colour, name })),
    mine,
    box: { x: Math.min(...xs) - 1, y: Math.min(...ys) - 1, w: Math.max(...xs) - Math.min(...xs) + 2, h: Math.max(...ys) - Math.min(...ys) + 2 },
    neighbours: near.map(({ c, i }) => ({ index: i, name: c.name, mp: c.rec?.mp?.name ?? null, party: c.rec?.mp?.party ?? c.rec?.result?.candidates?.[0]?.party ?? null, colour: c.colour, majority: c.rec?.result?.majority ?? null, key: c.key })),
  };
}

// A council's seats at each election, for the years it has them, oldest first and no more than `max`.
export function councilYears(rows, max = 11) {
  return (rows ?? []).filter((r) => r && Number.isFinite(r.year) && r.total > 0).slice(-max);
}

// The next elections for a postcode, trimmed to what the page shows.
export function nextContests(list, today = new Date(), max = 5) {
  const todayIso = today.toISOString().slice(0, 10);
  return (list ?? []).filter((c) => !c.cancelled && c.date >= todayIso).slice(0, max);
}

export { ordinal };
