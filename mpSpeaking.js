// mpSpeaking.js
//
// How often each sitting MP has spoken in Parliament in the last 12 months, from Hansard's search API (hansard-api.parliament.uk). One number per MP: the count of "spoken
// contributions" Hansard has recorded under their name. A contribution is one turn at speaking, so a question, an answer, a speech and a short intervention each count once.
// The count says how often an MP spoke, not how much they said or how well. Ministers answer many questions and the Speaker and deputies chair debates, so the page says so.
// Pure functions, no network, so they can be tested.

// The search result for one MP (Take=1 is enough: the count is the total the search found) -> { count, last } or null when the response is not Hansard's.
export function shapeSpeaking(result) {
  const n = result?.SpokenResultCount ?? result?.TotalResultCount;
  if (!Number.isInteger(n) || n < 0) return null;
  const first = result?.Results?.[0]?.SittingDate;
  return { count: n, last: typeof first === "string" ? first.slice(0, 10) : null };
}

export const median = (values) => {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
};

// The file the site reads: counts by member id, the window they cover, and the middle MP's count for context.
export function buildSpeaking(byMember, { from, to }) {
  const ids = Object.keys(byMember);
  return { from, to, median: median(ids.map((id) => byMember[id].count)), members: byMember };
}

// The window: the 12 months to `today`.
export function windowTo(today) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return { from: d.toISOString().slice(0, 10), to: today };
}
