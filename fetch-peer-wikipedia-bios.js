// fetch-peer-wikipedia-bios.js
//
// What this does, in plain terms:
// 1. Reads every peer already saved by fetch-peers.js.
// 2. Looks each one up on Wikipedia by their exact peerage title (e.g.
//    "Baroness Smith of Basildon") — peerage titles are unique by law, so
//    unlike a plain name search this rarely risks matching the wrong
//    person. Only a "standard" (real article) result is kept; a missing
//    page or a disambiguation page is simply left blank rather than
//    guessed at.
// 3. Saves the short summary extract and a link to the article, so the
//    site can show a genuinely informative bio for peers whose official
//    Parliament "Synopsis" is thin (often just restating their title) —
//    clearly attributed to Wikipedia in the UI, not presented as the
//    official record.
//
// This is reference content that barely changes day to day, so — like
// fetch-pm-portraits.js — run it by hand occasionally rather than daily.
//
// Run it with: node fetch-peer-wikipedia-bios.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWikipediaSummary(title, attempt = 1) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetch(url, { headers: { "User-Agent": "mp-transparency-tracker/1.0 (civic transparency site)" } });
  if (res.status === 429 && attempt <= 3) {
    await sleep(2000 * attempt);
    return fetchWikipediaSummary(title, attempt + 1);
  }
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type !== "standard") return null; // skip disambiguation / missing pages
  if (!data.extract) return null;
  return { extract: data.extract, url: data.content_urls?.desktop?.page ?? null };
}

async function main() {
  console.log("Loading all peers from Supabase...");
  const { data: peers, error } = await supabase.from("peers").select("id, name");
  if (error) throw error;
  console.log(`Found ${peers.length} peers. Looking each one up on Wikipedia...\n`);

  let found = 0;
  const updates = [];
  for (const [i, peer] of peers.entries()) {
    try {
      const summary = await fetchWikipediaSummary(peer.name);
      if (summary) {
        // Supabase's upsert re-sends the full row on conflict rather than
        // patching just the given columns, so every NOT NULL column (here,
        // just `name`) has to be included even though it isn't changing —
        // omitting it means the upsert tries to write NULL into it.
        updates.push({ id: peer.id, name: peer.name, wikipedia_bio: summary.extract, wikipedia_url: summary.url });
        found++;
      }
    } catch (err) {
      console.log(`[${i + 1}/${peers.length}] "${peer.name}" — error: ${err.message}`);
    }
    if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${peers.length} checked, ${found} found so far`);
    await sleep(400);
  }

  console.log(`\nFound Wikipedia bios for ${found} of ${peers.length} peers. Saving...`);
  const BATCH_SIZE = 100;
  let saved = 0;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const { error: upsertError } = await supabase.from("peers").upsert(batch, { onConflict: "id" });
    if (upsertError) {
      console.error(`  batch ${i / BATCH_SIZE + 1} failed: ${upsertError.message}`);
      continue;
    }
    saved += batch.length;
  }

  console.log(`Done. Saved ${saved} of ${updates.length} bios found.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
