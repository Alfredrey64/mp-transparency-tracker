// fetch-mp-news.js
//
// What this does, in plain terms:
// 1. For every current MP, searches Google News' public RSS feed for their
//    name (no API key needed — it's a plain, freely-accessible feed)
// 2. Keeps the 3 most recent genuine matches from the last 14 days
// 3. Replaces that MP's rows in Supabase with the fresh results — so the
//    table always reflects what's current, never accumulates stale links
//
// This is a headline skim, not a verified fact-check: a same-named person,
// or an MP quoted only in passing, can occasionally slip through. We say so
// on the page itself rather than presenting it as a guaranteed-accurate feed.
//
// Run it with: node fetch-mp-news.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { isLikelyMatch, searchName } from "./newsMatching.js";
import { looksLikeFeed, parseItems, tidyItems } from "./newsFeed.js";
import { fetchRetry } from "./httpFetch.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ARTICLES_PER_MP = 3;
const WINDOW_DAYS = 14;

async function fetchNewsFor(mpName) {
  const q = encodeURIComponent(`"${searchName(mpName)}" when:${WINDOW_DAYS}d`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
  const res = await fetchRetry(url, { headers: { "User-Agent": "simple-politics (independent, non-commercial)" } });
  if (!res.ok) throw new Error(`Google News RSS error: ${res.status}`);
  const xml = await res.text();
  // An error or consent page is not "no news": throwing here leaves this MP's stored articles as they were.
  if (!looksLikeFeed(xml)) throw new Error("Google News did not return a feed");
  return parseItems(xml);
}

// If this many MPs in a row fail, the feed is blocking or down. Stop rather than spend an hour failing 650 times.
const MAX_FAILURES_IN_A_ROW = 15;

async function main() {
  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, name");
  if (error) throw error;
  console.log(`Checking news coverage for ${politicians.length} MPs...\n`);

  let withCoverage = 0;
  let failed = 0;
  let failuresInARow = 0;
  for (const [i, mp] of politicians.entries()) {
    try {
      const items = tidyItems(
        (await fetchNewsFor(mp.name)).filter((item) => isLikelyMatch(item.headline, mp.name)),
        { windowDays: WINDOW_DAYS, limit: ARTICLES_PER_MP },
      );

      // Replace this MP's rows outright so the table never accumulates
      // stale articles that have aged out of the search window.
      const { error: deleteError } = await supabase.from("mp_news").delete().eq("politician_id", mp.id);
      if (deleteError) throw deleteError;

      if (items.length > 0) {
        const rows = items.map((item) => ({ politician_id: mp.id, ...item }));
        const { error: insertError } = await supabase.from("mp_news").insert(rows);
        if (insertError) throw insertError;
        withCoverage++;
      }

      failuresInARow = 0;
      console.log(`[${i + 1}/${politicians.length}] ${mp.name} — ${items.length} article(s)`);
    } catch (err) {
      failed++;
      failuresInARow++;
      console.error(`  ⚠ Failed for ${mp.name}: ${err.message}`);
      if (failuresInARow >= MAX_FAILURES_IN_A_ROW) {
        throw new Error(`${MAX_FAILURES_IN_A_ROW} lookups in a row failed, so the feed looks unavailable. Stopping; stored articles are unchanged for the MPs not reached.`);
      }
    }
    await sleep(250);
  }

  console.log(`\nDone. ${withCoverage}/${politicians.length} MPs had recent news coverage found${failed ? `; ${failed} lookup(s) failed and kept their earlier articles` : ""}.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
