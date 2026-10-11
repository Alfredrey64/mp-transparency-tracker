// newsFeed.js
//
// The pure parts of fetch-mp-news.js, kept apart (no Supabase client, no network) so they can be tested: reading Google News'
// RSS, telling a real feed from an error or consent page, and tidying the articles that come out of it.

const NAMED = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">", rsquo: "’", lsquo: "‘", ndash: "–", mdash: "—", hellip: "…" };

export function decodeEntities(text) {
  return String(text)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => safeCodePoint(parseInt(h, 16), m))
    .replace(/&#(\d+);/g, (m, d) => safeCodePoint(Number(d), m))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function safeCodePoint(n, fallback) {
  try {
    return String.fromCodePoint(n);
  } catch {
    return fallback;
  }
}

// A page that is actually an RSS feed, as opposed to an HTML error or consent page returned with a 200 status. An empty feed is
// still a feed: it means "no coverage", whereas anything else means "we did not get an answer" and must not wipe stored articles.
export function looksLikeFeed(xml) {
  return typeof xml === "string" && /<rss[\s>]/i.test(xml) && /<channel[\s>]/i.test(xml);
}

const webUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

export function parseItems(xml) {
  const items = [];
  for (const block of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const sourceName = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1];
    if (!title || !link || !pubDate) continue;

    const published = new Date(pubDate.trim());
    const url = webUrl(decodeEntities(link));
    if (Number.isNaN(published.getTime()) || !url) continue;

    let headline = decodeEntities(title);
    const source = sourceName ? decodeEntities(sourceName) : null;
    // Google News titles read "Headline - Source Name"; the source is shown separately.
    if (source && headline.endsWith(` - ${source}`)) headline = headline.slice(0, -(source.length + 3));
    if (!headline) continue;

    items.push({ headline, source: source ?? "Unknown source", url, published_date: published.toISOString() });
  }
  return items;
}

// Newest first, with the same story from several outlets (or the same link twice) shown once, and nothing dated in the future
// or older than the window.
export function tidyItems(items, { now = Date.now(), windowDays = 14, limit = 3 } = {}) {
  const oldest = now - windowDays * 86_400_000;
  const seen = new Set();
  const out = [];
  const fresh = items
    .filter((i) => {
      const t = new Date(i.published_date).getTime();
      return t >= oldest && t <= now + 3_600_000;
    })
    .sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
  for (const item of fresh) {
    const key = item.headline.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key) || seen.has(item.url)) continue;
    seen.add(key);
    seen.add(item.url);
    out.push(item);
    if (out.length === limit) break;
  }
  return out;
}
