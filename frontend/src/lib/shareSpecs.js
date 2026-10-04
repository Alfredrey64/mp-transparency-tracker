// What goes on each share card, as plain data. The drawing is in
// shareCard.js; keeping the content here means it can be tested without a
// canvas. A card is 1200 x 630 and holds a kicker, a title, a subtitle, up to
// four big figures, up to six bars and/or a hexagon map, and a footer.

const colour = (c, fallback = "#8A8FA8") => (c ? (String(c).startsWith("#") ? c : `#${c}`) : fallback);
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const CARD_SITE = "UK Parliament Tracker";

// An MP: who they are, how long, and what they have declared.
// career: the compact row from mpCareers.json (or undefined).
export function mpShareSpec({ politician, career, interestCount = 0, totalDeclared = 0, link }) {
  const stats = [];
  if (Array.isArray(career) && career[0] != null) {
    stats.push({ value: String(career[0]), label: "first elected" });
    if (career[1]) stats.push({ value: String(career[1]), label: career[1] === 1 ? "election won" : "elections won" });
    if (career[2] > 0) stats.push({ value: String(career[2]), label: career[2] === 1 ? "government post" : "government posts" });
  }
  if (interestCount > 0) stats.push({ value: String(interestCount), label: interestCount === 1 ? "declared interest" : "declared interests" });
  return {
    kicker: "MP",
    title: politician.name,
    subtitle: [politician.party, politician.constituency].filter(Boolean).join(" · "),
    accent: colour(politician.party_colour),
    stats: stats.slice(0, 4),
    note: totalDeclared > 0 ? `${interestCount ? plural(interestCount, "declared interest", "declared interests") : "Declared interests"} with a stated value total £${fmt(totalDeclared)}.` : null,
    footer: CARD_SITE,
    link,
  };
}

// A seat's 2024 result: who won, by how much, and the top candidates' shares.
export function seatShareSpec({ name, mp, result, link }) {
  const candidates = (result?.candidates ?? []).slice(0, 5);
  return {
    kicker: "Constituency",
    title: name,
    subtitle: mp ? `${mp.name} · ${mp.party}` : "2024 general election",
    accent: colour(mp?.colour ?? candidates[0]?.colour),
    stats: [
      result?.majorityPct != null ? { value: pct1(result.majorityPct), label: "winner's lead" } : null,
      result?.turnoutPct != null ? { value: pct1(result.turnoutPct), label: "turnout" } : null,
      result?.majority != null ? { value: fmt(result.majority), label: "majority (votes)" } : null,
    ].filter(Boolean),
    bars: candidates.map((c) => ({ label: c.name ? `${c.name}, ${c.party}` : c.party, valueText: pct1((c.share ?? 0) * 100), fraction: c.share ?? 0, colour: colour(c.colour) })),
    footer: `${CARD_SITE} · 2024 general election result`,
    link,
  };
}

// A chamber: seats by party. stats is the output of computeParliamentStats or
// computeLordsStats (both have total, seatsByParty and women/womenPct).
export function chamberShareSpec({ house, stats, link }) {
  const rows = stats.seatsByParty.slice(0, 6);
  const top = rows[0];
  return {
    kicker: house === "lords" ? "House of Lords" : "House of Commons",
    title: house === "lords" ? `${fmt(stats.total)} peers, and no party in control` : `${fmt(stats.total)} MPs, seat by seat`,
    subtitle: top ? `${top.party} is the largest group with ${fmt(top.count)} seats (${pct1(top.pct)})` : "",
    accent: colour(top?.colour, "#4F46E5"),
    stats: [{ value: pct1(stats.womenPct), label: "are women" }, { value: fmt(stats.majorityLine ?? Math.floor(stats.total / 2) + 1), label: "seats for a majority" }],
    bars: rows.map((r) => ({ label: r.party, valueText: `${fmt(r.count)} · ${pct1(r.pct)}`, fraction: stats.total ? r.count / (top?.count || 1) : 0, colour: colour(r.colour) })),
    footer: `${CARD_SITE} · Parliament in Numbers`,
    link,
  };
}

// The Rebels page: the MPs who vote against their party most.
export function rebelsShareSpec({ r, link }) {
  const top = r.byMp.slice(0, 6);
  const max = Math.max(1, ...top.map((m) => m.pct));
  return {
    kicker: "Rebels",
    title: "Who votes against their own party",
    subtitle: `${fmt(r.rebelVotes)} of ${fmt(r.countedVotes)} recorded votes (${pct1(r.rebelPct)}) went against the party majority`,
    accent: "#C2415D",
    stats: [{ value: fmt(r.mpsWhoRebelled), label: "MPs have rebelled" }, { value: fmt(r.divisionsWithRebels), label: "votes had a rebel" }],
    bars: top.map((m) => ({ label: m.politician.name, valueText: pct1(m.pct), fraction: m.pct / max, colour: colour(m.politician.party_colour) })),
    footer: `${CARD_SITE} · votes against the party majority, a proxy for rebellion`,
    link,
  };
}

// The seat map: the hexagons as drawn, in the colours of the chosen view.
export function mapShareSpec({ cells, mode, key, link }) {
  return {
    kicker: "Seat map",
    title: "Every seat in the Commons",
    subtitle: mode.label,
    accent: "#4F46E5",
    hexes: cells.map((c) => ({ x: c.x, y: c.y, colour: mode.colour(c) })),
    legend: (key ?? []).slice(0, 6).map((k) => ({ label: `${k.party} ${k.count}`, colour: k.colour })),
    note: mode.legend?.type === "ramp" ? `${mode.legend.left} to ${mode.legend.right}` : mode.legend?.text ?? null,
    footer: `${CARD_SITE} · one hexagon for each of the 650 seats`,
    link,
  };
}

// Splits text into at most maxLines lines no wider than maxWidth, ending the
// last line with an ellipsis if the text didn't all fit. `measure` returns the
// width of a string, so this works with a canvas or with a stand-in.
export function wrapLines(text, measure, maxWidth, maxLines) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (measure(next) <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) {
        line = "";
        words.length = i;
        break;
      }
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  const used = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (used < String(text ?? "").split(/\s+/).filter(Boolean).length && lines.length) {
    let last = lines[lines.length - 1];
    while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}
