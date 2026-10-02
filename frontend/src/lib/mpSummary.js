import { shortCategory, ONGOING_ROLE_CATEGORIES, stripTrailingAmount, financialYearLabel } from "./format";

// Turns an MP's official records into a short plain-English summary. Every
// sentence is built from a count, an amount or a name that exists in the
// data — nothing is inferred, scored or characterised — and the wording
// avoids adjectives on purpose: "£12,000 declared" is a fact, "a large
// donation" is a judgement. Kept free of React and of any network access so
// each sentence can be checked against the input that produced it.

const MIN_VOTES_FOR_PERCENTAGE = 20;
const plural = (n, one, many) => (n === 1 ? one : many);
const pounds = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;

const monthYear = (d) => new Date(d).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const dayMonthYear = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function categoryPhrase(category) {
  return shortCategory(category).replace("&", "and").toLowerCase();
}

function joinList(items) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function yearsBetween(start, now) {
  const s = new Date(start);
  let years = now.getFullYear() - s.getFullYear();
  if (now < new Date(now.getFullYear(), s.getMonth(), s.getDate())) years -= 1;
  return years;
}

function leadSentence(politician, now) {
  const { name, party, constituency, membership_start_date: start, cabinet_role: role } = politician;
  const isSpeaker = (party ?? "").toLowerCase() === "speaker";
  const who = isSpeaker
    ? `${name} is the Speaker of the House of Commons and the MP for ${constituency}`
    : `${name} is the ${party ?? "unaffiliated"} MP for ${constituency}`;
  let since = "";
  if (start) {
    const years = yearsBetween(start, now);
    since = years >= 1 ? `, and has been an MP since ${monthYear(start)} (${years} ${plural(years, "year", "years")})` : `, and became an MP in ${monthYear(start)}`;
  }
  const post = role ? ` They currently hold the government post of ${role}.` : "";
  return `${who}${since}.${post}`;
}

function interestsLine(interests, now) {
  if (interests.length === 0) {
    return "Nothing is currently listed against their name in the Register of Members' Financial Interests.";
  }
  const parts = [`${interests.length} ${plural(interests.length, "entry", "entries")} on the Register of Members' Financial Interests`];

  const counts = new Map();
  for (const i of interests) counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const listed = joinList(top.map(([c, n]) => `${categoryPhrase(c)} (${n})`));
  if (counts.size === 1) parts.push(`all about ${categoryPhrase(top[0][0])}`);
  // "Mostly" only when one category really is most of them.
  else if (top[0][1] > interests.length / 2) parts.push(`mostly ${listed}`);
  else parts.push(`spread across ${listed}`);

  let text = `${parts[0]}, ${parts[1]}.`;

  const valued = interests.filter((i) => i.value_amount != null && Number(i.value_amount) > 0);
  if (valued.length > 0) {
    const total = valued.reduce((sum, i) => sum + Number(i.value_amount), 0);
    const largest = valued.reduce((a, b) => (Number(b.value_amount) > Number(a.value_amount) ? b : a));
    const source = largest.donor_name ? `from ${largest.donor_name}` : categoryPhrase(largest.category);
    text += ` ${valued.length} ${plural(valued.length, "carries", "carry")} a declared value, ${pounds(total)} in all; the largest is ${pounds(largest.value_amount)} (${source}).`;
  }

  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const recent = interests.filter((i) => i.date_registered && new Date(i.date_registered) >= cutoff).length;
  if (recent > 0) text += ` ${recent} ${plural(recent, "was", "were")} registered in the last 12 months.`;
  return text;
}

function outsideWorkLine(interests) {
  const roles = interests.filter((i) => ONGOING_ROLE_CATEGORIES.includes(i.category));
  if (roles.length === 0) return null;
  const clip = (s) => {
    const t = stripTrailingAmount(s ?? "").trim().replace(/[.\s]+$/, "");
    return t.length > 90 ? `${t.slice(0, 87).trimEnd()}…` : t;
  };
  const shown = roles.slice(0, 2).map((r) => clip(r.summary)).filter(Boolean);
  const more = roles.length - shown.length;
  return `Ongoing paid outside work is declared: ${shown.join("; ")}${more > 0 ? ` (and ${more} more)` : ""}.`;
}

