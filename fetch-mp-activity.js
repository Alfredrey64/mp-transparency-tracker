// fetch-mp-activity.js
//
// What this does, in plain terms:
// 1. For every current MP already in our `politicians` table, fetches their
//    most recent Commons debate contributions and written questions from
//    the Members API — the same endpoints already used for House of Lords
//    peers, which also work for the Commons.
// 2. Saves a compact snapshot of both into a `recent_activity` column on
//    each MP's row — safely re-runnable, no duplicates (each run replaces
//    the previous snapshot with a fresh one).
//
// This is a real answer to "what has my MP actually been doing lately" —
// distinct from their voting record (a separate table) and their financial
// interests (also separate).
//
// Run it with: node fetch-mp-activity.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchRecentContributions, fetchRecentWrittenQuestions } from "./memberActivity.js";
import { mapLimit, tooManyFailed } from "./httpFetch.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, parliament_member_id, name");
  if (error) throw error;

  console.log(`Fetching recent activity for ${politicians.length} current MPs...\n`);

  // Five MPs at a time (one at a time took about two hours). An MP whose lookup fails keeps the snapshot already saved, and the run is reported as failed only if
  // more than one in ten fail.
  let saved = 0;
  let done = 0;
  const failed = [];
  await mapLimit(politicians.filter((mp) => mp.parliament_member_id), 5, async (mp) => {
    try {
      const [contributions, writtenQuestions] = await Promise.all([
        fetchRecentContributions(mp.parliament_member_id),
        fetchRecentWrittenQuestions(mp.parliament_member_id),
      ]);
      const { error: updateError } = await supabase
        .from("politicians")
        .update({ recent_activity: { contributions, writtenQuestions } })
        .eq("id", mp.id);
      if (updateError) throw new Error(updateError.message);
      saved++;
    } catch (err) {
      failed.push(mp.id);
      console.error(`  ⚠ Failed to save activity for ${mp.name}: ${err.message}`);
    } finally {
      done += 1;
      if (done % 50 === 0) console.log(`  ...${done}/${politicians.length} done`);
    }
  }, { pauseMs: 100 });

  console.log(`\nDone. Saved recent activity for ${saved} of ${politicians.length} MPs.`);
  if (tooManyFailed(failed.length, politicians.length)) throw new Error(`${failed.length} of ${politicians.length} MPs failed`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
