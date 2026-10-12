// Comparing two elections seat by seat on the 2010 map: which seats changed hands, where they went, and how far the vote swung between Labour and the
// Conservatives. A seat only counts if a seat of the same name was fought at both elections. The swing is the usual two-party swing: half the change
// in the gap between Labour's share and the Conservatives', so a positive number is a swing to Labour.

import { groupOf2024 } from "./electionHistory";
import { norm } from "./seatNames";

const bag = (s) => norm(s).split(" ").sort().join(" ");

// The 2024 result on the 2010 map's hexagons, matched by seat name: winner letters, and Labour's lead over the Conservatives in points.
export function layout2024(hexes, constituencies) {
  const byNorm = new Map();
  const byBag = new Map();
  for (const s of Object.values(constituencies)) { byNorm.set(norm(s.name), s); byBag.set(bag(s.name), s); }
  const w = [];
  const d = [];
  hexes.forEach(([, name]) => {
    const s = byNorm.get(norm(name)) ?? byBag.get(bag(name));
    const r = s?.result;
    if (!s || !r?.candidates?.length || r.isGeneralElection === false) { w.push("."); d.push(null); return; }
    const share = (p) => (r.candidates.find((c) => c.party === p)?.share ?? 0) * 100;
    w.push(groupOf2024(r.candidates[0].party));
    d.push(Math.round(share("Labour") - share("Conservative")));
  });
  return { w: w.join(""), d };
}

// a and b are { w: string of winner letters ("." for none), d: array of Labour minus Conservative points (or null) } for each election.
export function compare(a, b) {
  const changed = [];
  const flows = {};
  let both = 0;
  const swings = [];
  for (let i = 0; i < a.w.length; i++) {
    if (a.w[i] === "." || b.w[i] === ".") continue;
    both += 1;
    const swing = a.d[i] != null && b.d[i] != null ? (b.d[i] - a.d[i]) / 2 : null;
    if (swing != null) swings.push({ i, swing });
    if (a.w[i] !== b.w[i]) {
      changed.push({ i, from: a.w[i], to: b.w[i], swing });
      const key = `${a.w[i]}${b.w[i]}`;
      flows[key] = (flows[key] ?? 0) + 1;
    }
  }
  const topFlows = Object.entries(flows).map(([k, n]) => ({ from: k[0], to: k[1], n })).sort((x, y) => y.n - x.n);
  const sorted = [...swings].sort((x, y) => y.swing - x.swing);
  return {
    both,
    changed,
    unchanged: both - changed.length,
    flows: topFlows,
    toLabour: sorted.filter((s) => s.swing > 0).slice(0, 5),
    toConservative: sorted.filter((s) => s.swing < 0).slice(-5).reverse(),
    meanSwing: swings.length ? swings.reduce((n, s) => n + s.swing, 0) / swings.length : null,
    swingBySeat: new Map(swings.map((s) => [s.i, s.swing])),
  };
}
