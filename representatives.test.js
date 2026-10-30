import { describe, it, expect } from "vitest";
import { parsePcc, parseMayors, parseSenedd, scotlandFrom, niFrom } from "./representatives.js";

describe("parsePcc", () => {
  const text = `==List==
{|class="wikitable"
!Incumbent
|-
|[[Clare Moody]]
|{{Party name with colour|Labour and Co-operative Party}}
|[[Avon and Somerset Police and Crime Commissioner|Police and Crime Commissioner for Avon and Somerset]]
|{{center|<ref name="x"/>}}
|-
|[[Roger Hirst]]
|{{Party name with color|Conservative Party (UK)}}
|[[Essex Police, Fire and Crime Commissioner|Police, Fire and Crime Commissioner for Essex]]
|{{center|<ref name="x"/>}}
|}
==Elections==`;
  it("reads each commissioner's name, party and force, in either spelling of the party template", () => {
    expect(parsePcc(text)).toEqual({
      "Avon and Somerset": { name: "Clare Moody", party: "Labour (Co-op)" },
      Essex: { name: "Roger Hirst", party: "Conservative" },
    });
  });
});

describe("parseMayors", () => {
  const text = `{|class="wikitable"
!Authority
|-
|[[Greater Manchester Combined Authority]]
|[[Mayor of Greater Manchester]]
|Established mayoral
|{{sortname|Bev|Craig}}
|{{Party name with colour|Labour and Co-operative}}
|[[2017 Greater Manchester mayoral election|2017]]
|2028
|2,848,300
|}`;
  it("reads the authority, the post, the mayor and their party", () => {
    expect(parseMayors(text)).toEqual([{ authority: "Greater Manchester Combined Authority", post: "Mayor of Greater Manchester", name: "Bev Craig", party: "Labour (Co-op)", next: "2028" }]);
  });
});

describe("parseSenedd", () => {
  const text = `
|-
| 160
| [[Buffy Williams]]
| [[File:x.jpg|centre|alt=|100x100px]]
| [[Rhondda (Senedd constituency)|Rhondda]]
| style="color:inherit" |
| [[Labour Party (UK)|Labour]]
| [[2021 Senedd election|2021]]
| 2026
|-
| 162
| [[Lyn Ackerman]]
| [[File:y.jpg|centre|alt=|100x100px]]
| [[Casnewydd Islwyn]]
| style="color:inherit" |
| [[Plaid Cymru]]
| [[2026 Senedd election|2026]]
| Present
|-
| rowspan="2" | 172
| rowspan="2" | [[Sarah Cooper-Lesadd]]
| rowspan="2" | [[File:z.jpg|centre|alt=|100x100px]]
| rowspan="2" | [[Pen-y-bont Bro Morgannwg]]
| style="color:inherit" |
| [[Reform UK]]
| [[2026 Senedd election|2026]]
| 2026
|-
| style="color:inherit" |
|[[Plaid Cymru]]
|2026
|Present
|-
| 161
| rowspan=2| [[Sioned Williams]]
|`;
  it("keeps only members whose current seat says Present, with a change of party applied", () => {
    const s = parseSenedd(text);
    expect(s).toEqual({
      "Casnewydd Islwyn": [{ name: "Lyn Ackerman", party: "Plaid Cymru" }],
      "Pen-y-bont Bro Morgannwg": [{ name: "Sarah Cooper-Lesadd", party: "Plaid Cymru" }],
    });
  });
});

describe("scotlandFrom", () => {
  const input = {
    members: [{ PersonID: 1, PreferredName: "Angela", ParliamentaryName: "Constance, Angela" }, { PersonID: 2, PreferredName: "Liam", ParliamentaryName: "Kerr, Liam" }],
    constituencies: [{ ID: 10, ConstituencyCode: "S1", Name: "Almond Valley", RegionID: 5, ValidUntilDate: null }, { ID: 11, ConstituencyCode: "S0", Name: "Old Seat", RegionID: 5, ValidUntilDate: "2011-05-04T00:00:00" }],
    regions: [{ ID: 5, Name: "Lothian", EndDate: null }, { ID: 6, Name: "Old Region", EndDate: "2011-05-04T00:00:00" }],
    constituencyStatuses: [{ ConstituencyID: 10, PersonID: 1, ValidUntilDate: null, ElectionStatusID: 1 }],
    regionStatuses: [{ RegionID: 5, PersonID: 2, ValidUntilDate: null, ElectionStatusID: 1 }, { RegionID: 5, PersonID: 1, ValidUntilDate: "2020-01-01T00:00:00", ElectionStatusID: 1 }],
    memberParties: [{ PersonID: 1, PartyID: 1, ValidFromDate: "2020-01-01T00:00:00", ValidUntilDate: "2022-01-01T00:00:00" }, { PersonID: 1, PartyID: 2, ValidFromDate: "2022-01-02T00:00:00", ValidUntilDate: null }, { PersonID: 2, PartyID: 1, ValidFromDate: "2020-01-01T00:00:00", ValidUntilDate: null }],
    parties: [{ ID: 1, PreferredName: "Scottish Conservative" }, { ID: 2, PreferredName: "Scottish National Party" }],
  };
  it("lists current constituencies and regions only, with each member's current party", () => {
    const s = scotlandFrom(input);
    expect(Object.keys(s.constituencies)).toEqual(["Almond Valley"]);
    expect(s.constituencies["Almond Valley"]).toEqual({ code: "S1", region: "Lothian", msp: { name: "Angela Constance", party: "Scottish National Party" } });
    expect(s.regions).toEqual({ Lothian: [{ name: "Liam Kerr", party: "Scottish Conservative" }] });
  });
});

describe("niFrom", () => {
  it("reads the member list out of the Assembly's XML wrapper, by constituency, without titles", () => {
    const wrapped = `<?xml version="1.0"?><string>${JSON.stringify({ AllMembersList: { Member: [
      { MemberFullDisplayName: "Dr Steve Aiken OBE", PartyName: "Ulster Unionist Party", ConstituencyName: "South Antrim" },
      { MemberFullDisplayName: "Declan Kearney", PartyName: "Sinn Féin", ConstituencyName: "South Antrim" },
    ] } })}</string>`;
    expect(niFrom(wrapped)).toEqual({ "South Antrim": [{ name: "Declan Kearney", party: "Sinn Féin" }, { name: "Steve Aiken", party: "Ulster Unionist Party" }] });
  });
});
