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
