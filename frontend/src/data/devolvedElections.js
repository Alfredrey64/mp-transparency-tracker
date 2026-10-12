// Every election to the Scottish Parliament, the Senedd (until 2020 the National Assembly for Wales) and the Northern Ireland Assembly since each
// body began, with seats by party, turnout and who led the government afterwards.
//
// Seats and turnout are as published on each election's own results page (Wikipedia, which in turn cites the Electoral Commission and the
// parliaments), checked so that every election's seats add up to the size of the chamber. Turnout is for the constituency vote where there are two votes
// (Scotland, Wales to 2021) and the sources differ by a few tenths in places. `parties` is listed left to right as drawn on the seat chart.

const P = {
  // Scotland
  grn: { label: "Green", colour: "#78b82a" },
  ssp: { label: "Scottish Socialist", colour: "#B5383C" },
  lab: { label: "Labour", colour: "#d50000" },
  snp: { label: "SNP", colour: "#d9b900" },
  ld: { label: "Liberal Democrat", short: "Lib Dem", colour: "#fc7d0b" },
  ind: { label: "Independent", short: "Ind", colour: "#9a9aa6" },
  oth: { label: "Others", colour: "#c7c7d0" },
  con: { label: "Conservative", short: "Con", colour: "#0063ba" },
  ref: { label: "Reform UK", short: "Reform", colour: "#12b6cf" },
  // Wales
  pc: { label: "Plaid Cymru", short: "Plaid", colour: "#348837" },
  ukip: { label: "UKIP", colour: "#7B4FA0" },
  jmip: { label: "John Marek Independent", short: "Marek", colour: "#8A8A96" },
  // Northern Ireland
  sf: { label: "Sinn Féin", colour: "#02665f" },
  sdlp: { label: "SDLP", colour: "#4ea268" },
  pbp: { label: "People Before Profit", short: "PBP", colour: "#B03A6A" },
  niwc: { label: "NI Women's Coalition", short: "NIWC", colour: "#C2478A" },
  all: { label: "Alliance", colour: "#cdaf2d" },
  uup: { label: "Ulster Unionist", short: "UUP", colour: "#6ba3d6" },
  dup: { label: "DUP", colour: "#d46a4c" },
  tuv: { label: "TUV", colour: "#0c3a6a" },
  pup: { label: "Progressive Unionist", short: "PUP", colour: "#6a4c93" },
  ukup: { label: "UK Unionist", short: "UKUP", colour: "#8a6bbf" },
  iu: { label: "Independent Unionist", short: "Ind Unionist", colour: "#a99bc7" },
};

export const PARTIES = P;

