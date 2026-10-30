// representatives.js
//
// Turns the public lists of who holds which elected office into the small table the Your area page shows. Each function reads one source
// and returns plain data, so the rules can be tested without a network:
//   - parsePcc:      police and crime commissioners, from the table on Wikipedia's "Police and crime commissioner" article (which cites the
//                    Association of Police and Crime Commissioners), keyed by police force
//   - parseMayors:   mayors of the combined authorities and London, from Wikipedia's "Strategic authority mayor" article
//   - parseSenedd:   members of the Senedd, from Wikipedia's "List of members of the Senedd", keyed by Senedd constituency
//   - scotlandFrom:  MSPs, from the Scottish Parliament's open data (constituency members and regional members)
//   - niFrom:        MLAs, from the Northern Ireland Assembly's open data, keyed by constituency
// Names and parties are copied as the sources give them. Nothing is guessed or filled in.

const clean = (s) => String(s ?? "")
  .replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>.*?<\/ref>/gs, "")
  .replace(/\{\{[^{}]*\}\}/g, "").replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
  .replace(/'''?/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const partyName = (cell) => {
  const m = /\{\{\s*Party name with colou?r\s*\|\s*([^}|]+)/i.exec(cell) ?? /\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/.exec(cell);
  return m ? clean(m[1]).replace(/\s*\(UK\)\s*$/i, "").replace(/ and Co-operative( Party)?$/i, " (Co-op)").replace(/^Labour Party$/i, "Labour").replace(/^Conservative Party$/i, "Conservative").replace(/^Liberal Democrats$/i, "Liberal Democrat").replace(/^Green Party of England and Wales$/i, "Green") : null;
};

// Wikipedia names the force after "for": "Police and Crime Commissioner for Devon, Cornwall and The Isles of Scilly".
const forceOf = (office) => clean(office).replace(/^Police and Crime Commissioner for\s+/i, "").replace(/^Police, Fire and Crime Commissioner for\s+/i, "");

// The table rows are "|[[Name]]", "|{{Party name with colour|…}}", "|[[Link|Police and Crime Commissioner for X]]", "|{{center|<ref…>}}".
export function parsePcc(wikitext) {
  const a = wikitext.indexOf("==List==");
  const b = wikitext.indexOf("==Elections==");
  const section = a >= 0 ? wikitext.slice(a, b > a ? b : undefined) : wikitext;
  const out = {};
  for (const row of section.split(/\n\|-\s*\n/)) {
    const cells = row.split(/\n\|(?!\})/).map((c) => c.replace(/^\|/, "").trim()).filter(Boolean);
    const office = cells.find((c) => /Commissioner for/i.test(c));
    if (!office) continue;
    const name = clean(cells[0]);
    const force = forceOf(office);
    if (name && force && !/^(Party|Incumbent)/i.test(name)) out[force] = { name, party: partyName(cells.find((c) => /Party name with colou?r/i.test(c)) ?? "") };
  }
  return out;
}

export function parseMayors(wikitext) {
  const a = wikitext.indexOf("{|");
  const b = wikitext.indexOf("|}", a);
  const table = wikitext.slice(a, b);
  const out = [];
  for (const row of table.split(/\n\|-\s*\n/).slice(1)) {
    const cells = row.split(/\n\|(?!\})/).map((c) => c.replace(/^\|/, "").trim());
    const authority = clean(cells[0]);
    const sort = /\{\{\s*sortname\s*\|\s*([^|}]+)\|\s*([^|}]+)/i.exec(cells[3] ?? "");
    const name = sort ? `${clean(sort[1])} ${clean(sort[2])}` : clean(cells[3]);
    if (!authority || !name) continue;
    out.push({ authority, post: clean(cells[1]), name, party: partyName(cells[4] ?? ""), next: clean(cells[6] ?? "") || null });
  }
  return out;
}

// The Senedd table has a row per member, and a second short row when a member changed seat. A member's current seat is the one whose "to" cell says
// "Present". A seat that is a Senedd region, from before 2026, never counts.
const bare = (c) => String(c ?? "").trim().replace(/^\|\s*/, "").replace(/^rowspan="?\d+"?\s*\|?\s*/, "").replace(/^style="[^"]*"\s*\|?\s*/, "").trim();
const linkText = (c) => { const m = /\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/.exec(c ?? ""); return m ? clean(m[1]) : ""; };

export function parseSenedd(wikitext) {
  const out = {};
  let member = null;
  const add = (seat, to) => {
    if (!/^Present/i.test(to ?? "") || /electoral region/i.test(seat ?? "")) return;
    const constituency = linkText(seat);
    if (member?.name && constituency) (out[constituency] ??= []).push({ name: member.name, party: member.party });
  };
  for (const row of wikitext.split(/\n\|-\s*\n/)) {
    const cells = row.split(/\n\|(?!\})/).map(bare);
    if (/^\d+$/.test(cells[0] ?? "") && /^\[\[/.test(cells[1] ?? "")) {
      member = { name: linkText(cells[1]), party: partyName(cells[5] ?? ""), seat: cells[3] };
      add(member.seat, cells[7]);
    } else if (member && cells[0] === "" && /^\[\[/.test(cells[1] ?? "")) {
      // A change of party in the same seat: a short row of its own, with the new party and the dates.
      member.party = partyName(cells[1]);
      add(member.seat, cells[3]);
    } else if (member && /^\[\[/.test(cells[0] ?? "") && !/File:/.test(cells[0])) {
      // A change of seat: a short row with the new seat and the dates.
      member.seat = cells[0];
      add(member.seat, cells[2]);
    }
  }
  for (const list of Object.values(out)) list.sort((x, y) => x.name.localeCompare(y.name));
  return out;
}

// "Constance, Angela" becomes "Angela Constance"; the preferred name is the one the member uses.
const msp = (members, id) => {
  const m = members.find((x) => x.PersonID === id);
  if (!m) return null;
  const [last] = String(m.ParliamentaryName ?? "").split(",");
  return `${m.PreferredName ?? ""} ${last}`.trim();
};

const current = (r) => r.ValidUntilDate == null || new Date(r.ValidUntilDate) > new Date();

export function scotlandFrom({ members, constituencies, regions, constituencyStatuses, regionStatuses, memberParties, parties }) {
  const partyOf = (personId) => {
    const rows = memberParties.filter((p) => p.PersonID === personId && current(p)).sort((a, b) => String(b.ValidFromDate).localeCompare(String(a.ValidFromDate)));
    const p = rows[0] ? parties.find((x) => x.ID === rows[0].PartyID) : null;
    return p?.PreferredName ?? p?.ActualName ?? null;
  };
  const person = (id) => ({ name: msp(members, id), party: partyOf(id) });
  const out = { constituencies: {}, regions: {} };
  for (const c of constituencies.filter((x) => current(x))) {
    const s = constituencyStatuses.find((x) => x.ConstituencyID === c.ID && current(x) && x.ElectionStatusID === 1);
    out.constituencies[c.Name] = { code: c.ConstituencyCode, region: regions.find((r) => r.ID === c.RegionID)?.Name ?? null, msp: s ? person(s.PersonID) : null };
  }
  for (const r of regions.filter((x) => x.EndDate == null)) {
    out.regions[r.Name] = regionStatuses.filter((x) => x.RegionID === r.ID && current(x) && x.ElectionStatusID === 1).map((x) => person(x.PersonID)).filter((p) => p.name);
  }
  return out;
}

// The Assembly's own data comes wrapped in XML; the member list is the JSON inside it.
export function niFrom(wrapped) {
  const text = String(wrapped);
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const out = {};
  for (const m of json.AllMembersList.Member ?? []) (out[m.ConstituencyName] ??= []).push({ name: String(m.MemberFullDisplayName).replace(/^(Dr|Mr|Mrs|Ms|Miss|Rt Hon|Sir|Lord|Lady)\s+/i, "").replace(/\s+(OBE|MBE|CBE|KBE)$/i, "").trim(), party: m.PartyName });
  for (const list of Object.values(out)) list.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
