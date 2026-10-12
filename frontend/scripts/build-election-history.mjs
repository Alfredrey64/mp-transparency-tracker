// Turns the downloaded constituency results (scripts/fetch-election-history.mjs) into the two files the General elections page loads:
//   src/data/electionsHistory.json  national results for each election 1945 to 2019, and for every seat that kept its name, who won and by how much
//   src/data/seatHexes2019.json     the hexagon layout for the 650 seats used from 2010 to 2019 (Open Innovations hexmaps, MIT licence)
// Usage: node scripts/build-election-history.mjs <raw.json> <hex2019.json>
import { readFileSync, writeFileSync } from "node:fs";

const [rawPath, hexPath] = process.argv.slice(2);
if (!rawPath || !hexPath) throw new Error("Usage: build-election-history.mjs <raw.json> <hex2019.json>");
const raw = JSON.parse(readFileSync(rawPath, "utf8"));
const hexIn = JSON.parse(readFileSync(hexPath, "utf8"));

const norm = (s) => String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\bst\.? /g, "st ").replace(/[^a-z0-9]+/g, " ").trim();
// Word order differs for a few cities ("Central Newcastle upon Tyne" and "Newcastle upon Tyne Central"), so a second key ignores order.
const bag = (s) => norm(s).split(" ").sort().join(" ");

// ---- Hexagons ------------------------------------------------------------------------------------------------------------------------
const hexes = Object.entries(hexIn.hexes).map(([code, h]) => [code, h.n, h.q, h.r, h.region]);
writeFileSync(new URL("../src/data/seatHexes2019.json", import.meta.url), JSON.stringify({ layout: hexIn.layout, source: "Open Innovations hexmaps, uk-constituencies-2019-BBC.hexjson (MIT)", hexes }));
const hexByName = new Map(hexes.map((h, i) => [norm(h[1]), i]));
const hexByBag = new Map(hexes.map((h, i) => [bag(h[1]), i]));

// ---- Parties -------------------------------------------------------------------------------------------------------------------------
// Groups used on the page. Conservative includes its allies (Scottish Unionists, National Liberals and, until 1970, the Ulster Unionists),
// the way the House of Commons Library counts them. The Liberal group includes the SDP and the Alliance of the 1980s.
const NI = new Set(["DUP", "SDLP", "Sinn Féin", "Alliance", "Vanguard", "Ulster Popular Unionist", "UK Unionist", "United Ulster Unionist", "Protestant Unionist", "Republican Labour", "Unity", "Nationalist Party of Northern Ireland", "Independent Republican", "Independent Unionist", "Democratic Labour", "Irish Labour", "UUP", "Ulster Unionist", "Traditional Unionist Voice", "Democratic Unionist Party"]);
const CON = new Set(["Conservative", "Scottish Unionist", "National Liberal and Conservative", "Conservative and National Liberal", "Liberal National", "National Liberal", "National Government", "Unionist", "Conservative and Unionist"]);
const LAB = new Set(["Labour", "Labour Co-op", "Labour Co-Op"]);
const LIB = new Set(["Liberal", "Liberal Democrats", "Social Democratic", "SDP-Liberal Alliance"]);
function group(party, year) {
  if (party === "UUP" && year <= 1970) return "c";
  if (CON.has(party)) return "c";
  if (LAB.has(party)) return "l";
  if (LIB.has(party)) return "d";
  if (party === "SNP") return "s";
  if (party === "Plaid Cymru") return "p";
  if (party === "Green" || party === "Greens") return "g";
  if (party === "UKIP" || party === "Reform UK" || party === "Brexit Party") return "u";
  if (party === "Speaker") return "k";
  if (NI.has(party)) return "n";
  return "x";
}

// ---- Elections -----------------------------------------------------------------------------------------------------------------------
// Turnout and the Prime Minister's party come from the House of Commons Library tables (turnout is the same in UK Political Info).
const TURNOUT = { 1950: 83.9, 1951: 82.6, 1955: 76.8, 1959: 78.7, 1964: 77.1, 1966: 75.8, 1970: 72.0, "1974a": 78.8, "1974b": 72.8, 1979: 76.0, 1983: 72.7, 1987: 75.3, 1992: 77.7, 1997: 71.4, 2001: 59.4, 2005: 61.4, 2010: 65.1, 2015: 66.1, 2017: 68.8, 2019: 67.3 };
// Seats in the Commons that no candidate in the results took up: nothing to adjust, but unopposed Ulster Unionist seats have no candidates listed.
const UNOPPOSED = { 1950: ["armagh", "north antrim"], 1951: ["armagh", "londonderry", "north antrim", "south antrim"] };

