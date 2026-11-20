// repLinks.js — the small rules fetch-rep-links.js uses, kept apart so they can be tested without a network.

const plain = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

// The part of an office's name that says which place it is for: "Mayor of Greater Manchester" -> "greater manchester", "Cambridgeshire and Peterborough Combined Authority" -> the same without "combined authority".
export const placeOf = (s) => plain(s).replace(/^(the )?(directly elected )?mayor of( the)? /, "").replace(/ (combined|county combined|strategic) authority$/, "").replace(/ police( fire)?( and crime)? commissioner$/, "").replace(/^(police( fire)?( and crime)? commissioner for )/, "").trim();

const STOP = new Set(["and", "the", "of", "for", "isles", "scilly", "city", "region", "mayor", "police", "fire", "crime", "commissioner", "combined", "county", "strategic", "authority"]);
const words = (s) => new Set(plain(s).split(" ").filter((w) => w && !STOP.has(w)));
const within = (a, b) => a.size > 0 && [...a].every((w) => b.has(w));

// Of the offices a person has held (Wikidata "position held" items, each with the office's own website when Wikidata records one), the one that is this seat's office.
// `positions` are { label, url }; `want` is { kind: "pcc" | "mayor", place }. Returns the office's website or null. A label has to be the right kind of office AND name the same place,
// allowing for the two lists' different wording ("Devon, Cornwall and The Isles of Scilly" / "Devon and Cornwall"), so a person who also held some other post is never given that
// post's website.
export function officeSite(positions, want) {
  const place = words(placeOf(want.place));
  if (!place.size) return null;
  const kindOk = want.kind === "pcc" ? /commissioner/ : /mayor/;
  for (const p of positions) {
    const label = plain(p.label);
    if (!p.url || !kindOk.test(label)) continue;
    const there = words(placeOf(p.label));
    if (within(there, place) || within(place, there)) return p.url;
  }
  return null;
}

// A web address safe to show as a link: https only (an http address is upgraded when the caller says https works), no fragment, no query, no credentials.
export function cleanUrl(u) {
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol) || x.username || x.password) return null;
    x.hash = ""; x.search = "";
    return x.toString();
  } catch { return null; }
}
