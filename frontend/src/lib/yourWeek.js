// "Your week" on the My area page: what your MP and Parliament have been doing lately, from the same database as the rest of the site. Nothing here is a judgement; it counts
// what was recorded in the last few days and says where it came from.
export const WEEK_DAYS = 7;
// The Register of Members' Financial Interests is updated about every two weeks, so a week would often show nothing.
export const INTEREST_DAYS = 14;

// "YYYY-MM-DD" for `days` before `today` (also "YYYY-MM-DD").
export function sinceDay(today, days) {
  const t = new Date(`${today}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() - days);
  return t.toISOString().slice(0, 10);
}

const byDateDesc = (key) => (a, b) => String(b[key] ?? "").localeCompare(String(a[key] ?? ""));

// The rows from the three queries as what the card shows. Each list may be null when its query failed, which is reported rather than counted as "nothing".
export function summariseWeek({ votes, interests, news }) {
  const byDate = votes && [...votes].sort(byDateDesc("date"));
  return {
    votes: votes && {
      count: votes.length,
      ayes: votes.filter((v) => v.voted_aye).length,
      against: votes.filter((v) => v.voted_with_party_majority === false).length,
      latest: byDate.slice(0, 5),
      // One entry per vote, oldest first, for the row of dots: how they voted, and whether it was against their own party.
      dots: byDate.slice(0, 60).reverse().map((v) => ({ aye: !!v.voted_aye, rebel: v.voted_with_party_majority === false })),
    },
    interests: interests && [...interests].sort(byDateDesc("date_registered")),
    news: news && { count: news.length, latest: [...news].sort(byDateDesc("published_date")).slice(0, 4) },
  };
}

// Runs the queries (each may fail on its own) and returns { summary, failed: [names] }. `db` is the site's data client. `mpId` may be null when the seat has no current MP,
// in which case nothing is looked up. Bills are not here: which bills moved has nothing to do with where you live (see "What changed this week").
export async function loadWeek(db, mpId, today) {
  const week = sinceDay(today, WEEK_DAYS);
  const fortnight = sinceDay(today, INTEREST_DAYS);
  const failed = [];
  const run = async (name, query) => {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    } catch {
      failed.push(name);
      return null;
    }
  };
  const [votes, interests, news] = await Promise.all([
    mpId ? run("votes", db.from("voting_records").select("title, date, voted_aye, voted_with_party_majority, source_url").eq("politician_id", mpId).gte("date", week)) : [],
    mpId ? run("interests", db.from("financial_interests").select("donor_name, value_amount, date_registered, category, summary, source_url").eq("politician_id", mpId).gte("date_registered", fortnight)) : [],
    mpId ? run("news", db.from("mp_news").select("headline, url, published_date").eq("politician_id", mpId).gte("published_date", week)) : [],
  ]);
  return { summary: summariseWeek({ votes, interests, news }), failed };
}
