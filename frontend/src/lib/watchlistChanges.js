// How many new things there are for the MPs someone follows since they last
// opened the Watchlist: declared interests with a value, votes against their
// own party, and news mentions. The same three checks the Watchlist page
// makes, as counts only, so the sidebar and home page can say "3 new" without
// loading the whole digest. Kept in its own file and imported on demand.
import { supabase } from "../supabaseClient";
import { getWatchlist, getLastChecked } from "./watchlist";

const DEFAULT_LOOKBACK_DAYS = 30;

export async function countWatchlistChanges() {
  const ids = getWatchlist().map((p) => p.id);
  if (ids.length === 0) return { following: 0, changes: 0 };
  const since = getLastChecked() ?? Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const sinceDate = new Date(since).toISOString().slice(0, 10);
  const head = { count: "exact", head: true };
  const [a, b, c] = await Promise.all([
    supabase.from("financial_interests").select("*", head).in("politician_id", ids).not("value_amount", "is", null).gte("date_registered", sinceDate),
    supabase.from("voting_records").select("*", head).in("politician_id", ids).eq("voted_with_party_majority", false).gte("date", sinceDate),
    supabase.from("mp_news").select("*", head).in("politician_id", ids).gte("published_date", sinceDate),
  ]);
  return { following: ids.length, changes: (a.count ?? 0) + (b.count ?? 0) + (c.count ?? 0) };
}
