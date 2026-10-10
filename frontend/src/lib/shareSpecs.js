// What goes on each share card, as plain data. The drawing is in
// shareCard.js; keeping the content here means it can be tested without a
// canvas. A card is 1200 x 630 and holds a kicker, a title, a subtitle, up to
// four big figures, up to six bars and/or a hexagon map, and a footer.

const colour = (c, fallback = "#8A8FA8") => (c ? (String(c).startsWith("#") ? c : `#${c}`) : fallback);
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const CARD_SITE = "Simple Politics";

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

// A council: who runs it, how many councillors, and seats by party.
export function councilShareSpec({ council, seats, link }) {
  const top = seats[0];
  const max = Math.max(1, ...seats.slice(0, 6).map((p) => p.count));
  const next = council.next?.[0]?.[0];
  return {
    kicker: "Local council",
    title: council.name,
    subtitle: `Run by: ${council.control}`,
    accent: colour(top?.colour, "#4F46E5"),
    stats: [
      { value: fmt(council.total), label: "councillors" },
      next ? { value: next.slice(0, 4), label: "next election" } : null,
    ].filter(Boolean),
    bars: seats.slice(0, 6).map((p) => ({ label: p.short, valueText: `${fmt(p.count)} · ${pct1(p.pct)}`, fraction: p.count / max, colour: colour(p.colour) })),
    footer: `${CARD_SITE} · local councils`,
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

// "What if the vote moved?": a swing between two parties and the seats it would change.
export function swingShareSpec({ from, to, points, flips, fromTotal, toTotal, fromColour, toColour, link }) {
  const top = flips.slice(0, 6);
  const maxMaj = Math.max(1, ...top.map((r) => r.majority));
  return {
    kicker: "What if voters changed their minds?",
    title: `If ${(Math.round(points * 10) / 10).toFixed(1)} in every 100 voters moved from ${from} to ${to}`,
    subtitle: `${flips.length} ${flips.length === 1 ? "seat" : "seats"} would change hands, using the 2024 results`,
    accent: colour(toColour),
    stats: [
      { value: String(flips.length), label: flips.length === 1 ? "seat changes hands" : "seats change hands" },
      { value: `${fromTotal - flips.length}`, label: `${from} (from ${fromTotal})` },
      { value: `${toTotal + flips.length}`, label: `${to} (from ${toTotal})` },
    ],
    bars: top.map((r) => ({ label: r.name, valueText: `${Math.floor(r.majority / 2) + 1} voters`, fraction: Math.max(0.05, r.majority / maxMaj), colour: colour(fromColour) })),
    note: "The seats that need the fewest voters to switch, shown first. A rough guide, not a forecast.",
    footer: `${CARD_SITE} · marginal seats and swing`,
    link,
  };
}

// Two seats side by side: the leads and turnouts, and each seat's top three parties.
export function compareSeatsShareSpec({ a, b, link }) {
  const bars = (r) => (r.result?.candidates ?? []).slice(0, 3).map((c) => ({ label: `${r.name}: ${c.party}`, valueText: pct1((c.share ?? 0) * 100), fraction: c.share ?? 0, colour: colour(c.colour) }));
  return {
    kicker: "Constituency comparison",
    title: `${a.name} and ${b.name}`,
    subtitle: a.mp.party === b.mp.party ? `Both held by ${a.mp.party}` : `${a.mp.party} and ${b.mp.party}`,
    accent: colour(a.mp.colour),
    stats: [
      { value: pct1(a.result?.majorityPct ?? 0), label: `${a.name}: winner's lead` },
      { value: pct1(b.result?.majorityPct ?? 0), label: `${b.name}: winner's lead` },
      { value: pct1(a.result?.turnoutPct ?? 0), label: `${a.name}: turnout` },
      { value: pct1(b.result?.turnoutPct ?? 0), label: `${b.name}: turnout` },
    ],
    bars: [...bars(a), ...bars(b)],
    footer: `${CARD_SITE} · 2024 general election results`,
    link,
  };
}

// Any page with nothing special to show: its name and what it is about.
export function pageShareSpec({ kicker, title, subtitle, accent, link }) {
  return { kicker: kicker || "Simple Politics", title, subtitle: subtitle ?? "", accent: colour(accent, "#4F46E5"), stats: [], footer: CARD_SITE, link };
}

// A Britain in numbers page: its headline figures and the history of the main one.
// tiles: [{ value, label, when }]; line: { points: [[x, y]], label, firstLabel, lastLabel, firstText, lastText }.
export function sectorShareSpec({ title, subtitle, accent, tiles, line, newest, link }) {
  return {
    kicker: "Britain in numbers",
    title,
    subtitle: subtitle ?? "",
    accent: colour(accent, "#4F46E5"),
    stats: (tiles ?? []).slice(0, 4).map((t) => ({ value: t.value, label: t.label })),
    line,
    footer: `${CARD_SITE} · Britain in numbers${newest ? ` · official statistics, updated ${newest}` : ""}`,
    link,
  };
}

// A league of places or areas: the top few as bars.
export function rankingShareSpec({ kicker, title, subtitle, accent, rows, note, footer, link }) {
  const max = Math.max(1e-9, ...rows.map((r) => r.fraction ?? 0));
  return {
    kicker, title, subtitle: subtitle ?? "", accent: colour(accent, "#4F46E5"),
    bars: rows.slice(0, 6).map((r) => ({ label: r.label, valueText: r.valueText, fraction: (r.fraction ?? 0) / max, colour: colour(r.colour ?? accent) })),
    note: note ?? null,
    footer: footer ?? CARD_SITE,
    link,
  };
}
