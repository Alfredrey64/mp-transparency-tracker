// Turns a seat's earlier results (electionHistory.json) and its latest result (constituencies.json) into one list of
// elections, oldest first, for the Elections tab.

// One election as { year, parties: [{ name, share }] , lead, winner }, whichever file it came from.
export function electionList(history, record) {
  const list = (history ?? []).map((e) => ({ year: e.y, old: true, parties: e.c.map(([name, share, votes]) => ({ name, share, votes })), lead: e.p, majority: e.m }));
  const r = record.result;
  if (r?.candidates?.length && r.isGeneralElection !== false) {
    list.push({
      year: Number(String(r.date ?? "2024").slice(0, 4)) || 2024, old: false,
      parties: r.candidates.map((c) => ({ name: c.party, share: (c.share ?? 0) * 100, votes: c.votes, colour: c.colour })),
      lead: r.majorityPct, majority: r.majority,
    });
  }
  return list.sort((a, b) => a.year - b.year);
}

// How many times the seat changed party between one election and the next.
export function changesOfParty(list) {
  const out = [];
  for (let i = 1; i < list.length; i++) if (list[i].parties[0]?.name !== list[i - 1].parties[0]?.name) out.push({ year: list[i].year, from: list[i - 1].parties[0]?.name, to: list[i].parties[0]?.name });
  return out;
}

const SHORT = { Conservative: "Con", Labour: "Lab", "Liberal Democrat": "Lib Dem", "Scottish National Party": "SNP", "Green Party": "Green", "Plaid Cymru": "Plaid", "Reform UK": "Reform", "Democratic Unionist Party": "DUP", "Sinn Féin": "Sinn Féin", "Social Democratic & Labour Party": "SDLP", "Ulster Unionist Party": "UUP", "British National Party": "BNP" };

// A party's name in the short form used in tight spaces: "Lib Dem", "SNP".
export const shortParty = (name) => SHORT[name] ?? name;
