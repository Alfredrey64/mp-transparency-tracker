// The hexagon map of all 650 seats: where each hexagon sits, which MP and
// result belongs to it, and what colour each view paints it. Pure and
// tested; the drawing is in components/SeatMap.jsx.

// "Ashton-under-Lyne" and "Ashton under Lyne" are the same seat: compare
// names with punctuation and case taken out.
export const normSeat = (name) => String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// How far in the map zooms: each step is a bigger share of the picture.
export const ZOOMS = [1, 1.6, 2.4, 3.6];

const SQRT3 = Math.sqrt(3);

// Pointy-topped hexagons in rows, every other row shifted half a hexagon
// right ("odd-r"). The layout numbers run south to north, so y is flipped to
// put Scotland at the top. `size` is the distance from a hexagon's centre
// to a corner.
export function hexPosition(q, r, size = 1) {
  const odd = ((r % 2) + 2) % 2;
  return { x: size * SQRT3 * (q + 0.5 * odd), y: -size * 1.5 * r };
}

// The six corners of a hexagon centred on (cx, cy), as an SVG points string.
export function hexPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + size * Math.cos(a)).toFixed(2)},${(cy + size * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export function lerpColour(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  const mix = (x, y) => Math.round(x + (y - x) * k).toString(16).padStart(2, "0");
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
}

// The regions the layout files seats under, by ONS code.
export const REGIONS = {
  E12000001: "North East",
  E12000002: "North West",
  E12000003: "Yorkshire and the Humber",
  E12000004: "East Midlands",
  E12000005: "West Midlands",
  E12000006: "East of England",
  E12000007: "London",
  E12000008: "South East",
  E12000009: "South West",
  W92000004: "Wales",
  S92000003: "Scotland",
  N92000002: "Northern Ireland",
};
export const regionName = (code) => REGIONS[code] ?? "Unknown";

// hexes: [[code, name, q, r, region]]; seats: { [name]: seat from constituencies.json };
// mps: [{ id, name, party, party_colour, constituency, gender, thumbnail_url, parliament_member_id }]
// extras.careers: { [memberId]: compact career row }, for how long each MP has served.
export function buildCells(hexes, seats, mps, size = 1, extras = {}) {
  const seatByNorm = new Map(Object.entries(seats ?? {}).map(([name, s]) => [normSeat(name), s]));
  const mpByNorm = new Map((mps ?? []).filter((m) => m.constituency).map((m) => [normSeat(m.constituency), m]));
  return hexes.map(([code, name, q, r, region]) => {
    const key = normSeat(name);
    const seat = seatByNorm.get(key) ?? null;
    const mp = mpByNorm.get(key) ?? null;
    const winner = seat?.result?.candidates?.[0] ?? null;
    return {
      code, name, region, ...hexPosition(q, r, size), q, r,
      seatName: seat?.name ?? name,
      mp: mp
        ? {
            id: mp.id,
            memberId: mp.parliament_member_id ?? null,
            name: mp.name,
            party: mp.party,
            colour: mp.party_colour,
            gender: mp.gender,
            thumbnail: mp.thumbnail_url,
            first: extras.careers?.[mp.parliament_member_id]?.[0] ?? null,
            elected: extras.careers?.[mp.parliament_member_id]?.[1] ?? null,
            govPosts: extras.careers?.[mp.parliament_member_id]?.[2] ?? null,
            rebelPct: extras.rebels?.get(mp.id)?.pct ?? null,
          }
        : null,
      petitions: (seat?.petitions ?? []).reduce((n, p) => n + (p.count ?? 0), 0),
      result: seat?.result
        ? {
            majorityPct: seat.result.majorityPct,
            majority: seat.result.majority,
            turnoutPct: seat.result.turnoutPct,
            gain: Boolean(seat.result.isGeneralElection && /gain/i.test(seat.result.outcome ?? "")),
            outcome: seat.result.outcome ?? null,
            winnerParty: winner?.party ?? null,
            winnerColour: winner?.colour ?? null,
          }
        : null,
    };
  });
}

export function boundsOf(cells, size = 1) {
  if (!cells.length) return { minX: 0, minY: 0, width: 1, height: 1 };
  const pad = size * 1.1;
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return { minX, minY, width: Math.max(...xs) + pad - minX, height: Math.max(...ys) + pad - minY };
}

const MUTED = "#5b6075";
const hexColour = (c) => (c ? (String(c).startsWith("#") ? c : `#${c}`) : null);

// Each view: a label, what it shows, the colour of every seat, and a legend.
// A seat with no data in a view is MUTED.
export const MODES = [
  {
    key: "party",
    label: "Party now",
    blurb: "The party of each seat's MP today, which includes by-election winners and MPs who have changed party.",
    colour: (c) => hexColour(c.mp?.colour) ?? MUTED,
    legend: null,
  },
  {
    key: "safety",
    label: "How safe",
    blurb: "The winner's lead over the runner-up at the 2024 election, as a share of votes cast. Pale seats are the marginals that could change hands.",
    colour: (c) => (c.result?.majorityPct == null ? MUTED : lerpColour("#E5E3FF", "#2A1F8F", c.result.majorityPct / 45)),
    legend: { type: "ramp", from: "#E5E3FF", to: "#2A1F8F", left: "Marginal", right: "Very safe (45%+ lead)" },
  },
  {
    key: "gains",
    label: "Changed hands",
    blurb: "Seats a different party won at the 2024 general election, in the new winner's colour. Seats that held are dimmed.",
    colour: (c) => (c.result?.gain ? hexColour(c.result.winnerColour) ?? "#9aa0b4" : lerpColour(MUTED, "#1b1d2a", 0.55)),
    legend: { type: "note", text: "Bright = changed hands in 2024 · dim = held" },
  },
  {
    key: "turnout",
    label: "Turnout",
    blurb: "The share of registered voters who voted at the 2024 election. Darker is higher.",
    colour: (c) => (c.result?.turnoutPct == null ? MUTED : lerpColour("#D9F3EA", "#0C6B4C", (c.result.turnoutPct - 40) / 40)),
    legend: { type: "ramp", from: "#D9F3EA", to: "#0C6B4C", left: "40% or less", right: "80%+" },
  },
  {
    key: "women",
    label: "Women MPs",
    blurb: "Seats whose MP is a woman.",
    colour: (c) => (c.mp?.gender === "F" ? "#E0367A" : lerpColour(MUTED, "#1b1d2a", 0.45)),
    legend: { type: "note", text: "Pink = a woman MP · grey = a man" },
  },
  {
    key: "time",
    label: "Time as MP",
    blurb: "How long each seat's MP has been in the Commons. Darker is longer. Some MPs have had breaks in service.",
    colour: (c) => (c.mp?.first == null ? MUTED : lerpColour("#FFE8C2", "#8A3B00", (new Date().getFullYear() - c.mp.first) / 35)),
    legend: { type: "ramp", from: "#FFE8C2", to: "#8A3B00", left: "Just arrived", right: "35+ years" },
  },
  {
    key: "newmps",
    label: "New MPs",
    blurb: "Seats whose MP was first elected in 2024 or later, at the general election or a by-election.",
    colour: (c) => (c.mp?.first != null && c.mp.first >= 2024 ? "#1FA97C" : lerpColour(MUTED, "#1b1d2a", 0.5)),
    legend: { type: "note", text: "Green = first elected in 2024 or since · grey = longer-serving" },
  },
  {
    key: "petitions",
    label: "Petitions",
    blurb: "Signatures from the seat on its three most-signed petitions. Darker means more people signing.",
    colour: (c) => (c.petitions ? lerpColour("#E8F0FF", "#1F4FB0", (Math.sqrt(c.petitions) - Math.sqrt(300)) / (Math.sqrt(3000) - Math.sqrt(300))) : MUTED),
    legend: { type: "ramp", from: "#E8F0FF", to: "#1F4FB0", left: "Under 300", right: "3,000+" },
  },
  {
    key: "rebels",
    label: "Rebel rate",
    blurb: "How often the seat's MP has voted against the majority of their own party. Darker is more often. MPs with fewer than ten recorded votes, and independents, are grey.",
    needsVotes: true,
    colour: (c) => (c.mp?.rebelPct == null ? MUTED : lerpColour("#FFE0E6", "#A01C3A", c.mp.rebelPct / 15)),
    legend: { type: "ramp", from: "#FFE0E6", to: "#A01C3A", left: "Never", right: "15% of votes or more" },
  },
];

// Legend entries for the party view: parties by seat count, biggest first.
export function partyKey(cells, limit = 8) {
  const m = new Map();
  for (const c of cells) {
    const party = c.mp?.party ?? "Unknown";
    const colour = hexColour(c.mp?.colour) ?? MUTED;
    if (!m.has(party)) m.set(party, { party, colour, count: 0 });
    m.get(party).count += 1;
  }
  return [...m.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

// A region's seats at a glance: who holds them, how many are marginal, how
// many changed hands, and the average turnout. code === null means the whole UK.
export function summariseRegion(cells, code) {
  const list = code ? cells.filter((c) => c.region === code) : cells;
  const parties = new Map();
  let women = 0;
  let marginal = 0;
  let gains = 0;
  const turnouts = [];
  const leads = [];
  for (const c of list) {
    const party = c.mp?.party ?? "Unknown";
    if (!parties.has(party)) parties.set(party, { party, colour: hexColour(c.mp?.colour) ?? MUTED, count: 0 });
    parties.get(party).count += 1;
    if (c.mp?.gender === "F") women += 1;
    if (c.result?.majorityPct != null) {
      leads.push(c.result.majorityPct);
      if (c.result.majorityPct < 5) marginal += 1;
    }
    if (c.result?.gain) gains += 1;
    if (c.result?.turnoutPct != null) turnouts.push(c.result.turnoutPct);
  }
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  return {
    seats: list.length,
    parties: [...parties.values()].sort((a, b) => b.count - a.count),
    women,
    marginal,
    gains,
    avgTurnout: avg(turnouts),
    avgLead: avg(leads),
  };
}

// The seats touching this one: hexagons whose centres are one step away.
export function neighbours(cells, cell, size = 1) {
  const reach = Math.sqrt(3) * size * 1.06;
  return cells
    .filter((c) => c !== cell && Math.hypot(c.x - cell.x, c.y - cell.y) <= reach)
    .sort((a, b) => Math.atan2(a.y - cell.y, a.x - cell.x) - Math.atan2(b.y - cell.y, b.x - cell.x));
}

// Where a seat stands among all of them: 1 = closest result / highest turnout.
export function seatRanks(cells, cell) {
  const rank = (get, ascending) => {
    const mine = get(cell);
    if (mine == null) return null;
    const all = cells.map(get).filter((v) => v != null);
    return { rank: all.filter((v) => (ascending ? v < mine : v > mine)).length + 1, of: all.length };
  };
  return {
    closest: rank((c) => c.result?.majorityPct, true),
    turnout: rank((c) => c.result?.turnoutPct, false),
    serving: rank((c) => (c.mp?.first == null ? null : -c.mp.first), false),
  };
}
