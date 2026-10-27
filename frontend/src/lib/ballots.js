// Who is on a postcode's ballot, from Democracy Club's open data. Two keyless calls, both made by the visitor's own browser: the elections service says which
// contests a postcode votes in, and the candidates service lists the people standing in each one. Nothing is stored and no server of ours is involved.
// The functions that turn the answers into plain words are pure and tested; the two that fetch take an optional fetch and signal so they can be tested too.

import { fill } from "./i18n";

export const ELECTIONS_URL = "https://elections.democracyclub.org.uk/api/elections/";
export const BALLOTS_URL = "https://candidates.democracyclub.org.uk/api/next/ballots/";
export const MAX_CONTESTS = 12;
const TIMEOUT_MS = 12000;

// "sw1a 1aa", " SW1A1AA " -> "SW1A1AA". Anything that is not shaped like a UK postcode gives null, so nothing odd is ever sent on.
export function cleanPostcode(input) {
  const pc = String(input ?? "").replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(pc) ? pc : null;
}

export const surnameOf = (name) => {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
};

// People are listed by surname, A to Z, the way a ballot paper lists them. That is the only order used: never by party, and never by anything about them.
export function bySurname(people) {
  const key = (p) => `${surnameOf(p.name).toLowerCase()} ${String(p.name).toLowerCase()}`;
  return [...people].sort((a, b) => key(a).localeCompare(key(b), "en"));
}

// Whole days from today until an ISO date (0 for today, negative if it has passed).
export function daysTo(iso, today = new Date()) {
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = String(iso).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - a) / 86400000);
}

export const prettyDate = (iso, locale = "en-GB") =>
  new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
export const shortDate = (iso, locale = "en-GB") =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

const ROLES = { "Local Councillor": "Councillor", "Member of Parliament": "MP", "Police and Crime Commissioner": "Police and crime commissioner" };
export const roleText = (role) => ROLES[role] ?? (role ? role.charAt(0).toUpperCase() + role.slice(1) : null);

const REASONS = { RESIGNATION: "after the previous holder resigned", DEATH: "after the previous holder died", RECALL: "after a recall petition", DISQUALIFICATION: "after the previous holder was disqualified" };
export function byElectionText(reason) {
  if (!reason) return null;
  return REASONS[reason] ? `A by-election, held ${REASONS[reason]}.` : "A by-election, held because the seat became empty.";
}

// A plain sentence on how to mark the ballot paper, as a template with {n} for the page to translate, and the values to fill it with. Only systems we are sure
// of are described; for any other this gives null and the page says nothing rather than guess.
export function howToMarkParts(system, seats) {
  const n = Number(seats) || 1;
  if (system === "FPTP") return n > 1
    ? { text: "You have up to {n} votes: mark an X next to each candidate you want, up to {n}. The {n} candidates with the most votes win.", vars: { n } }
    : { text: "Mark one X. The candidate with the most votes wins.", vars: {} };
  if (system === "STV") return n === 1
    ? { text: "Number the candidates 1, 2, 3 in the order you prefer them, as many or as few as you like. One person is elected.", vars: {} }
    : { text: "Number the candidates 1, 2, 3 in the order you prefer them, as many or as few as you like. {n} people are elected.", vars: { n } };
  if (system === "SV") return { text: "Mark one X for your first choice and one for your second. If nobody has more than half the first choices, the top two go through and second choices are counted.", vars: {} };
  return null;
}
export function howToMark(system, seats) {
  const p = howToMarkParts(system, seats);
  return p ? fill(p.text, p.vars) : null;
}

