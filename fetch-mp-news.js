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

// A quoted-name search still lets loosely related results through —
// surname-only matching was the worst of it: "Khan" alone matched Imran
// Khan, and even requiring the full name still can't distinguish "Afzal
// Khan" from someone else's longer name that happens to contain those two
// words, like "Sher Afzal Khan Marwat" or "Aayan Afzal Khan". Headlines
// vary in capitalisation by publisher (sentence case vs. title case) so
// this can't be bulletproof, but checking that neither word immediately
// next to the match looks like part of a longer name — rather than a
// common headline word (a title, a party, "MP", a verb like "says") —
// catches the great majority of same-name false positives that a bare
// substring check let through.
const SAFE_NEIGHBOUR_WORDS = new Set([
  "mp", "mps", "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "by", "for", "with", "from", "as",
  "is", "are", "was", "were", "says", "said", "say", "slams", "blasts", "defends", "backs", "urges", "calls", "warns",
  "demands", "vows", "hits", "out", "meets", "meet", "labour", "conservative", "tory", "tories", "snp", "green",
  "libdem", "lib", "dem", "dems", "reform", "independent", "dup", "sinn", "fein", "sir", "dame", "dr", "mr", "mrs",
  "ms", "rt", "hon", "lord", "lady", "minister", "secretary", "chancellor", "pm", "prime", "leader", "shadow",
  "former", "ex", "new", "veteran", "senior", "backbench", "chief", "deputy", "co", "vs", "v", "why", "how", "what",
  "who", "when", "after", "before", "over", "under", "amid", "against", "despite", "during", "this", "that", "his",
  "her", "their", "its", "it's", "uk", "us", "eu", "ni", "tv", "obe", "mbe", "cbe", "qc", "kc", "at", "no", "yes",
]);

function neighbourLooksLikeName(word) {
  if (!word) return false;
  const clean = word.replace(/[^a-zA-Z']/g, "");
  if (clean.length < 2) return false;
  return !SAFE_NEIGHBOUR_WORDS.has(clean.toLowerCase());
}

// A second, different failure mode from the "embedded in a longer name"
// one above: an MP's exact full name genuinely belongs to someone else
// entirely — a footballer, an actor — and nothing about the name itself
// gives that away. "Alberto Costa" is both a Conservative MP and a
// footballer Manchester United and Arsenal have been linked with; only
// the surrounding words tell the two apart. This doesn't try to require a
// political keyword on every headline (most legitimate coverage doesn't
// use one), just rejects a match where the headline is unambiguously
// about sport, film or music and carries no political signal at all.
const NON_POLITICAL_CONTEXT = [
  "transfer", "striker", "midfielder", "goalkeeper", "defender", "midfield", "football club",
  "premier league", "champions league", "match report", "loan move", "signing for", "box office",
  "album", "single", "tour dates", "film review", "tv series", "starring role", "season finale",
  "west end", "wins gold", "world cup", "olympics", "grand prix", "wimbledon", "keeping tabs on",
  "manchester united", "man utd", "man united", "arsenal", "chelsea fc", "liverpool fc",
  "manchester city", "man city", "tottenham", "newcastle united", "aston villa", "west ham",
  "everton", "wolverhampton wanderers", "crystal palace fc", "brighton and hove albion",
  "nottingham forest", "sheffield united", "leeds united", "leicester city", "for sale", "auction",
  "print by", "artwork by", "painting by",
];
const POLITICAL_CONTEXT = [
  "mp", "mps", "labour", "conservative", "tory", "tories", "parliament", "commons", "lords",
  "minister", "government", "westminster", "constituency", "snp", "libdem", "lib dem", "reform uk",
  "secretary of state", "downing street", "whitehall", "cabinet", "shadow", "by-election",
];

function hasUnrelatedContext(headline) {
  const lower = headline.toLowerCase();
  const hasNonPolitical = NON_POLITICAL_CONTEXT.some((w) => lower.includes(w));
  if (!hasNonPolitical) return false;
  return !POLITICAL_CONTEXT.some((w) => lower.includes(w));
}

function isLikelyMatch(headline, mpName) {
  const name = mpName.trim();
  if (!name) return true;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = headline.match(new RegExp(`\\b${escaped}\\b`, "i"));
  if (!match) return false;
  if (hasUnrelatedContext(headline)) return false;

  // A "headline" that's nothing but the name itself (occasionally an
  // aggregator's bare listing entry rather than a real story) gives no
  // context at all to judge relevance from — safer to drop it than show
  // it as if it were an actual news story about them.
  const remainder = (headline.slice(0, match.index) + headline.slice(match.index + match[0].length))
    .replace(/[^a-zA-Z0-9]/g, "");
  if (!remainder) return false;

  const before = headline.slice(0, match.index).trim().split(/\s+/).pop();
  const after = headline.slice(match.index + match[0].length).trim().split(/\s+/)[0];
  return !neighbourLooksLikeName(before) && !neighbourLooksLikeName(after);
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
        .filter((item) => isLikelyMatch(item.headline, mp.name))
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
