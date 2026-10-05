// "What this means" sentences for the money charts: how concentrated giving
// is. Neutral markers; concentration says how the money is spread, not
// whether anything is wrong. Pure and tested.

const pct0 = (n) => `${Math.round(n)}%`;
const fmt = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

// The biggest few donors' share of everything declared.
export function concentrationMeaning({ top, total, count }) {
  if (!top?.length || !total) return null;
  const sum = top.reduce((n, v) => n + v, 0);
  const share = (sum / total) * 100;
  const marker = share >= 50 ? "Heavily concentrated" : share >= 25 ? "Fairly concentrated" : "Widely spread";
  return {
    marker,
    tone: "mid",
    text: `The ${count} biggest donors account for ${pct0(share)} of the ${fmt(total)} declared, so ${share >= 50 ? "a few givers make up most of it" : share >= 25 ? "a handful of givers make up a large part of it" : "no small group dominates"}.`,
  };
}

// The biggest party's share of everything given to parties.
export function partyConcentrationMeaning({ parties }) {
  if (!parties?.length) return null;
  const total = parties.reduce((n, p) => n + p.total, 0);
  if (!total) return null;
  const top = parties[0];
  const topTwo = parties.slice(0, 2).reduce((n, p) => n + p.total, 0);
  const share = (top.total / total) * 100;
  const marker = share >= 40 ? "Heavily concentrated" : share >= 25 ? "Fairly concentrated" : "Widely spread";
  return {
    marker,
    tone: "mid",
    text: `${top.name} received ${pct0(share)} of the ${fmt(total)} given to parties, and the top two together ${pct0((topTwo / total) * 100)}.`,
  };
}
