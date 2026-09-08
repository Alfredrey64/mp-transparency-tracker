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
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ARTICLES_PER_MP = 3;
const WINDOW_DAYS = 14;

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of itemBlocks) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const sourceName = block.match(/<source url="[^"]*">([\s\S]*?)<\/source>/)?.[1];
    if (!title || !link || !pubDate) continue;

    let headline = decodeEntities(title);
    const cleanSource = sourceName ? decodeEntities(sourceName) : null;
    // Google News titles are formatted "Headline - Source Name" — strip the
    // trailing source since we show it separately.
    if (cleanSource && headline.endsWith(` - ${cleanSource}`)) {
      headline = headline.slice(0, -(cleanSource.length + 3));
    }

    items.push({
      headline,
      source: cleanSource ?? "Unknown source",
      url: link.trim(),
      published_date: new Date(pubDate).toISOString(),
    });
  }
  return items;
}

async function fetchNewsFor(mpName) {
  const q = encodeURIComponent(`"${mpName}" when:${WINDOW_DAYS}d`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google News RSS error: ${res.status}`);
  const xml = await res.text();
  return parseItems(xml);
}

// Cheap safety net: require the MP's surname to actually appear in the
// headline, since a quoted-name search can occasionally still return a
// loosely related result.
function mentionsSurname(headline, mpName) {
  const surname = mpName.trim().split(/\s+/).pop()?.toLowerCase();
  if (!surname) return true;
  return headline.toLowerCase().includes(surname);
}

async function main() {
  const { data: politicians, error } = await supabase
    .from("politicians")
    .select("id, name");
  if (error) throw error;
  console.log(`Checking news coverage for ${politicians.length} MPs...\n`);

  let withCoverage = 0;
  for (const [i, mp] of politicians.entries()) {
    try {
      const items = (await fetchNewsFor(mp.name))
        .filter((item) => mentionsSurname(item.headline, mp.name))
        .sort((a, b) => new Date(b.published_date) - new Date(a.published_date))
        .slice(0, ARTICLES_PER_MP);

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

      console.log(`[${i + 1}/${politicians.length}] ${mp.name} — ${items.length} article(s)`);
    } catch (err) {
      console.error(`  ⚠ Failed for ${mp.name}: ${err.message}`);
    }
    await sleep(250);
  }

  console.log(`\nDone. ${withCoverage}/${politicians.length} MPs had recent news coverage found.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
