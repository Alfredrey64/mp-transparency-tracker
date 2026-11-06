// replaceTable.js
//
// How the fetch scripts that keep a whole table in step with a source (petitions, written questions, standards reports, select committees, ministerial gifts) swap in
// the new rows. They used to delete every row and then insert the new ones, and that had three ways to leave a page empty or short:
//   - a source that answered with nothing (or a fraction of its usual list) replaced a full table with that,
//   - a batch that failed to insert was logged and skipped, so the script still reported success with rows missing, and
//   - the table was empty between the delete and the insert.
// replaceTable() reads the current rows first, refuses a replacement that is empty or far smaller, and if any insert fails puts the old rows back and throws, so the run
// shows as failed and the site goes on showing the previous rows. It needs a Supabase client; it is tested with a stand-in.

// Below this share of the current row count, a replacement is taken to be a broken fetch and not a real change.
export const MIN_SHARE = 0.5;
// Tables with fewer rows than this have no usual size to compare with.
const MIN_COMPARABLE = 20;
const PAGE = 1000;

async function readAll(supabase, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select("*").order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(`could not read the current ${table} rows: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

// The batches that failed, as "batch N: message" lines (none if everything went in).
async function insertAll(supabase, table, rows, batchSize) {
  const failed = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + batchSize));
    if (error) failed.push(`batch ${i / batchSize + 1}: ${error.message}`);
  }
  return failed;
}

// Gives back how many rows went in. Throws, having changed nothing or put everything back, if the new rows should not replace the old.
export async function replaceTable(supabase, table, rows, { batchSize = 100, minShare = MIN_SHARE } = {}) {
  const old = await readAll(supabase, table);
  if (rows.length === 0 && old.length > 0) throw new Error(`the source gave no ${table} rows, so the ${old.length} already saved were left as they are`);
  if (old.length >= MIN_COMPARABLE && rows.length < old.length * minShare) {
    throw new Error(`the source gave ${rows.length} ${table} rows where ${old.length} are saved, which looks like a broken fetch, so the saved rows were left as they are`);
  }

  const { error: deleteError } = await supabase.from(table).delete().neq("id", 0);
  if (deleteError) throw deleteError;

  const failed = await insertAll(supabase, table, rows, batchSize);
  if (failed.length === 0) return rows.length;

  // Some rows did not go in. Clear what did and put the old rows back, with their ids and, if the table will not take those, without.
  await supabase.from(table).delete().neq("id", 0);
  let back = await insertAll(supabase, table, old, batchSize);
  if (back.length) {
    await supabase.from(table).delete().neq("id", 0);
    back = await insertAll(supabase, table, old.map(({ id, ...rest }) => rest), batchSize);
  }
  throw new Error(`${failed.length} of ${Math.ceil(rows.length / batchSize)} batches of ${table} failed to save (${failed[0]}); ${back.length ? `the ${old.length} previous rows could NOT all be put back (${back[0]})` : `the ${old.length} previous rows were put back`}`);
}