function financialYearStart(now) {
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function claimsLine(politician, now) {
  const e = politician.ipsa_expenses;
  if (!e || e.total == null) return null;
  const startYear = 2000 + Number(String(e.year).split("_")[0]);
  const inProgress = startYear === financialYearStart(now);
  let text = `${pounds(e.total)} of business costs (staff, travel, accommodation and office running costs) claimed through IPSA ${inProgress ? "so far in" : "in"} ${financialYearLabel(e.year)}`;
  if (e.previousYear?.total != null) text += `, compared with ${pounds(e.previousYear.total)} in ${financialYearLabel(e.previousYear.year)}`;
  return `${text}.`;
}

function votesLine(votes, hasPartyConcept) {
  if (!votes || !votes.total) return null;
  let text = `${votes.total.toLocaleString("en-GB")} recorded Commons ${plural(votes.total, "vote", "votes")} on this site.`;
  if (hasPartyConcept && votes.partyTotal > 0) {
    const n = (v) => v.toLocaleString("en-GB");
    // A percentage of a handful of votes looks more precise than it is.
    const pct = votes.partyTotal >= MIN_VOTES_FOR_PERCENTAGE ? ` (${Math.round((votes.against / votes.partyTotal) * 1000) / 10}%)` : "";
    text += votes.against === 0
      ? ` In all ${n(votes.partyTotal)} where their party had a clear majority position, they voted with it.`
      : ` In ${n(votes.against)} of the ${n(votes.partyTotal)} where their party had a clear majority position, they voted the other way${pct}.`;
  }
  return text;
}

function activityLine(politician, questions30d) {
  const activity = politician.recent_activity ?? {};
  const bits = [];
  const topics = [...new Set((activity.writtenQuestions ?? []).map((q) => (q.heading ?? "").trim()).filter(Boolean))].slice(0, 4);
  // Headings are quoted whole: many contain their own colon ("Gaza: Armed
  // Conflict"), which would blur where one topic ends and the next begins.
  if (topics.length > 0) bits.push(`Their latest written questions to ministers covered ${joinList(topics.map((t) => `“${t}”`))}.`);
  if (questions30d > 0) bits.push(`${questions30d} written ${plural(questions30d, "question was", "questions were")} tabled in the last 30 days.`);
  const last = (activity.contributions ?? [])[0];
  if (last?.title && last?.date) bits.push(`Most recent recorded debate: “${last.title.trim()}” on ${dayMonthYear(last.date)}.`);
  return bits.length > 0 ? bits.join(" ") : null;
}

function committeesLine(committees) {
  if (!committees || committees.length === 0) return null;
  return `Sits on ${committees.length} select ${plural(committees.length, "committee", "committees")}: ${joinList(committees.map((c) => c.name))}.`;
}

function standardsLine(count) {
  if (count == null) return null;
  if (count === 0) return "No standards reports are held against their name in the data this site tracks.";
  return `${count} ${plural(count, "report", "reports")} from the Parliamentary Commissioner for Standards ${plural(count, "is", "are")} on record against their name.`;
}

function giftsLine(gifts) {
  if (!gifts || gifts.length === 0) return null;
  return `${gifts.length} ministerial ${plural(gifts.length, "gift or hospitality entry is", "gift and hospitality entries are")} published against their name.`;
}

const NO_PARTY_MAJORITY = ["independent", "speaker"];

export function buildMpSummary({ politician, interests = null, gifts = [], committees = [], votes = null, standardsCount = null, questions30d = null, now = new Date() }) {
  const hasPartyConcept = !NO_PARTY_MAJORITY.includes((politician.party ?? "").toLowerCase());
  const items = [
    // null means "couldn't load", which must not read as "none declared".
    { key: "money", label: "Money and interests", text: interests ? interestsLine(interests, now) : null },
    { key: "work", label: "Outside work", text: interests ? outsideWorkLine(interests) : null },
    { key: "gifts", label: "Gifts as a minister", text: giftsLine(gifts) },
    { key: "claims", label: "Expenses", text: claimsLine(politician, now) },
    { key: "votes", label: "Votes", text: votesLine(votes, hasPartyConcept) },
    { key: "activity", label: "In Parliament", text: activityLine(politician, questions30d) },
    { key: "committees", label: "Committees", text: committeesLine(committees) },
    { key: "standards", label: "Standards", text: standardsLine(standardsCount) },
  ].filter((i) => i.text);
  return { lead: leadSentence(politician, now), items };
}
