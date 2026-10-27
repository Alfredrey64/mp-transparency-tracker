// Shared by fetch-mp-activity.js and fetch-peers.js — both fetch the same
// "what has this member been doing lately" data from the Members API for
// their own set of people (MPs vs peers), so the request/shape logic only
// needs to exist once.

// Hansard's own public debate URL — verified against several live debates:
// {house}/{sittingDate}/debates/{debateWebsiteId}/{title with every
// non-alphanumeric character removed, original casing kept}. The
// debateWebsiteId is the part that actually resolves the page; the slug
// looks decorative but the page 404s without SOME slug present, so one is
// still built rather than left off.
export function hansardUrl(house, sittingDate, debateWebsiteId, title) {
  if (!house || !sittingDate || !debateWebsiteId) return null;
  const date = sittingDate.slice(0, 10);
  const slug = (title ?? "").replace(/[^a-zA-Z0-9]/g, "") || "Debate";
  return `https://hansard.parliament.uk/${house}/${date}/debates/${debateWebsiteId}/${slug}`;
}

// Plain text from the little bit of HTML Parliament's APIs return: tags removed, the common entities decoded, spaces tidied.
export function plainText(html) {
  return String(html ?? "")
    .replace(/<\/?(p|br|div|li)[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, "")
    .replace(/\s+/g, " ").trim();
}

// A short passage, cut at the end of a word with an ellipsis.
export function clip(text, max) {
  const t = String(text ?? "");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

// What one member actually said in a debate, from Hansard's JSON for it: their own contributions, as plain text, longest first, at most `limit` of them,
// each cut to `max` characters. Short interjections ("Hear, hear") are skipped unless there is nothing else.
export function memberWords(debate, memberId, { limit = 2, max = 420 } = {}) {
  const items = (debate?.Items ?? []).filter((i) => i.ItemType === "Contribution" && Number(i.MemberId) === Number(memberId));
  const texts = items.map((i) => plainText(i.Value)).filter(Boolean);
  const real = texts.filter((t) => t.length >= 60);
  return (real.length ? real : texts).sort((a, b) => b.length - a.length).slice(0, limit).map((t) => clip(t, max));
}

const debateCache = new Map();
async function fetchDebate(extId) {
  if (!extId) return null;
  if (!debateCache.has(extId)) {
    debateCache.set(extId, fetch(`https://hansard-api.parliament.uk/Debates/Debate/${extId}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  }
  return debateCache.get(extId);
}

export async function fetchRecentContributions(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/ContributionSummary?page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    const rows = (data.items ?? []).slice(0, 5);
    // The member's own words in each debate, so a visitor can read what they said without leaving the site.
    const words = await Promise.all(rows.map(async (item) => memberWords(await fetchDebate(item.value.debateWebsiteId), memberId)));
    return rows.map((item, n) => {
      const v = item.value;
      return {
        said: words[n],
        title: v.debateTitle,
        date: v.sittingDate?.slice(0, 10) ?? null,
        section: v.section,
        speechCount: v.speechCount,
        questionCount: v.questionCount,
        interventionCount: v.interventionCount,
        hansardUrl: hansardUrl(v.house, v.sittingDate, v.debateWebsiteId, v.debateTitle),
      };
    });
  } catch {
    return [];
  }
}

export async function fetchRecentWrittenQuestions(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/WrittenQuestions?take=5`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).slice(0, 5).map((item) => {
      const v = item.value;
      return {
        heading: v.heading,
        questionText: v.questionText,
        uin: v.uin ?? null,
        answerText: v.answerText ? clip(plainText(v.answerText), 700) : null,
        department: v.answeringBody?.name ?? null,
        dateTabled: v.dateTabled?.slice(0, 10) ?? null,
        dateAnswered: v.dateAnswered?.slice(0, 10) ?? null,
      };
    });
  } catch {
    return [];
  }
}
