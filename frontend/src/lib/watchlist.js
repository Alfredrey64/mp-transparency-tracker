// A per-visitor "MPs I'm following" list, kept in localStorage only — no
// account, no server round-trip. Stores just enough to render a link back
// to the MP without refetching (id, name, party, party_colour,
// constituency, thumbnail_url), since the point is a fast, self-contained
// widget on the homepage, not a live-synced record.
const STORAGE_KEY = "mp-tracker-watchlist";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private browsing / storage disabled — the toggle just won't persist.
  }
}

export function getWatchlist() {
  return readAll();
}

export function isWatched(politicianId) {
  return readAll().some((p) => p.id === politicianId);
}

export function toggleWatch(politician) {
  const list = readAll();
  const exists = list.some((p) => p.id === politician.id);
  const next = exists
    ? list.filter((p) => p.id !== politician.id)
    : [
        ...list,
        {
          id: politician.id,
          name: politician.name,
          party: politician.party,
          party_colour: politician.party_colour,
          constituency: politician.constituency,
          thumbnail_url: politician.thumbnail_url,
        },
      ];
  writeAll(next);
  return !exists;
}

export function removeFromWatchlist(politicianId) {
  writeAll(readAll().filter((p) => p.id !== politicianId));
}