const MONTHS = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
const idOf = (title) => (title.startsWith("February 1974") ? "1974a" : title.startsWith("October 1974") ? "1974b" : title.split(" ")[0]);
const dateOf = (voting) => { const m = voting.match(/(\d+) (\w+) (\d{4})/); return `${m[3]}-${String(MONTHS[m[2]] + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`; };

const elections = [];
const maps = {};
for (const e of Object.values(raw)) {
  const id = idOf(e.title);
  if (id === "1945") continue; // handled by hand below: multi-member and university seats cannot be read from the votes
  const year = parseInt(id, 10);
  const seats = {}; const votes = {}; let valid = 0;
  const winners = new Array(hexes.length).fill(".");
  const bands = new Array(hexes.length).fill(".");
  let matched = 0;
  const seen = new Set();
  for (const s of e.seats) {
    const rows = s.rows.filter((r) => Number.isFinite(r[2])).sort((a, b) => b[2] - a[2]);
    const total = rows.reduce((n, r) => n + r[2], 0);
    let g, band;
    if (!rows.length) {
      if (!UNOPPOSED[id]?.includes(norm(s.name))) throw new Error(`No result for ${s.name} in ${id}`);
      g = year <= 1970 ? "c" : "n"; band = 9; // these were all Ulster Unionist seats
    } else {
      g = group(rows[0][1], year);
      band = rows[1] ? Math.min(9, Math.floor(((rows[0][2] - rows[1][2]) / total) * 100 / 5)) : 9;
    }
    seats[g] = (seats[g] ?? 0) + 1;
    for (const r of rows) { const k = group(r[1], year); votes[k] = (votes[k] ?? 0) + r[2]; valid += r[2]; }
    const key = norm(s.name);
    const i = hexByName.get(key) ?? hexByBag.get(bag(s.name));
    if (i !== undefined && !seen.has(i)) { winners[i] = g; bands[i] = String(band); matched += 1; seen.add(i); }
  }
  const total = e.seats.length;
  const shares = Object.fromEntries(Object.entries(votes).map(([k, v]) => [k, Math.round((v / valid) * 1000) / 10]));
  // The constituency data and the House of Commons Library table disagree by a seat or two for 1950 (Labour 314 against 315; one more Conservative
  // than the published 297 plus the Speaker), so the published totals are used for that election's national figures. The map still uses the seats.
  if (id === "1950") { for (const k of Object.keys(seats)) delete seats[k]; Object.assign(seats, { l: 315, c: 297, d: 9, k: 1, x: 3 }); }
  elections.push({ id, date: dateOf(e.voting), turnout: TURNOUT[id], seats: total, seatsWon: seats, voteShare: shares, validVotes: valid, matchedSeats: matched, ...(id === "1950" ? { published: true } : {}) });
  maps[id] = { w: winners.join(""), b: bands.join("") };
}

// 1945: published totals (House of Commons Library; Parliament's results data lists two-member and university seats by votes, not winners).
elections.unshift({
  id: "1945", date: "1945-07-05", turnout: 72.8, seats: 640,
  seatsWon: { l: 393, c: 213, d: 12, x: 22 },
  voteShare: { l: 47.7, c: 39.8, d: 9.0, x: 3.5 },
  validVotes: 25095195, matchedSeats: 0, published: true,
});

writeFileSync(new URL("../src/data/electionsHistory.json", import.meta.url), JSON.stringify({
  source: "UK Parliament, UK General Elections Results 1832 - 2019 (Open Parliament Licence); 1945 totals from the House of Commons Library",
  hexOrder: "seatHexes2019.json",
  elections, maps,
}));
for (const e of elections) {
  const s = e.seatsWon;
  console.log(e.id, e.date, `seats ${e.seats}`, `C${s.c ?? 0} L${s.l ?? 0} D${s.d ?? 0} S${s.s ?? 0} P${s.p ?? 0} G${s.g ?? 0} U${s.u ?? 0} N${s.n ?? 0} K${s.k ?? 0} X${s.x ?? 0}`, JSON.stringify(e.voteShare), `matched ${e.matchedSeats}`);
}
