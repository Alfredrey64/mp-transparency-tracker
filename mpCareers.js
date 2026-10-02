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
