// Turns a Members API biography into the handful of career facts the
// Parliament in Numbers page uses. Pure, so each rule can be tested against
// a hand-built biography rather than the live API.

const COMMONS = 1;
const yearOf = (d) => (d ? Number(String(d).slice(0, 4)) : null);

// "Labour (Co-op)" sits as Labour; the Co-operative Party is allied to it.
export function partyFamily(name) {
  return String(name ?? "").replace(/\s*\(Co-op\)\s*$/i, "").trim();
}

const isIndependent = (family) => /^independent/i.test(family);

// Party history, oldest first -> what happened to this MP's allegiance:
//   { from, kind: "switch" }       sits for a different party than before
//   { from, kind: "independent" }  now sits as an independent, having belonged to a party
//   null                           no change (a spell as an independent that
//                                  ended back in the same party doesn't count)
export function partyChange(affiliations) {
  const ordered = [...(affiliations ?? [])]
    .filter((a) => a.name)
    .sort((a, b) => String(a.startDate ?? "").localeCompare(String(b.startDate ?? "")));
  if (ordered.length < 2) return null;
  const families = ordered.map((a) => partyFamily(a.name));
  const current = families[families.length - 1];
  const earlier = families.slice(0, -1).filter((f) => !isIndependent(f));
  const lastOther = [...earlier].reverse().find((f) => f !== current);
  if (!lastOther) return null;
  return { from: lastOther, kind: isIndependent(current) ? "independent" : "switch" };
}

// Fields, in order: first year in the Commons, elections won, government
// posts held, in government now (0/1), shadow posts held, committees now,
// committees ever, elections contested without winning, party left, kind of
// change ("s" switch / "i" independent / null).
export function careerRecord(bio) {
  const commons = (bio.houseMemberships ?? []).filter((h) => h.house === COMMONS || h.name === "Commons");
  const first = commons.map((h) => yearOf(h.startDate)).filter(Boolean).sort((a, b) => a - b)[0] ?? null;
  const elected = (bio.representations ?? [])
    .filter((r) => r.house === COMMONS)
    .reduce((n, r) => n + Number(String(r.additionalInfo ?? "").match(/Elected (\d+) time/)?.[1] ?? 0), 0);
  const gov = bio.governmentPosts ?? [];
  const committees = bio.committeeMemberships ?? [];
  const change = partyChange(bio.partyAffiliations);
  return [
    first,
    elected,
    gov.length,
    gov.some((p) => !p.endDate) ? 1 : 0,
    (bio.oppositionPosts ?? []).length,
    committees.filter((c) => !c.endDate).length,
    committees.length,
    (bio.electionsContested ?? []).filter((e) => e.house === COMMONS || e.house == null).length,
    change?.from ?? null,
    change ? (change.kind === "switch" ? "s" : "i") : null,
  ];
}

// ---- Full career detail, for the Career tab on a profile -------------------
// Everything above boils a biography down to numbers. This keeps the
// dated detail instead: each seat, party membership, government and shadow
// post, committee and lost election, as short arrays so a few hundred MPs
// fit in a file the browser can fetch on demand.
//
//   h  Commons spells        [start, end|null]
//   s  seats represented     [seat, start, end|null, times elected in that spell]
//   p  party memberships     [party, start, end|null]
//   g  government posts      [post, department|null, start, end|null]
//   o  shadow/opposition     [post, department|null, start, end|null]
//   x  other posts           [post, start, end|null]
//   c  committees            [committee, start, end|null, role|null]
//   l  elections lost        [seat, date]
//
// Every list is oldest first. Dates are "YYYY-MM-DD".

const day = (v) => (v ? String(v).slice(0, 10) : null);
const sortBy = (list, key) => [...list].sort((a, b) => String(key(a) ?? "").localeCompare(String(key(b) ?? "")));
const isCommonsRow = (r) => r.house === COMMONS || r.name === "Commons";

