// The hexagon map of all 650 seats: where each hexagon sits, which MP and
// result belongs to it, and what colour each view paints it. Pure and
// tested; the drawing is in components/SeatMap.jsx.

// "Ashton-under-Lyne" and "Ashton under Lyne" are the same seat: compare
// names with punctuation and case taken out.
export const normSeat = (name) => String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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

// hexes: [[code, name, q, r, region]]; seats: { [name]: seat from constituencies.json };
// mps: [{ id, name, party, party_colour, constituency, gender, thumbnail_url }]
export function buildCells(hexes, seats, mps, size = 1) {
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
      mp: mp ? { id: mp.id, name: mp.name, party: mp.party, colour: mp.party_colour, gender: mp.gender, thumbnail: mp.thumbnail_url } : null,
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
