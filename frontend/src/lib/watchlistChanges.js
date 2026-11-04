// How many new things there are for the MPs someone follows since they last
// opened the Watchlist: declared interests with a value, votes against their
// own party, and news mentions. The same three checks the Watchlist page
// makes, as counts only, so the sidebar and home page can say "3 new" without
// loading the whole digest. Kept in its own file and imported on demand.
import { supabase } from "../supabaseClient";
import { getWatchlist, getLastChecked } from "./watchlist";
import { getWatchedBills, billChange } from "./billWatch";

const DEFAULT_LOOKBACK_DAYS = 30;

export async function countWatchlistChanges() {
  const ids = getWatchlist().map((p) => p.id);
  const bills = getWatchedBills();
  if (ids.length === 0 && bills.length === 0) return { following: 0, changes: 0 };
  const since = getLastChecked() ?? Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const sinceDate = new Date(since).toISOString().slice(0, 10);
  const head = { count: "exact", head: true };
  const mps = ids.length === 0 ? Promise.resolve(0) : Promise.all([
    supabase.from("financial_interests").select("*", head).in("politician_id", ids).not("value_amount", "is", null).gte("date_registered", sinceDate),
    supabase.from("voting_records").select("*", head).in("politician_id", ids).eq("voted_with_party_majority", false).gte("date", sinceDate),
    supabase.from("mp_news").select("*", head).in("politician_id", ids).gte("published_date", sinceDate),
  ]).then(([a, b, c]) => (a.count ?? 0) + (b.count ?? 0) + (c.count ?? 0));
  const moved = bills.length === 0 ? Promise.resolve(0) : supabase.from("bills").select("bill_id, current_stage, is_act, is_defeated").in("bill_id", bills.map((b) => b.bill_id))
    .then(({ data }) => (data ?? []).filter((row) => billChange(bills.find((b) => b.bill_id === row.bill_id), row)).length);
  const [m, b] = await Promise.all([mps, moved]);
  return { following: ids.length + bills.length, changes: m + b };
}