export function careerDetail(bio) {
  const info = (r) => r.additionalInfo || null;
  return {
    h: sortBy((bio.houseMemberships ?? []).filter(isCommonsRow), (r) => r.startDate).map((r) => [day(r.startDate), day(r.endDate)]),
    s: sortBy((bio.representations ?? []).filter((r) => r.house === COMMONS), (r) => r.startDate).map((r) => [
      r.name,
      day(r.startDate),
      day(r.endDate),
      Number(String(r.additionalInfo ?? "").match(/Elected (\d+) time/)?.[1] ?? 0),
    ]),
    p: sortBy((bio.partyAffiliations ?? []).filter((r) => r.name), (r) => r.startDate).map((r) => [r.name, day(r.startDate), day(r.endDate)]),
    g: sortBy(bio.governmentPosts ?? [], (r) => r.startDate).map((r) => [r.name, info(r), day(r.startDate), day(r.endDate)]),
    o: sortBy(bio.oppositionPosts ?? [], (r) => r.startDate).map((r) => [r.name, info(r), day(r.startDate), day(r.endDate)]),
    x: sortBy(bio.otherPosts ?? [], (r) => r.startDate).map((r) => [r.name, day(r.startDate), day(r.endDate)]),
    c: sortBy(bio.committeeMemberships ?? [], (r) => r.startDate).map((r) => [r.name, day(r.startDate), day(r.endDate), info(r)]),
    l: sortBy(bio.electionsContested ?? [], (r) => r.startDate).map((r) => [r.name, day(r.startDate)]),
  };
}

// ---- House of Lords --------------------------------------------------------
// One short row per peer, for the Lords half of Parliament in Numbers.
// Fields: first year in the Lords, first and last year as an MP (null if
// never one), elections won as an MP, government posts held, in government
// now (0/1), shadow posts held, Lords committees ever, Lords committees now,
// party left, kind of change ("s" switch / "i" independent / null).
const LORDS = 2;
const isLordsRow = (r) => r.house === LORDS || r.name === "Lords";

export function peerRecord(bio) {
  const lords = (bio.houseMemberships ?? []).filter(isLordsRow).map((h) => yearOf(h.startDate)).filter(Boolean);
  const commons = (bio.houseMemberships ?? []).filter(isCommonsRow);
  const mpFrom = commons.map((h) => yearOf(h.startDate)).filter(Boolean).sort((a, b) => a - b)[0] ?? null;
  const mpTo = commons.length ? Math.max(...commons.map((h) => yearOf(h.endDate) ?? 9999)) : null;
  const elected = (bio.representations ?? [])
    .filter((r) => r.house === COMMONS)
    .reduce((n, r) => n + Number(String(r.additionalInfo ?? "").match(/Elected (\d+) time/)?.[1] ?? 0), 0);
  const gov = bio.governmentPosts ?? [];
  const committees = (bio.committeeMemberships ?? []).filter((c) => c.house === LORDS);
  const change = partyChange(bio.partyAffiliations);
  return [
    lords.length ? Math.min(...lords) : null,
    mpFrom,
    mpTo === 9999 ? null : mpTo,
    elected,
    gov.length,
    gov.some((p) => !p.endDate) ? 1 : 0,
    (bio.oppositionPosts ?? []).length,
    committees.length,
    committees.filter((c) => !c.endDate).length,
    change?.from ?? null,
    change ? (change.kind === "switch" ? "s" : "i") : null,
  ];
}

// A peer's detail: the same dated rows as an MP's, plus their spells in the
// Lords (`lords`), so the Career tab can show "MP from 1997 to 2010, then a
// peer". Seats, parties, posts and committees come out as for an MP; house
// memberships split into `h` (the Commons) and `lords`.
export function peerDetail(bio) {
  return {
    ...careerDetail(bio),
    lords: sortBy((bio.houseMemberships ?? []).filter(isLordsRow), (r) => r.startDate).map((r) => [day(r.startDate), day(r.endDate)]),
  };
}
