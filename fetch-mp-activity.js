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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchRecentContributions(memberId) {
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
      };
    });
  } catch {
    return [];
  }
}

async function fetchRecentWrittenQuestions(memberId) {
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

async function main() {
  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, parliament_member_id, name");
  if (error) throw error;

  console.log(`Fetching recent activity for ${politicians.length} current MPs...\n`);

  let saved = 0;
  for (const [i, mp] of politicians.entries()) {
    if (!mp.parliament_member_id) continue;
    const [contributions, writtenQuestions] = await Promise.all([
      fetchRecentContributions(mp.parliament_member_id),
      fetchRecentWrittenQuestions(mp.parliament_member_id),
    ]);

    const { error: updateError } = await supabase
      .from("politicians")
      .update({ recent_activity: { contributions, writtenQuestions } })
      .eq("id", mp.id);
    if (updateError) {
      console.error(`  ⚠ Failed to save activity for ${mp.name}: ${updateError.message}`);
    } else {
      saved++;
    }

    if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${politicians.length} done`);
    await sleep(120);
  }

  console.log(`\nDone. Saved recent activity for ${saved} of ${politicians.length} MPs.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
