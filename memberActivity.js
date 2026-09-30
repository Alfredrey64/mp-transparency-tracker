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

export async function fetchRecentContributions(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/ContributionSummary?page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).slice(0, 5).map((item) => {
      const v = item.value;
      return {
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
        department: v.answeringBody?.name ?? null,
        dateTabled: v.dateTabled?.slice(0, 10) ?? null,
        dateAnswered: v.dateAnswered?.slice(0, 10) ?? null,
      };
    });
  } catch {
    return [];
  }
}
