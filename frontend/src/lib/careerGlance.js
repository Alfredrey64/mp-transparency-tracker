// The tiles on the Career tab's "at a glance" panel, worked out from summarise() in careerTimeline.js. Pure, so it can be tested.
// Tiles come in three groups: where the person sat, the posts they held, and committees and party. Tiles with a length of time also carry what share of the whole career
// it was, drawn as a bar. A tile with nothing to show stays, dimmed, so the panel reads the same for everyone.

const YEAR = 365.25 * 24 * 3600 * 1000;
const yrs = (n) => (n >= 1 ? `${Math.round(n)}` : n > 0 ? "<1" : "0");

export function glanceGroups(s, now = Date.now()) {
  const first = [s.firstElected, s.lordsFrom].filter(Boolean).map((d) => Date.parse(d)).sort((a, b) => a - b)[0];
  const span = Math.max(1, first ? (now - first) / YEAR : 1, (s.yearsInCommons || 0) + (s.yearsInLords || 0));
  const share = (years) => Math.max(0, Math.min(1, (years || 0) / span));

  const seats = [];
  if (s.lordsFrom) seats.push({ key: "lords", icon: "lords", colour: "#9B4FE0", value: yrs(s.yearsInLords), unit: s.yearsInLords >= 1 && Math.round(s.yearsInLords) === 1 ? "yr" : "yrs", label: "in the House of Lords", note: `since ${s.lordsFrom.slice(0, 4)}`, share: share(s.yearsInLords) });
  if (s.firstElected) {
    seats.push({ key: "commons", icon: "commons", colour: "#1E4FB8", value: yrs(s.yearsInCommons), unit: s.yearsInCommons >= 1 && Math.round(s.yearsInCommons) === 1 ? "yr" : "yrs", label: s.lordsFrom ? "as an MP" : "in the Commons", note: `first elected ${s.firstElected.slice(0, 4)}`, share: share(s.yearsInCommons) });
    seats.push({ key: "elections", icon: "ballot", colour: "#3B6BC9", value: String(s.electionsWon), unit: "", label: s.electionsWon === 1 ? "election won" : "elections won", note: s.electionsLost ? `${s.electionsLost} lost` : "none lost", share: null });
  }

  const posts = [
    { key: "gov", icon: "cabinet", colour: "#1FA97C", value: String(s.governmentPosts), unit: "", label: s.governmentPosts === 1 ? "government post" : "government posts", note: s.governmentPosts ? `${yrs(s.governmentYears)} ${Math.round(s.governmentYears) === 1 ? "year" : "years"} in government` : "never held one", share: s.governmentPosts ? share(s.governmentYears) : null, empty: !s.governmentPosts },
    { key: "shadow", icon: "meeting", colour: "#D98A1F", value: String(s.shadowPosts), unit: "", label: s.shadowPosts === 1 ? "shadow post" : "shadow posts", note: s.shadowPosts ? `${yrs(s.shadowYears)} ${Math.round(s.shadowYears) === 1 ? "year" : "years"} on the front bench` : "never held one", share: s.shadowPosts ? share(s.shadowYears) : null, empty: !s.shadowPosts },
  ];

  const other = [
    { key: "committees", icon: "committee", colour: "#2F8FBF", value: String(s.committees), unit: "", label: s.committees === 1 ? "committee" : "committees", note: s.committeesNow ? `${s.committeesNow} now` : s.committees ? "none now" : "none", share: null, empty: !s.committees },
    { key: "party", icon: "split", colour: "#7B6CF0", value: String(s.partyChanges), unit: "", label: s.partyChanges === 1 ? "party change" : "party changes", note: s.partyChanges ? "including spells as an independent" : "has kept the same party", share: null, empty: !s.partyChanges },
  ];

  return [
    { title: "Where they sat", tiles: seats },
    { title: "Posts held", tiles: posts },
    { title: "Committees and party", tiles: other },
  ].filter((g) => g.tiles.length);
}