export const NATIONS = [
  {
    key: "scotland",
    name: "Scotland",
    body: "Scottish Parliament",
    colour: "#2F6DB5",
    seats: 129,
    system: "Each voter has two votes. One picks a local MSP in each of 73 constituencies, won by the most votes. The other picks a party in one of 8 regions, and 56 extra seats are shared out so that each party's total is closer to its share of the regional vote. This is called the additional member system.",
    parties: ["grn", "ssp", "lab", "snp", "ld", "ind", "oth", "con", "ref"],
    elections: [
      { id: "1999", date: "1999-05-06", turnout: 58.4, seats: { lab: 56, snp: 35, con: 18, ld: 17, grn: 1, ssp: 1, ind: 1 }, led: "Donald Dewar (Labour), in coalition with the Liberal Democrats" },
      { id: "2003", date: "2003-05-01", turnout: 49.7, seats: { lab: 50, snp: 27, con: 18, ld: 17, grn: 7, ssp: 6, ind: 3, oth: 1 }, led: "Jack McConnell (Labour), in coalition with the Liberal Democrats" },
      { id: "2007", date: "2007-05-03", turnout: 51.7, seats: { snp: 47, lab: 46, con: 17, ld: 16, grn: 2, ind: 1 }, led: "Alex Salmond (SNP), a minority government" },
      { id: "2011", date: "2011-05-05", turnout: 50.4, seats: { snp: 69, lab: 37, con: 15, ld: 5, grn: 2, ind: 1 }, led: "Alex Salmond (SNP), the first majority government at Holyrood" },
      { id: "2016", date: "2016-05-05", turnout: 55.8, seats: { snp: 63, con: 31, lab: 24, grn: 6, ld: 5 }, led: "Nicola Sturgeon (SNP), a minority government" },
      { id: "2021", date: "2021-05-06", turnout: 63.5, seats: { snp: 64, con: 31, lab: 22, grn: 8, ld: 4 }, led: "Nicola Sturgeon (SNP), later joined by the Greens as junior ministers" },
      { id: "2026", date: "2026-05-07", turnout: 53.4, seats: { snp: 58, lab: 17, ref: 17, grn: 15, con: 12, ld: 10 }, led: "John Swinney (SNP), seven seats short of a majority" },
    ],
  },
  {
    key: "wales",
    name: "Wales",
    body: "Senedd",
    colour: "#2E8B57",
    seats: 60,
    system: "Until 2021 the Senedd had 60 members under the additional member system: 40 constituency members and 20 regional members who made the result fairer to the parties. From 2026 it has 96 members elected in 16 areas that each choose six, by voting for a party's list. Seats go to parties in proportion to their votes, using the D'Hondt method.",
    parties: ["grn", "pc", "lab", "ld", "jmip", "ind", "con", "ukip", "ref"],
    elections: [
      { id: "1999", date: "1999-05-06", turnout: 46.3, seats: { lab: 28, pc: 17, con: 9, ld: 6 }, led: "Labour: Alun Michael, then Rhodri Morgan from 2000, with the Liberal Democrats from that year" },
      { id: "2003", date: "2003-05-01", turnout: 38.2, seats: { lab: 30, pc: 12, con: 11, ld: 6, jmip: 1 }, led: "Rhodri Morgan (Labour), one seat short of a majority" },
      { id: "2007", date: "2007-05-03", turnout: 43.7, seats: { lab: 26, pc: 15, con: 12, ld: 6, ind: 1 }, led: "Rhodri Morgan (Labour), in coalition with Plaid Cymru" },
      { id: "2011", date: "2011-05-05", turnout: 42.2, seats: { lab: 30, con: 14, pc: 11, ld: 5 }, led: "Carwyn Jones (Labour), with exactly half the seats" },
      { id: "2016", date: "2016-05-05", turnout: 45.3, seats: { lab: 29, pc: 12, con: 11, ukip: 7, ld: 1 }, led: "Carwyn Jones (Labour), two seats short of a majority" },
      { id: "2021", date: "2021-05-06", turnout: 46.6, seats: { lab: 30, con: 16, pc: 13, ld: 1 }, led: "Mark Drakeford (Labour), with exactly half the seats", total: 60 },
      { id: "2026", date: "2026-05-07", turnout: 51.6, seats: { pc: 43, ref: 34, lab: 9, con: 7, grn: 2, ld: 1 }, led: "Rhun ap Iorwerth (Plaid Cymru)", total: 96, newSystem: true },
    ],
  },
  {
    key: "ni",
    name: "Northern Ireland",
    body: "Northern Ireland Assembly",
    colour: "#B5651D",
    seats: 108,
    system: "Voters rank candidates in order of preference, and each of 18 areas elects several members (six until 2017, five since). This is the single transferable vote. Government is shared: the First Minister and deputy First Minister hold equal office, and the main parties from the unionist and nationalist communities must both take part for the Executive to work.",
    parties: ["sf", "sdlp", "pbp", "niwc", "grn", "all", "ind", "uup", "dup", "tuv", "pup", "ukup", "iu"],
    elections: [
      { id: "1998", date: "1998-06-25", turnout: 69.8, seats: { uup: 28, sdlp: 24, dup: 20, sf: 18, all: 6, ukup: 5, iu: 3, pup: 2, niwc: 2 }, led: "David Trimble (UUP) and Seamus Mallon (SDLP)" },
      { id: "2003", date: "2003-11-26", turnout: 63.1, seats: { dup: 30, uup: 27, sf: 24, sdlp: 18, all: 6, pup: 1, ukup: 1, ind: 1 }, led: "The Assembly was suspended from 2002 to 2007, so no one held office" },
      { id: "2007", date: "2007-03-07", turnout: 62.3, seats: { dup: 36, sf: 28, uup: 18, sdlp: 16, all: 7, grn: 1, pup: 1, ind: 1 }, led: "Ian Paisley (DUP) and Martin McGuinness (Sinn Féin)" },
      { id: "2011", date: "2011-05-05", turnout: 55.7, seats: { dup: 38, sf: 29, uup: 16, sdlp: 14, all: 8, grn: 1, tuv: 1, ind: 1 }, led: "Peter Robinson (DUP) and Martin McGuinness (Sinn Féin)" },
      { id: "2016", date: "2016-05-05", turnout: 54.9, seats: { dup: 38, sf: 28, uup: 16, sdlp: 12, all: 8, grn: 2, pbp: 2, tuv: 1, ind: 1 }, led: "Arlene Foster (DUP) and Martin McGuinness (Sinn Féin)" },
      { id: "2017", date: "2017-03-02", turnout: 64.8, seats: { dup: 28, sf: 27, sdlp: 12, uup: 10, all: 8, grn: 2, pbp: 1, tuv: 1, ind: 1 }, led: "No Executive until January 2020, when Arlene Foster and Michelle O'Neill took office", total: 90 },
      { id: "2022", date: "2022-05-05", turnout: 63.6, seats: { sf: 27, dup: 25, all: 17, uup: 9, sdlp: 8, tuv: 1, pbp: 1, ind: 2 }, led: "No Executive until February 2024, when Michelle O'Neill (Sinn Féin) and Emma Little-Pengelly (DUP) took office", total: 90, note: "Sinn Féin became the largest party for the first time." },
    ],
  },
];

export const electionSeats = (e) => Object.values(e.seats).reduce((n, v) => n + v, 0);

// The size of the chamber, the largest party and whether it had a majority, for one election.
export function devolvedFacts(nation, e) {
  const total = e.total ?? nation.seats;
  const [leader, leaderSeats] = Object.entries(e.seats).sort((a, b) => b[1] - a[1])[0];
  const needed = Math.floor(total / 2) + 1;
  return { total, leader, leaderSeats, needed, majority: leaderSeats >= needed, shortBy: needed - leaderSeats };
}
