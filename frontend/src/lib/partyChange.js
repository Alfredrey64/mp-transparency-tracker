// MPs who now sit for a different party from the one they were elected for. The 2024 result names the party on the ballot, and the MP's record names
// the party they sit for today, so a seat can show an Independent MP beside a Labour result. This works out where that has happened and writes the
// note that goes beside both. Whether the MP left, was suspended or had the whip removed is not in either record, so the note says only where
// they were elected and where they sit now; a short account is added by hand for MPs where it has been checked (DETAILS, keyed by Parliament's member id).

const TITLES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "sir", "dame", "lord", "lady", "prof", "professor", "rev", "reverend", "rt", "hon", "the"]);

// The words of a name without titles or punctuation. "Abdi-Wali, Sagal" and "Ms Sagal Abdi-Wali" give the same words.
export function nameWords(name) {
  let n = String(name ?? "");
  if (n.includes(",")) { const [surname, ...rest] = n.split(","); n = `${rest.join(" ")} ${surname}`; }
  return n.toLowerCase().replace(/[.'’]/g, "").split(/[\s-]+/).filter((w) => w && !TITLES.has(w));
}

// The same person under two spellings: first names that are the same or one a short form of the other, and a name word in common ("Josh Dean" and
// "Joshua Robert Abraham Dean", "Tan Dhesi" and "Tanmanjeet Singh Dhesi").
export function sameMp(a, b) {
  const x = nameWords(a);
  const y = nameWords(b);
  if (!x.length || !y.length || !(x[0].startsWith(y[0]) || y[0].startsWith(x[0]))) return false;
  return x.slice(1).some((w) => w.length > 2 && y.slice(1).includes(w));
}

// A party's family for this purpose: Labour (Co-op) is Labour, and the Speaker, who stands as an independent, is not a change.
export function partyFamily(party) {
  const p = String(party ?? "").toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();
  if (p === "speaker" || p === "independent") return "independent";
  if (p === "labour and co-operative") return "labour";
  return p;
}

const sits = (party) => (partyFamily(party) === "independent" ? "as an Independent" : `for ${party}`);

// Checked accounts, by Parliament's member id.
export const DETAILS = {
  4030: "Labour suspended him on 31 March 2026. He has said he will keep representing his constituents as an independent.",
  4475: "She left the Conservatives and joined Reform UK on 26 January 2026.",
  4320: "He left the Conservatives and joined Reform UK in January 2026.",
  1447: "He left the Conservatives and joined Reform UK in January 2026.",
  4858: "He left the Conservatives and joined Reform UK in September 2025.",
  5158: "Reform UK suspended him in March 2025. He founded Restore Britain, which was registered as a party in March 2026.",
};

// For a seat record { mp: { name, party, memberId }, result: { title, candidates } }: null, or what changed.
export function partyChange(record) {
  const mp = record?.mp;
  const winner = record?.result?.candidates?.[0];
  if (!mp || !winner || !sameMp(winner.name, mp.name)) return null;
  if (partyFamily(winner.party) === partyFamily(mp.party)) return null;
  const election = String(record.result.title ?? "the last election").replace(/^\d{4}-\d{2}-\d{2}\s+/, "").replace(/^(\d{4}) General Election$/, "$1 general election");
  return {
    name: winner.name,
    electedAs: winner.party,
    now: mp.party,
    election,
    text: `${winner.name} was elected ${sits(winner.party)} at the ${election} and now sits ${sits(mp.party)}.`,
    detail: DETAILS[mp.memberId] ?? null,
  };
}
