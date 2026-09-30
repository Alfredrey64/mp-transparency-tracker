// newsMatching.js
//
// Pure headline-relevance matching for fetch-mp-news.js, kept in its own
// module (no Supabase client, no env vars, no network calls) specifically
// so it can be imported for tests without side effects — fetch-mp-news.js
// itself creates a real Supabase client at module load time, which throws
// immediately in any environment without real credentials (CI included).

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

export function isLikelyMatch(headline, mpName) {
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
