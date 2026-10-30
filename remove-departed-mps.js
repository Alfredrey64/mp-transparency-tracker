// remove-departed-mps.js
//
// What this does, in plain terms:
// 1. Takes the MPs table and the Members API's list of MPs who are sitting now, and finds the rows for people who are not (see mpRoster.js for the rules,
//    including the checks that stop it acting on a list that looks wrong).
// 2. For each, first writes them into the Former MPs list (so their name is kept for good, whatever else happens), then takes out what the site shows
//    about a sitting MP: their declared interests, votes, written questions and news, then the profile itself. Their name stays on the Former MPs page, in the
//    seat's history and in the governments they were in. An MP who has a standards report or a ministerial gift on record is left in place and reported,
//    because those are records in their own right. An MP the Members API still lists as sitting is never removed, and if the Former MPs list cannot be
//    written the profile is left alone, so nobody is ever removed without their name being kept.
//
// fetch-interests.js calls this every day. To see what it would do, or to run it by hand:
//   node remove-departed-mps.js            (shows what it would remove, changes nothing)
//   node remove-departed-mps.js --apply    (removes them)

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchRetry } from "./httpFetch.js";
import { removalPlan, formerMpRow, PROFILE_TABLES, RECORD_TABLES } from "./mpRoster.js";

// The Members API's record of one member, or null.
export async function lookUpMember(id) {
  try {
    const res = await fetchRetry(`https://members-api.parliament.uk/api/Members/${id}`);
    return res.ok ? (await res.json()).value ?? null : null;
  } catch { return null; }
}

export async function removeDepartedMps(supabase, currentIds, { apply = true, log = console.log, lookup = lookUpMember } = {}) {
  const { data: rows, error } = await supabase.from("politicians").select("id, name, constituency, parliament_member_id");
  if (error) { log(`  ⚠ Could not read the MPs table to look for MPs who have left: ${error.message}`); return { removed: [], kept: [] }; }
  const plan = removalPlan(rows, currentIds);
  if (plan.reason) { log(`::warning title=No MPs were removed::${plan.reason}`); return { removed: [], kept: [] }; }
  const removed = [];
  const kept = [];
  for (const mp of plan.remove) {
    let records = 0;
    for (const table of RECORD_TABLES) {
      const { count, error: e } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("politician_id", mp.id);
      if (e) { records = Infinity; break; }
      records += count ?? 0;
    }
    if (records > 0) { kept.push(mp); log(`::warning title=${mp.name} has left but has records on file::${mp.name} (${mp.constituency ?? "no seat"}) is no longer a sitting MP but has a standards report or ministerial gift on record, so the profile was left in place.`); continue; }
    // The Members API must agree that they have left, and it is where the Former MPs entry comes from.
    const member = await lookup(mp.parliament_member_id);
    const former = formerMpRow(member);
    if (!former) { kept.push(mp); log(`::warning title=${mp.name} was not removed::${mp.name} is not on the current list, but the Members API does not say they have left the Commons, so the profile was left in place.`); continue; }
    if (!apply) { log(`  Would remove ${mp.name} (${mp.constituency ?? "no seat"}, id ${mp.id}).`); removed.push(mp); continue; }
    let failed = null;
    const { error: keepError } = await supabase.from("former_mps").upsert([former], { onConflict: "parliament_member_id" });
    if (keepError) failed = `former_mps: ${keepError.message}`;
    for (const table of failed ? [] : PROFILE_TABLES) {
      const { error: e } = await supabase.from(table).delete().eq("politician_id", mp.id);
      if (e) { failed = `${table}: ${e.message}`; break; }
    }
    if (!failed) { const { error: e } = await supabase.from("politicians").delete().eq("id", mp.id); if (e) failed = `politicians: ${e.message}`; }
    if (failed) { log(`  ⚠ Could not finish removing ${mp.name}: ${failed}`); kept.push(mp); continue; }
    log(`  Removed ${mp.name} (${mp.constituency ?? "no seat"}), who has left the Commons.`);
    removed.push(mp);
  }
  return { removed, kept };
}

async function currentMemberIds() {
  const ids = [];
  for (let skip = 0; ; skip += 20) {
    const res = await fetchRetry(`https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true&skip=${skip}&take=20`);
    if (!res.ok) throw new Error(`Members search API error: ${res.status}`);
    const page = await res.json();
    for (const item of page.items ?? []) ids.push(item.value.id);
    if (skip + 20 >= (page.totalResults ?? 0)) break;
  }
  return ids;
}

if (process.argv[1]?.endsWith("remove-departed-mps.js")) {
  const apply = process.argv.includes("--apply");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const ids = await currentMemberIds();
  console.log(`${ids.length} MPs are sitting now. ${apply ? "Removing" : "Looking for"} those who are not.`);
  const { removed, kept } = await removeDepartedMps(supabase, ids, { apply });
  console.log(`${apply ? "Removed" : "Would remove"} ${removed.length}; left in place ${kept.length}.`);
}