const DEADLINES = [
  ["close_of_nominations", "Nominations close"],
  ["registration_deadline", "Last day to register to vote"],
  ["postal_vote_application_deadline", "Last day to apply for a postal vote"],
  ["proxy_vote_application_deadline", "Last day to apply for a proxy vote"],
];
export function deadlinesOf(timetable, today = new Date()) {
  if (!timetable || typeof timetable !== "object") return [];
  return DEADLINES.filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(String(timetable[k] ?? "")))
    .map(([k, label]) => ({ key: k, label, date: timetable[k], passed: daysTo(timetable[k], today) < 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// One answer from the elections service -> a contest with only what the page shows. Groups (a council's whole set of seats) are dropped by contests() below.
export function toContest(r) {
  const division = r.division?.name ?? null;
  const org = r.organisation?.common_name ?? null;
  return {
    id: String(r.election_id),
    date: r.poll_open_date,
    title: division ? (org ? `${division}, ${org}` : division) : (r.election_title ?? r.election_id),
    full: r.election_title ?? "",
    role: roleText(r.elected_role),
    seats: Number.isInteger(r.seats_contested) ? r.seats_contested : null,
    system: r.voting_system?.slug ?? null,
    systemName: r.voting_system?.name ?? null,
    voterId: r.requires_voter_id === "EA-2022",
    byElection: byElectionText(r.by_election_reason),
    cancelled: r.cancelled === true,
    reason: r.cancellation_reason ?? null,
    kind: r.election_type?.election_type ?? null,
    deadlines: deadlinesOf(r.timetable),
    closes: r.timetable?.close_of_nominations ?? null,
  };
}

// The contests among a set of answers: the single ballots a person marks, not the group that gathers them.
export function contests(results) {
  return (Array.isArray(results) ? results : [])
    .filter((r) => r && !r.deleted && r.group_type == null && typeof r.election_id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.poll_open_date ?? ""))
    .map(toContest)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "en"));
}

// A candidate list from the candidates service: [{ id, name, party, profile }] by surname, and whether the list is final.
export function candidatesOf(ballot) {
  const rows = (Array.isArray(ballot?.candidacies) ? ballot.candidacies : [])
    .filter((c) => c && !c.deselected && c.person?.name)
    .map((c) => ({
      id: Number.isInteger(c.person.id) ? c.person.id : null,
      name: String(c.person.name),
      party: String(c.party_name || c.party?.name || "Independent"),
    }))
    .map((c) => ({ ...c, profile: c.id ? `https://whocanivotefor.co.uk/person/${c.id}/` : null }));
  return { list: bySurname(rows), locked: ballot?.candidates_locked === true, uncontested: ballot?.uncontested === true };
}

async function getJson(url, { fetchImpl = fetch, signal } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  const stop = () => ctl.abort();
  signal?.addEventListener("abort", stop);
  try {
    const res = await fetchImpl(url, { signal: ctl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.status = res.status; throw e; }
    return await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}

// Every contest the postcode votes in that has not happened yet. Follows the service's paging, but only to its own address.
export async function findContests(postcode, opts = {}) {
  const pc = cleanPostcode(postcode);
  if (!pc) { const e = new Error("bad postcode"); e.status = 400; throw e; }
  let url = `${ELECTIONS_URL}?postcode=${pc}&current=1&limit=100`;
  const results = [];
  for (let page = 0; url && page < 3; page += 1) {
    const json = await getJson(url, opts);
    results.push(...(json.results ?? []));
    const next = typeof json.next === "string" ? json.next.replace(/^http:/, "https:") : null;
    url = next && next.startsWith(ELECTIONS_URL) ? next : null;
  }
  return contests(results);
}

export async function findCandidates(ballotId, opts = {}) {
  try {
    return candidatesOf(await getJson(`${BALLOTS_URL}${encodeURIComponent(ballotId)}/`, opts));
  } catch (e) {
    // No page for the contest yet just means no candidates have been published.
    if (e?.status === 404) return { list: [], locked: false, uncontested: false, missing: true };
    throw e;
  }
}

// The contests for a postcode, each with its candidates (or `error` if that list would not load). At most MAX_CONTESTS are filled in.
export async function lookUpBallots(postcode, opts = {}) {
  const all = await findContests(postcode, opts);
  const shown = all.slice(0, MAX_CONTESTS);
  const withPeople = await Promise.all(shown.map(async (c) => {
    if (c.kind === "ref" || c.cancelled) return { ...c, candidates: null };
    try { return { ...c, candidates: await findCandidates(c.id, opts) }; } catch { return { ...c, candidates: null, error: true }; }
  }));
  return { contests: withPeople, more: Math.max(0, all.length - shown.length) };
}
