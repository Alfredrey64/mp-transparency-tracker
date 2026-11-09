// partyLeaders.js
//
// The rules behind frontend/src/data/partyLeaders.json, which the Party History page reads to show each party's current leader and portrait. fetch-party-leaders.js does the
// fetching; everything that decides what is kept lives here, with no network, so it can be tested.
//
// Why it is built this way: the leader is read from the party's Wikipedia page, which anyone can edit and whose layout can change. So
//   - a name is only accepted if it looks like a person's name;
//   - a CHANGE of leader is only adopted once the same new name has been seen on two different days (a mistaken or vandalised edit is usually put right within a day, and a
//     parsing slip would not repeat identically on both);
//   - if more than a few parties appear to change at once, none is accepted (a real leadership election never moves that many in a day, a broken parser does);
//   - a party whose page cannot be read keeps its last good entry, so the page never loses a leader because a source had a bad night;
//   - a portrait is only ever shown beside the person it belongs to: when the leader changes the old portrait is dropped, never carried over.

// The name used on the Party History page → its Wikipedia article.
export const PARTIES = {
  "Labour Party": "Labour_Party_(UK)",
  "Conservative Party": "Conservative_Party_(UK)",
  "Liberal Democrats": "Liberal_Democrats_(UK)",
  "Scottish National Party": "Scottish_National_Party",
  "Green Party": "Green_Party_of_England_and_Wales",
  "Reform UK": "Reform_UK",
  "Plaid Cymru": "Plaid_Cymru",
  "Democratic Unionist Party": "Democratic_Unionist_Party",
  "Sinn Féin": "Sinn_Féin",
  "Social Democratic & Labour Party": "Social_Democratic_and_Labour_Party",
  "Alliance": "Alliance_Party_of_Northern_Ireland",
  "Ulster Unionist Party": "Ulster_Unionist_Party",
};

// More changes than this in one run are treated as a fault, not as elections.
export const MAX_CHANGES_PER_RUN = 3;

const firstLink = (s) => /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(s ?? "");
const plain = (s) => (s ?? "").replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1").replace(/\{\{[^}]*\}\}/g, "").replace(/<[^>]+>/g, "").trim();

// The leader in a party's Wikipedia infobox: { role, page, name }, or null if the box has none. "| leader = [[X]]" is the leader; "| leader1_name = [[X]]" is too unless its
// title ("| leader1_title = Deputy Leader") says it is a deputy or vice post (the DUP and UUP boxes use "leader" for the leader and "leader1_*" for the deputy).
export function leaderFromInfobox(wikitext) {
  const field = (k) => new RegExp(`^\\s*\\|\\s*${k}\\s*=\\s*(.*)$`, "im").exec(wikitext ?? "")?.[1];
  const t1 = plain(field("leader1_title") ?? "Leader");
  const raw = field("leader") ?? (/deputy|depute|vice/i.test(t1) ? null : field("leader1_name"));
  const link = firstLink(raw);
  if (!link) return null;
  return { role: /president/i.test(t1) ? "President" : "Leader", page: link[1].trim(), name: plain(link[2] ?? link[1]) };
}

// Looks like a person's name: two or more words of letters (accents allowed), apostrophes, hyphens and full stops, and a sensible length.
export function plausibleName(name) {
  return typeof name === "string" && name.length >= 4 && name.length <= 45 && /^\p{L}[\p{L}\p{M}'’. -]*$/u.test(name) && name.trim().split(/\s+/).length >= 2;
}

// What to store for one party, given what is stored now (prev, or undefined), what was just read (found: { name, role, page, photo }, photo possibly null), and today's date
// (YYYY-MM-DD). `immediate` adopts a change at once (for a person to run by hand after checking). Returns { entry, change } where change is one of
//   "new" (nothing stored before), "same" (same leader, details refreshed), "pending" (a different name seen for the first time), "adopted" (a different name seen again
//   on a later day, so now the leader).
export function decide(prev, found, today, { immediate = false } = {}) {
  const fresh = { name: found.name, role: found.role, page: found.page, photo: found.photo ?? null, confirmed: today };
  if (!prev?.name) return { entry: fresh, change: "new" };
  if (prev.name === found.name) {
    // The same person: take the newest portrait, but keep the old one if the lookup found none this time.
    return { entry: { name: prev.name, role: found.role, page: found.page, photo: found.photo ?? prev.photo ?? null, confirmed: today }, change: "same" };
  }
  const seenBefore = prev.pending?.name === found.name && prev.pending.seen < today;
  if (immediate || seenBefore) return { entry: fresh, change: "adopted" };
  const seen = prev.pending?.name === found.name ? prev.pending.seen : today;
  return { entry: { ...prev, pending: { name: found.name, role: found.role, page: found.page, seen } }, change: "pending" };
}
