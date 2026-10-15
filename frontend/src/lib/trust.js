import raw from "../data/trustData.json";
import { GE2024, turnoutPct } from "../data/generalElection2024";
import history from "../data/electionsHistory.json";

// Working things out from the Trust in politics page's data (trustData.json, built by scripts/build-trust-data.mjs, plus the election results the site
// already holds), so the words and the charts cannot drift apart.

export const T = raw;
export const UK = "GBR";
export const AVG = "OECD_REP";
export const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const dateText = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

// ---- The OECD Trust Survey ----------------------------------------------------------------------------------------------------------------------
export const INSTITUTIONS = {
  government: { label: "National government", blurb: "The share who say they trust the national government to a high or moderately high degree." },
  parliament: { label: "Parliament", blurb: "The share who say they trust the national parliament (in the UK, the House of Commons and House of Lords) to a high or moderately high degree." },
  civilService: { label: "Civil service", blurb: "The share who say they trust the civil service to a high or moderately high degree." },
  localGovernment: { label: "Local government", blurb: "The share who say they trust their local government to a high or moderately high degree." },
  courts: { label: "Courts and legal system", blurb: "The share who say they trust the courts and legal system to a high or moderately high degree." },
};
export const INSTITUTION_KEYS = Object.keys(INSTITUTIONS);
export const YEARS = ["2021", "2023"];
// The share with high or moderately high trust for an institution in one wave. Government is stored with its whole spread.
export const trustOf = (code, year, key) => {
  const y = T.countries[code]?.years?.[year];
  if (!y) return null;
  const v = key === "government" ? y.government?.HMH : y[key];
  return typeof v === "number" ? v : null;
};
export const spreadOf = (code, year) => T.countries[code]?.years?.[year]?.government ?? null;
// Countries with a figure in 2023 for an institution, highest first, including the OECD average row (marked).
export function ranking(key, year = "2023") {
  return Object.entries(T.countries).map(([code, c]) => ({ code, name: c.name, value: trustOf(code, year, key), avg: code === AVG, uk: code === UK })).filter((r) => r.value !== null).sort((a, b) => b.value - a.value);
}
export const ukRank = (key, year = "2023") => { const r = ranking(key, year).filter((x) => !x.avg); return { rank: r.findIndex((x) => x.uk) + 1, of: r.length }; };
export const COUNTRIES_2023 = Object.keys(T.countries).filter((c) => c !== AVG && trustOf(c, "2023", "government") !== null).length;

// ---- Voting ------------------------------------------------------------------------------------------------------------------------------------------------------
const e24 = { id: "2024", date: GE2024.date, turnout: round(turnoutPct(), 1) };
const share = (votes) => round((votes / GE2024.validVotes) * 100, 1);
const lab = GE2024.parties.find((p) => p[0] === "Labour");
const con = GE2024.parties.find((p) => p[0] === "Conservative");
const when = (iso) => { const d = new Date(`${iso}T00:00:00Z`); const start = Date.UTC(d.getUTCFullYear(), 0, 1); return round(d.getUTCFullYear() + (d.getTime() - start) / (365.25 * 86400000), 3); };
const nameOf = (id, iso) => (id.length > 4 ? `${MONTHS[new Date(`${iso}T00:00:00Z`).getUTCMonth()]} ${id.slice(0, 4)}` : id);
export const ELECTIONS = [
  ...history.elections.map((e) => ({ id: e.id, year: Number(e.id.slice(0, 4)), t: when(e.date), turnout: e.turnout, twoParty: round((e.voteShare.l ?? 0) + (e.voteShare.c ?? 0), 1), label: nameOf(e.id, e.date) })),
  { id: "2024", year: 2024, t: when(GE2024.date), turnout: e24.turnout, twoParty: round(share(lab[1]) + share(con[1]), 1), label: "2024" },
];
export const electionLabel = (t) => ELECTIONS.find((e) => e.t === t)?.label ?? String(Math.floor(t));
export const turnoutPeak = () => ELECTIONS.reduce((a, e) => (e.turnout > a.turnout ? e : a), ELECTIONS[0]);
export const turnoutLow = () => ELECTIONS.reduce((a, e) => (e.turnout < a.turnout ? e : a), ELECTIONS[0]);
export const turnoutNow = () => ELECTIONS.at(-1);
export const lowerTurnouts = () => ELECTIONS.filter((e) => e.turnout < turnoutNow().turnout).map((e) => e.id);
export const TOTAL_SEATS = 650;
export const PARTY_ROWS = GE2024.parties.filter((p) => p[1] > 150000 || p[2] > 0).map(([name, votes, seats]) => ({ name, votes, seats, voteShare: share(votes), seatShare: round((seats / TOTAL_SEATS) * 100, 1), perSeat: seats > 0 ? Math.round(votes / seats) : null }));
export const MAIN_PARTIES = ["Labour", "Conservative", "Reform UK", "Liberal Democrat", "Green Party"];
export const mainRows = () => MAIN_PARTIES.map((n) => PARTY_ROWS.find((r) => r.name === n));
export const electorate = GE2024.electorate;
export const labourOfElectorate = round((lab[1] / GE2024.electorate) * 100, 1);
export const notVoted = () => round(100 - turnoutPct(), 1);
export { GE2024 };
