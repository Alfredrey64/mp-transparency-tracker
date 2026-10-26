// What changed recently, as one feed: bills that moved, votes held, interests declared, petitions answered, conduct reports and by-elections. Each
// builder takes the rows the page fetched from the database and returns items { id, kind, date (ISO day), title, detail, href, external, colour }.
// Pure, so it can be tested without a database.

export const KINDS = {
  bill: { label: "Bills", colour: "#7A5AF0", verb: "Bill moved" },
  vote: { label: "Votes", colour: "#1E4FB8", verb: "Vote held" },
  money: { label: "Declared money", colour: "#E8741A", verb: "Interest declared" },
  petition: { label: "Petitions", colour: "#E0367A", verb: "Petition" },
  standards: { label: "Conduct", colour: "#C13A4E", verb: "Conduct report" },
  election: { label: "Elections", colour: "#1FA97C", verb: "By-election" },
};

export const dayOf = (value) => (value ? String(value).slice(0, 10) : null);

export function sinceDate(days, now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

export function billItems(rows, since) {
  return (rows ?? []).filter((b) => dayOf(b.last_updated) >= since && b.short_title).map((b) => ({
    id: `bill-${b.bill_id ?? b.short_title}`, kind: "bill", date: dayOf(b.last_updated), title: b.short_title,
    detail: b.is_act ? "Became law as an Act of Parliament." : b.is_defeated ? "Defeated." : `Now at ${b.current_stage ?? "a new stage"}${b.current_house ? ` in the ${b.current_house}` : ""}.`,
    href: b.source_url ?? "#/voting", external: Boolean(b.source_url),
  }));
}

// Votes come as one row per MP; group them into one item per division.
export function voteItems(rows, since) {
  const by = new Map();
  for (const r of rows ?? []) {
    if (dayOf(r.date) < since || !r.title) continue;
    const key = r.division_id ?? `${r.date}|${r.title}`;
    const d = by.get(key) ?? { id: `vote-${key}`, kind: "vote", date: dayOf(r.date), title: r.title, aye: 0, no: 0, href: "#/voting", external: false };
    if (r.voted_aye) d.aye += 1; else d.no += 1;
    by.set(key, d);
  }
  return [...by.values()].map((d) => ({ ...d, detail: `${d.aye.toLocaleString("en-GB")} MPs voted aye and ${d.no.toLocaleString("en-GB")} voted no.${d.aye > d.no ? " It passed." : d.aye < d.no ? " It fell." : ""}` }));
}

export function moneyItems(rows, politicians, since, limit = 12) {
  const who = new Map((politicians ?? []).map((p) => [p.id, p]));
  return (rows ?? []).filter((r) => dayOf(r.date_registered) >= since && r.value_amount > 0 && r.donor_name)
    .sort((a, b) => b.value_amount - a.value_amount).slice(0, limit).map((r, i) => {
      const p = who.get(r.politician_id);
      return {
        id: `money-${r.id ?? i}`, kind: "money", date: dayOf(r.date_registered), title: `${p?.name ?? "An MP"} declared ${money(r.value_amount)} from ${r.donor_name}`,
        detail: [r.category, p?.party].filter(Boolean).join(", "), href: `#/followTheMoney/${encodeURIComponent(r.donor_name)}`, external: false, colour: p?.party_colour ?? null,
      };
    });
}

export function petitionItems(rows, since, today = sinceDate(0)) {
  const out = [];
  for (const p of rows ?? []) {
    if (dayOf(p.government_responded_at) >= since) out.push({ id: `pet-r-${p.id}`, kind: "petition", date: dayOf(p.government_responded_at), title: `The government responded to "${p.action}"`, detail: `${(p.signature_count ?? 0).toLocaleString("en-GB")} signatures.`, href: p.url ?? "#/petitions", external: Boolean(p.url) });
    const dd = dayOf(p.debate_scheduled_on);
    if (dd && dd >= since) out.push({ id: `pet-d-${p.id}`, kind: "petition", date: dd, title: dd > today ? `Debate scheduled on "${p.action}"` : `Parliament debated "${p.action}"`, detail: `${(p.signature_count ?? 0).toLocaleString("en-GB")} signatures.`, href: p.url ?? "#/petitions", external: Boolean(p.url) });
  }
  return out;
}

export function standardsItems(rows, since) {
  return (rows ?? []).filter((r) => dayOf(r.publication_date) >= since).map((r) => ({
    id: `std-${r.id}`, kind: "standards", date: dayOf(r.publication_date), title: r.title ?? `Conduct report on ${r.politician_name ?? r.extracted_name ?? "an MP"}`,
    detail: r.politician_name ? `Concerns ${r.politician_name}.` : "A report from the Committee on Standards.", href: r.report_url ?? "#/standards", external: Boolean(r.report_url),
  }));
}

export function electionItems(rows, since, ahead) {
  return (rows ?? []).filter((r) => r.election_date && r.election_date >= since && r.election_date <= ahead).map((r) => ({
    id: `by-${r.election_id ?? r.constituency_name}`, kind: "election", date: dayOf(r.election_date), title: `By-election in ${r.constituency_name ?? "a constituency"}`,
    detail: r.status ? `Status: ${r.status}.` : "", href: "#/byElections", external: false,
  }));
}

// Newest first; items on the same day keep their kind order.
export function buildFeed(parts) {
  const order = Object.keys(KINDS);
  return parts.flat().filter((i) => i.date).sort((a, b) => b.date.localeCompare(a.date) || order.indexOf(a.kind) - order.indexOf(b.kind) || a.title.localeCompare(b.title));
}

// Bills are updated in bunches, so on a busy day they would bury everything else: show the first few of each day and sum up the rest.
export function collapseBills(items, cap = 4) {
  const seen = new Map();
  const extra = new Map();
  const out = [];
  for (const i of items) {
    if (i.kind !== "bill") { out.push(i); continue; }
    const n = (seen.get(i.date) ?? 0) + 1;
    seen.set(i.date, n);
    if (n <= cap) out.push(i); else extra.set(i.date, (extra.get(i.date) ?? 0) + 1);
  }
  for (const [date, n] of extra) {
    const at = out.findLastIndex((i) => i.date === date);
    out.splice(at + 1, 0, { id: `bills-more-${date}`, kind: "bill", date, title: `${n} more ${n === 1 ? "bill" : "bills"} moved`, detail: "See every bill, in plain English, on the How MPs voted page.", href: "#/voting", external: false });
  }
  return out;
}

export const countByKind = (items) => Object.fromEntries(Object.keys(KINDS).map((k) => [k, items.filter((i) => i.kind === k).length]));

const LONG = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
export function dayLabel(iso, today = sinceDate(0)) {
  if (iso === today) return "Today";
  if (iso === sinceDate(1, new Date(`${today}T12:00:00Z`))) return "Yesterday";
  return LONG.format(new Date(`${iso}T12:00:00Z`));
}

export function groupByDay(items) {
  const groups = [];
  for (const i of items) {
    const g = groups[groups.length - 1];
    if (g && g.date === i.date) g.items.push(i); else groups.push({ date: i.date, items: [i] });
  }
  return groups;
}
