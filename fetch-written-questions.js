// fetch-written-questions.js
//
// What this does, in plain terms:
// 1. Pulls every written question tabled in either House in the last 30
//    days from the UK Parliament Written Questions API (no key needed) —
//    both answered ones (with the government's response) and ones still
//    awaiting an answer.
// 2. Replaces the `written_questions` table with this rolling window each
//    run — like petitions and party donations, this is current activity,
//    not an accumulating archive (the full historical archive runs into
//    the hundreds of thousands of questions).
// 3. Where the asking member matches a current MP in our own `politicians`
//    table, records that row's id too, so the frontend can link straight
//    through to their profile.
//
// Run it with: node fetch-written-questions.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API = "https://writtenquestions-api.parliament.uk/api/writtenquestions/questions";
const WINDOW_DAYS = 30;
const PAGE_SIZE = 500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const REQUEST_TIMEOUT_MS = 20000;
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

// 429s need a much longer cooldown than a one-off network blip — the first
// enrichment run (fetching per-question detail for ~5,000 questions) hit
// sustained rate-limiting at attempt counts/backoff tuned for transient
// errors, and silently kept the old truncated text for every question that
// never got a successful retry. More attempts and a backoff that actually
// backs off on a 429 specifically (rather than treating it like any other
// failure) fixes that.
async function getJson(url) {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }), REQUEST_TIMEOUT_MS);
      if (!res.ok) {
        const err = new Error(`${res.status} ${res.statusText}`);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await sleep(err.status === 429 ? 4000 * attempt : 1500 * attempt);
    }
  }
}

async function fetchAllQuestions(fromStr) {
  const all = [];
  let skip = 0;
  while (true) {
    const url = `${API}?tabledWhenFrom=${fromStr}&expandMember=true&take=${PAGE_SIZE}&skip=${skip}`;
    const data = await getJson(url);
    const items = (data.results ?? []).map((r) => r.value);
    all.push(...items);
    console.log(`  fetched ${all.length} of ${data.totalResults} questions...`);
    if (items.length < PAGE_SIZE || all.length >= data.totalResults) break;
    skip += PAGE_SIZE;
    await sleep(150);
  }
  return all;
}

// The list endpoint above silently hard-truncates questionText at 255 chars
// and answerText at 258 — no ellipsis or flag, it just stops mid-word. The
// single-question endpoint (/questions/{id}) returns the untruncated text,
// so every question needs a second request to get the real content. A
// small worker pool keeps this from taking forever across ~5,000+ questions
// while staying polite to the API (no large burst of parallel requests).
const DETAIL_CONCURRENCY = 3;

async function fetchFullText(id) {
  const data = await getJson(`${API}/${id}`);
  return data.value;
}

async function withFullText(questions) {
  const enriched = new Array(questions.length);
  let next = 0;
  let done = 0;
  let failed = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= questions.length) return;
      const q = questions[i];
      try {
        const full = await fetchFullText(q.id);
        enriched[i] = { ...q, questionText: full.questionText, answerText: full.answerText };
      } catch (err) {
        failed++;
        console.error(`  ⚠ Couldn't fetch full text for question ${q.id}, keeping the truncated version: ${err.message}`);
        enriched[i] = q;
      }
      done++;
      if (done % 500 === 0) console.log(`  fetched full text for ${done} of ${questions.length} questions (${failed} failed so far)...`);
      await sleep(80);
    }
  }

  console.log(`Fetching full question/answer text for ${questions.length} questions...`);
  await Promise.all(Array.from({ length: DETAIL_CONCURRENCY }, worker));
  console.log(`Finished fetching full text: ${questions.length - failed} succeeded, ${failed} kept their truncated version.`);
  return enriched;
}

async function main() {
  const from = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const fromStr = from.toISOString().slice(0, 10);

  console.log(`Fetching written questions tabled since ${fromStr}...`);
  const listed = await fetchAllQuestions(fromStr);
  console.log(`Found ${listed.length} written questions.`);
  const questions = await withFullText(listed);

  console.log("Loading current MPs to link askers where possible...");
  const { data: politicians } = await supabase.from("politicians").select("id, parliament_member_id");
  const politicianByMemberId = new Map((politicians ?? []).map((p) => [p.parliament_member_id, p.id]));

  const rows = questions.map((q) => ({
    id: q.id,
    uin: q.uin ?? null,
    house: q.house,
    date_tabled: q.dateTabled ? q.dateTabled.slice(0, 10) : null,
    date_answered: q.dateAnswered ? q.dateAnswered.slice(0, 10) : null,
    is_withdrawn: q.isWithdrawn ?? false,
    asking_member_id: q.askingMemberId ?? null,
    asking_member_name: q.askingMember?.name ?? null,
    asking_member_party: q.askingMember?.party ?? null,
    asking_member_party_colour: q.askingMember?.partyColour ?? null,
    asking_member_thumbnail_url: q.askingMember?.thumbnailUrl ?? null,
    politician_id: politicianByMemberId.get(q.askingMemberId) ?? null,
    answering_body_name: q.answeringBodyName ?? null,
    heading: q.heading ?? null,
    question_text: q.questionText,
    answer_text: q.answerText || null,
    updated_at: new Date().toISOString(),
  }));

  console.log(`\nReplacing written_questions table with ${rows.length} questions...`);
  const { error: deleteError } = await supabase.from("written_questions").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  const BATCH_SIZE = 200;
  let saved = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("written_questions").insert(batch);
    if (insertError) {
      console.error(`  ⚠ Batch ${i / BATCH_SIZE + 1} failed: ${insertError.message}`);
      continue;
    }
    saved += batch.length;
  }

  console.log(`\nDone. Saved ${saved} of ${rows.length} written questions.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Something went wrong:", err.message);
    process.exit(1);
  });
