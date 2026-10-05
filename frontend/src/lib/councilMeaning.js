// The "what this means" sentences on a council page. Neutral markers; they
// say where seats sit, not whether that is good or bad. Pure and tested.

const pct0 = (n) => `${Math.round(n)}%`;
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

// Who holds the seats: one party in control, or none.
export function councilMeaning({ seats, total, control }) {
  if (!seats?.length || !total) return null;
  const top = seats[0];
  const major = Math.floor(total / 2) + 1;
  if (top.count >= major) {
    const strong = top.count >= (total * 2) / 3;
    return {
      marker: strong ? "One party dominates" : "One party in control",
      tone: "mid",
      text: `${top.short} holds ${fmt(top.count)} of ${fmt(total)} seats (${pct0(top.pct)}), more than the ${fmt(major)} needed for a majority, so it can pass decisions without anyone else.`,
    };
  }
  const second = seats[1];
  return {
    marker: "No party in control",
    tone: "mid",
    text: `No party has the ${fmt(major)} seats needed for a majority. The largest, ${top.short}, holds ${fmt(top.count)} (${pct0(top.pct)})${second ? ` and ${second.short} ${fmt(second.count)}` : ""}, so the council is run by ${/partnership/i.test(control) ? "a partnership of parties" : "a minority or by deals between parties"}.`,
  };
}

const LABELS = { con: "Conservative", lab: "Labour", ld: "Liberal Democrat", green: "Green", ukip: "UKIP", ref: "Reform UK", pc: "Plaid Cymru", snp: "SNP", other: "other parties and independents" };

// How much the council's make-up has moved since the first year on record.
export function councilChangeMeaning({ rows }) {
  if (!rows || rows.length < 2) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const share = (r, k) => (r.total ? (r[k] / r.total) * 100 : 0);
  const keys = Object.keys(LABELS);
  const moves = keys.map((k) => ({ k, d: share(last, k) - share(first, k) }));
  const gain = [...moves].sort((a, b) => b.d - a.d)[0];
  const loss = [...moves].sort((a, b) => a.d - b.d)[0];
  const biggest = Math.max(Math.abs(gain.d), Math.abs(loss.d));
  const marker = biggest >= 25 ? "A big change" : biggest <= 8 ? "Little change" : "Some change";
  const seatsOf = (r, k) => `${fmt(r[k])} seat${r[k] === 1 ? "" : "s"}`;
  const parts = [];
  if (gain.d >= 5) parts.push(`${LABELS[gain.k]} has gone from ${seatsOf(first, gain.k)} in ${first.year} to ${fmt(last[gain.k])} in ${last.year}`);
  if (loss.d <= -5) parts.push(`${LABELS[loss.k]} has fallen from ${seatsOf(first, loss.k)} to ${fmt(last[loss.k])}`);
  return {
    marker,
    tone: "mid",
    text: parts.length ? `${parts.join(", while ")}. The size of a council can change when its boundaries are redrawn.` : `No party's share of seats has moved much since ${first.year}.`,
  };
}

// ---- National sentences ------------------------------------------------------

import { controlLabelOf } from "./councils";

// How the latest year's changes of control compare with earlier years.
export function changesMeaning({ changesByYear, summary }) {
  if (!summary?.total || !changesByYear?.length) return null;
  const latest = changesByYear[changesByYear.length - 1];
  const earlier = changesByYear.slice(0, -1);
  const max = earlier.length ? Math.max(...earlier.map((c) => c.count)) : 0;
  const rank = earlier.filter((c) => c.count > latest.count).length + 1;
  const marker = latest.count > max ? "The most on record" : rank <= 2 ? "One of the busiest years" : "A typical year";
  const top = summary.flows[0];
  // Parties first; "no overall control" is a state, not a party, so it gets its own sentence.
  const parties = summary.net.filter((r) => r.key !== "noc");
  const noc = summary.net.find((r) => r.key === "noc");
  const topNet = parties[0];
  const loser = parties[parties.length - 1];
  const minus = (n) => `−${fmt(Math.abs(n))}`;
  const text = [
    `${fmt(latest.count)} councils changed hands in ${latest.year}${latest.count > max ? `, more than in any other year since records here begin in ${changesByYear[0].year}` : ""}.`,
    top ? `The commonest move was ${controlLabelOf(top.from)} to ${controlLabelOf(top.to)} (${fmt(top.count)} councils).` : "",
    topNet && loser && topNet.net > 0 && loser.net < 0 ? `${controlLabelOf(topNet.key)} made the biggest net gain (+${fmt(topNet.net)}) and ${controlLabelOf(loser.key)} the biggest net loss (${minus(loser.net)}).` : "",
    noc && noc.net > 0 ? `${fmt(noc.net)} more councils now have no overall control.` : "",
  ].filter(Boolean).join(" ");
  return { marker, tone: "mid", text };
}

// How many councillors have switched, against how many there are.
export function defectionMeaning({ summary, councillors }) {
  if (!summary?.total || !councillors) return null;
  const share = (summary.total / councillors) * 100;
  const top = summary.flows[0];
  const marker = share >= 4 ? "A lot of movement" : share >= 1.5 ? "Some movement" : "Little movement";
  return {
    marker,
    tone: "mid",
    text: `${fmt(summary.total)} councillors (${share < 10 ? share.toFixed(1) : Math.round(share)}%) are in a different party from the one they were listed under in ${summary.since}.${top ? ` The commonest switch was ${top.fromParty.short} to ${top.toParty.short} (${fmt(top.count)}).` : ""} Many of these are councillors leaving a party to sit as independents.`,
  };
}

// How the pattern of control has shifted since the first year on record.
export function controlTrendMeaning({ trend }) {
  if (!trend || trend.length < 2) return null;
  const first = trend[0];
  const last = trend[trend.length - 1];
  const keys = Object.keys(first.counts);
  const moves = keys.map((k) => ({ k, d: last.counts[k] - first.counts[k] })).sort((a, b) => b.d - a.d);
  const gain = moves[0];
  const loss = moves[moves.length - 1];
  return {
    marker: Math.max(Math.abs(gain.d), Math.abs(loss.d)) >= 40 ? "A big shift" : "A gradual shift",
    tone: "mid",
    text: `Since ${first.year}, ${controlLabelOf(gain.k)} has gone from controlling ${fmt(first.counts[gain.k])} councils to ${fmt(last.counts[gain.k])}, while ${controlLabelOf(loss.k)} has gone from ${fmt(first.counts[loss.k])} to ${fmt(last.counts[loss.k])}.`,
  };
}
