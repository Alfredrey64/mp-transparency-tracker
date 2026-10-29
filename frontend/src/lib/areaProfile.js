// What the "Your area" page works out about one place beyond its MP and council: how the seat voted and has changed hands, where the neighbourhood
// sits on the deprivation index, what the council tax bill is, what the region's census says, and who does what locally. Every function is pure, so
// the figures can be tested; the files they read are loaded by the page and passed in.

import { seatSafety, majorityStanding, ordinal } from "./constituency";
import { electionList, changesOfParty } from "./seatElections";
import { normCouncil } from "./councils";

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
export function seatProfile({ key, seats, summary, history, elections }) {
  const record = seats?.[key];
  const result = record?.result;
  if (!record || !result?.candidates?.length) return null;
  const candidates = [...result.candidates].sort((a, b) => b.votes - a.votes);
  const turnouts = Object.values(seats).map((s) => s.result?.turnoutPct).filter((v) => typeof v === "number");
  const turnout = typeof result.turnoutPct === "number"
    ? { pct: result.turnoutPct, average: summary?.turnout?.average ?? null, rank: turnouts.filter((v) => v > result.turnoutPct).length + 1, of: turnouts.length }
    : null;
  const list = electionList(elections?.bySeat?.[key], record);
  const former = [...(history?.[key] ?? [])].sort((a, b) => String(b.end ?? "").localeCompare(String(a.end ?? ""))).slice(0, 4);
  return {
    record, result, candidates, turnout,
    safety: seatSafety(result.majorityPct),
    standing: majorityStanding(seats, key),
    runs: list.map((e) => ({ year: e.year, party: e.parties[0]?.name ?? "", share: e.parties[0]?.share ?? null, lead: e.lead, colour: e.parties[0]?.colour ?? elections?.parties?.[e.parties[0]?.name] ?? null })),
    changes: changesOfParty(list),
    former,
    petitions: record.petitions ?? [],
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
  const last = series.at(-1);
  const first = series[0];
  const lasts = tax.rows.map((r) => r[2].at(-1)).filter((v) => Number.isFinite(v));
  const average = lasts.reduce((a, b) => a + b, 0) / lasts.length;
  return {
    name: row[0], type: row[1], series, from: tax.from, to: tax.from + series.length - 1, last, first,
    sinceFirst: ((last - first) / first) * 100, sinceLast: series.length > 1 ? ((last - series.at(-2)) / series.at(-2)) * 100 : null,
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

// The next elections for a postcode, trimmed to what the page shows.
export function nextContests(list, today = new Date(), max = 5) {
  const todayIso = today.toISOString().slice(0, 10);
  return (list ?? []).filter((c) => !c.cancelled && c.date >= todayIso).slice(0, max);
}

export { ordinal };
