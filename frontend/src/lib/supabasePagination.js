// Supabase caps a single request at 1000 rows no matter what limit/range is
// requested — a table that grows past that (financial_interests,
// party_donations, ...) silently returns an arbitrary partial slice instead
// of erroring, which is easy to miss since small tables never hit it.
//
// Pass a factory that builds a fresh query each call (Supabase query
// builders are single-use) — this pages through with .range() until a page
// comes back short.
const PAGE_SIZE = 1000;

export async function fetchAllRows(queryFactory) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryFactory().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}
